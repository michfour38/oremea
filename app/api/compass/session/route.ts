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

    const activeSession = await getActiveCompassSession(userId);
    const session =
      activeSession ??
      (await prisma.compass_sessions.findFirst({
        where: {
          user_id: userId,
          status: "complete",
        },
        orderBy: {
          updated_at: "desc",
        },
      }));

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
      const activeSession = await getActiveCompassSession(userId);
      const sourceSession =
        activeSession ??
        (await prisma.compass_sessions.findFirst({
          where: {
            user_id: userId,
            status: "complete",
          },
          orderBy: {
            updated_at: "desc",
          },
        }));
      const currentGoals = Array.isArray(sourceSession?.area_responses)
        ? sourceSession.area_responses
        : [];

      if (!sourceSession || currentGoals.length < 8) {
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

      const session = await prisma.$transaction(async (transaction) => {
        if (sourceSession.status === "active") {
          await transaction.compass_sessions.update({
            where: { id: sourceSession.id },
            data: { status: "complete" },
          });
        }

        return transaction.compass_sessions.create({
          data: {
            user_id: userId,
            status: "active",
            phase: "discussion",
            selected_area: null,
            area_responses: currentGoals as Prisma.InputJsonValue,
            recursive_layers: [],
            possibility_answers: [],
            resistance_map: Prisma.JsonNull,
            discussion_messages: discussionMessages,
            proposed_step: null,
            final_step: null,
            detected_patterns: createEmptyCompassEndingState(
              null,
            ) as Prisma.InputJsonValue,
          },
        });
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
