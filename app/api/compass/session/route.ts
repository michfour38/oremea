import { Prisma } from "@prisma/client";
import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";

import { prisma } from "@/lib/prisma";
import { createEmptyCompassEndingState } from "@/src/lib/compass/ending/ending-types";
import {
  completeCompassSession,
  getActiveCompassSession,
  saveCompassSession,
} from "@/src/lib/compass/session/session-persistence";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const { userId } = auth();

    if (!userId) {
      return NextResponse.json(
        { session: null },
        { status: 401 },
      );
    }

    const session = await getActiveCompassSession(userId);

    return NextResponse.json({
      success: true,
      session,
    });
  } catch (error) {
    console.error("GET /api/compass/session failed:", error);

    return NextResponse.json(
      {
        success: false,
        session: null,
      },
      { status: 500 },
    );
  }
}

export async function POST(request: Request) {
  try {
    const { userId } = auth();

    if (!userId) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 },
      );
    }

    const body = await request.json();

    if (body.action === "new_discussion") {
      const existing = await getActiveCompassSession(userId);
      const currentGoals = Array.isArray(existing?.area_responses)
        ? existing.area_responses
        : [];

      if (!existing || currentGoals.length < 8) {
        return NextResponse.json(
          { error: "A complete Compass goal set is required first." },
          { status: 409 },
        );
      }

      const discussionMessages = [
        {
          role: "compass",
          content: "What has your attention now?",
        },
      ];

      const session = await prisma.compass_sessions.update({
        where: { id: existing.id },
        data: {
          phase: "discussion",
          recursive_layers: [],
          possibility_answers: [],
          resistance_map: Prisma.JsonNull,
          discussion_messages: discussionMessages,
          proposed_step: null,
          final_step: null,
          detected_patterns: createEmptyCompassEndingState(
            existing.selected_area,
          ) as object,
        },
      });

      return NextResponse.json({
        success: true,
        session,
      });
    }

    const session = await saveCompassSession({
      userId,
      phase: body.phase,
      selectedArea: body.selectedArea,
      areaResponses: body.areaResponses,
      recursiveLayers: body.recursiveLayers,
      possibilityAnswers: body.possibilityAnswers,
      resistanceMap: body.resistanceMap,
      discussionMessages: body.discussionMessages,
      proposedStep: body.proposedStep,
      finalStep: body.finalStep,
    });

    if (body.phase === "complete") {
      await completeCompassSession(userId);
    }

    return NextResponse.json({
      success: true,
      session,
    });
  } catch (error) {
    console.error("POST /api/compass/session failed:", error);

    return NextResponse.json(
      {
        success: false,
        error: "Failed to save Compass session",
      },
      { status: 500 },
    );
  }
}
