import { Prisma } from "@prisma/client";
import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";

import { prisma } from "@/lib/prisma";
import {
  createEmptyCompassEndingState,
  type CompassEndingState,
  type CompassMapItem,
} from "@/src/lib/compass/ending/ending-types";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  try {
    const { userId } = auth();

    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const sourceSessionId =
      typeof body.sourceSessionId === "string" ? body.sourceSessionId : "";
    const itemId = typeof body.itemId === "string" ? body.itemId : "";

    if (!sourceSessionId || !itemId) {
      return NextResponse.json(
        { error: "A Compass goal is required." },
        { status: 400 },
      );
    }

    const sourceSession = await prisma.compass_sessions.findFirst({
      where: {
        id: sourceSessionId,
        user_id: userId,
        status: {
          in: ["active", "complete"],
        },
      },
    });

    if (!sourceSession) {
      return NextResponse.json(
        { error: "That Compass run is no longer available." },
        { status: 404 },
      );
    }

    const sourceState = readState(
      sourceSession.detected_patterns,
      sourceSession.selected_area,
    );
    const sourceItem = sourceState.mapItems.find((item) => item.id === itemId);

    if (!sourceItem) {
      return NextResponse.json(
        { error: "That goal is no longer available in the archive." },
        { status: 404 },
      );
    }

    const activeSession = await prisma.compass_sessions.findFirst({
      where: {
        user_id: userId,
        status: "active",
      },
      orderBy: {
        updated_at: "desc",
      },
    });

    const now = new Date().toISOString();
    let nextState: CompassEndingState;
    let sessionId: string;

    if (activeSession) {
      const targetState = readState(
        activeSession.detected_patterns,
        activeSession.selected_area,
      );

      nextState = restoreItemIntoState(
        targetState,
        sourceItem,
        now,
        activeSession.id === sourceSession.id,
      );
      sessionId = activeSession.id;

      await prisma.compass_sessions.update({
        where: { id: activeSession.id },
        data: {
          detected_patterns:
            nextState as unknown as Prisma.InputJsonValue,
          resolution_text: null,
          resolution_confirmed_at: null,
          final_step: null,
          final_step_confirmed_at: null,
        },
      });
    } else {
      const restoredArea = sourceItem.area ?? sourceSession.selected_area;
      const emptyState = createEmptyCompassEndingState(restoredArea);

      nextState = restoreItemIntoState(
        emptyState,
        sourceItem,
        now,
        false,
      );

      const created = await prisma.compass_sessions.create({
        data: {
          user_id: userId,
          status: "active",
          phase: "discussion",
          selected_area: restoredArea,
          area_responses:
            (sourceSession.area_responses ?? []) as Prisma.InputJsonValue,
          recursive_layers: [],
          possibility_answers: [],
          resistance_map: Prisma.JsonNull,
          discussion_messages: [
            {
              role: "compass",
              content: "What has your attention now?",
            },
          ],
          proposed_step: null,
          final_step: null,
          detected_patterns:
            nextState as unknown as Prisma.InputJsonValue,
        },
      });
      sessionId = created.id;
    }

    return NextResponse.json({
      success: true,
      sessionId,
      state: nextState,
    });
  } catch (error) {
    console.error("POST /api/compass/map/restore failed:", error);
    return NextResponse.json(
      { error: "Compass could not return this goal to the Map yet." },
      { status: 500 },
    );
  }
}

function restoreItemIntoState(
  state: CompassEndingState,
  sourceItem: CompassMapItem,
  now: string,
  preserveSourceMessageIndex: boolean,
): CompassEndingState {
  const normalizedContent = normalize(sourceItem.content);
  const existingItem = state.mapItems.find(
    (item) => normalize(item.content) === normalizedContent,
  );

  const mapItems = existingItem
    ? state.mapItems.map((item) =>
        item.id === existingItem.id
          ? {
              ...item,
              status: "active" as const,
              completedAt: null,
            }
          : item,
      )
    : [
        ...state.mapItems,
        {
          ...sourceItem,
          id: crypto.randomUUID(),
          status: "active" as const,
          completedAt: null,
          sourceMessageIndex: preserveSourceMessageIndex
            ? sourceItem.sourceMessageIndex
            : null,
        },
      ];

  return {
    ...state,
    mapItems,
    mapReviewed: false,
    resolutionCandidate: null,
    resolutionConfirmed: false,
    resolutionConfirmedAt: null,
    updatedAt: now,
  };
}

function readState(
  value: unknown,
  selectedArea: string | null,
): CompassEndingState {
  const empty = createEmptyCompassEndingState(selectedArea);

  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return empty;
  }

  const row = value as Record<string, unknown>;
  if (row.version !== 1) return empty;

  return {
    ...empty,
    selectedArea:
      typeof row.selectedArea === "string" ? row.selectedArea : selectedArea,
    mapItems: Array.isArray(row.mapItems)
      ? (row.mapItems as CompassMapItem[])
      : [],
    mapReviewed: row.mapReviewed === true,
    movements: Array.isArray(row.movements)
      ? (row.movements as CompassEndingState["movements"])
      : [],
    currentMovementId:
      typeof row.currentMovementId === "string"
        ? row.currentMovementId
        : null,
    reframe: typeof row.reframe === "string" ? row.reframe : null,
    followUpQuestion:
      typeof row.followUpQuestion === "string"
        ? row.followUpQuestion
        : null,
    movementReady: row.movementReady === true,
    scopeCategory: empty.scopeCategory,
    discussionCount:
      typeof row.discussionCount === "number" ? row.discussionCount : 0,
    updatedAt:
      typeof row.updatedAt === "string" ? row.updatedAt : empty.updatedAt,
  };
}

function normalize(value: string) {
  return value.trim().toLocaleLowerCase().replace(/\s+/g, " ");
}
