import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";

import { prisma } from "@/lib/prisma";
import { getCompassAccessState } from "@/src/lib/compass/compass-access";

export const dynamic = "force-dynamic";

type StoredMapItem = {
  id?: unknown;
  status?: unknown;
  [key: string]: unknown;
};

export async function POST(request: Request) {
  try {
    const { userId } = await auth();

    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (!(await getCompassAccessState(userId)).active) {
      return NextResponse.json(
        { error: "Compass access has ended." },
        { status: 403 },
      );
    }

    const body = await request.json();
    const itemIds: string[] = Array.isArray(body?.itemIds)
      ? body.itemIds.filter((value: unknown): value is string =>
          typeof value === "string" && value.length > 0,
        )
      : [];

    if (itemIds.length === 0 || itemIds.length > 100) {
      return NextResponse.json(
        { error: "A valid Map order is required." },
        { status: 400 },
      );
    }

    if (new Set(itemIds).size !== itemIds.length) {
      return NextResponse.json(
        { error: "The Map order contains duplicate items." },
        { status: 400 },
      );
    }

    const session = await prisma.compass_sessions.findFirst({
      where: {
        user_id: userId,
        status: "active",
      },
      orderBy: {
        updated_at: "desc",
      },
    });

    if (!session) {
      return NextResponse.json(
        { error: "No active Compass session." },
        { status: 404 },
      );
    }

    if (
      !session.detected_patterns ||
      typeof session.detected_patterns !== "object" ||
      Array.isArray(session.detected_patterns)
    ) {
      return NextResponse.json(
        { error: "The current Map is not available yet." },
        { status: 409 },
      );
    }

    const state = {
      ...(session.detected_patterns as Record<string, unknown>),
    };
    const mapItems = Array.isArray(state.mapItems)
      ? (state.mapItems as StoredMapItem[])
      : [];
    const activeItems = mapItems.filter(
      (item) => item.status === "active" || item.status === "waiting",
    );
    const historicalItems = mapItems.filter(
      (item) => item.status === "completed" || item.status === "released",
    );
    const activeIds = activeItems
      .map((item) => item.id)
      .filter((value): value is string => typeof value === "string");

    if (
      itemIds.length !== activeIds.length ||
      itemIds.some((id: string) => !activeIds.includes(id))
    ) {
      return NextResponse.json(
        { error: "The Map changed while it was being reordered. Refresh and try again." },
        { status: 409 },
      );
    }

    const byId = new Map<string, StoredMapItem>(
      activeItems
        .filter((item): item is StoredMapItem & { id: string } =>
          typeof item.id === "string",
        )
        .map((item) => [item.id, item]),
    );
    const orderedItems = itemIds
      .map((id: string) => byId.get(id))
      .filter((item: StoredMapItem | undefined): item is StoredMapItem => Boolean(item));
    const movements = Array.isArray(state.movements)
      ? (state.movements as Array<Record<string, unknown>>)
      : [];

    const nextState = {
      ...state,
      mapItems: [...orderedItems, ...historicalItems],
      mapReviewed: false,
      movements: movements.map((movement) =>
        movement.status === "active"
          ? { ...movement, status: "replaced" }
          : movement,
      ),
      currentMovementId: null,
      resolutionCandidate: null,
      resolutionConfirmed: false,
      resolutionConfirmedAt: null,
      updatedAt: new Date().toISOString(),
    };

    await prisma.compass_sessions.update({
      where: { id: session.id },
      data: {
        detected_patterns: nextState as object,
        resolution_text: null,
        resolution_confirmed_at: null,
        final_step: null,
        final_step_confirmed_at: null,
      },
    });

    return NextResponse.json({ success: true, state: nextState });
  } catch (error) {
    console.error("POST /api/compass/ending/reorder failed:", error);
    return NextResponse.json(
      { error: "Compass could not save the new Map order." },
      { status: 500 },
    );
  }
}
