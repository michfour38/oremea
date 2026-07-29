import { auth } from "@clerk/nextjs/server"
import { NextResponse } from "next/server"

import { prisma } from "@/lib/prisma"
import { createEmptyCompassEndingState } from "@/src/lib/compass/ending/ending-types"
import { runELConversation } from "@/src/lib/el"

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const product = body.product ?? "compass"
    const stage = body.stage ?? "discussion"

    const result = await runELConversation({
      product,
      stage,
      contextBlocks: body.contextBlocks ?? [],
      conversation: body.conversation ?? [],
      latestAnswer: body.latestAnswer ?? "",
    })

    if (!result) {
      if (product === "compass" && stage === "discussion") {
        return NextResponse.json({
          ok: true,
          result: {
            reply:
              "Compass hit a processing pause. Your reply is still part of the conversation. Continue from there when you're ready.",
            shouldContinue: true,
            suggestedNextStep: null,
            scopeCategory: "in_scope",
            movementReady: false,
            retirePriorFrame: false,
          },
        })
      }

      return NextResponse.json(
        { ok: false, error: "EL conversation returned no result." },
        { status: 500 },
      )
    }

    if (
      product === "compass" &&
      stage === "discussion" &&
      result.scopeCategory
    ) {
      const { userId } = auth()

      if (userId) {
        const session = await prisma.compass_sessions.findFirst({
          where: {
            user_id: userId,
            status: "active",
          },
          orderBy: {
            updated_at: "desc",
          },
        })

        if (session) {
          const existing: Record<string, unknown> =
            session.detected_patterns &&
            typeof session.detected_patterns === "object" &&
            !Array.isArray(session.detected_patterns) &&
            (session.detected_patterns as Record<string, unknown>).version === 1
              ? (session.detected_patterns as Record<string, unknown>)
              : (createEmptyCompassEndingState(session.selected_area) as unknown as Record<
                  string,
                  unknown
                >)

          const outsideScope = result.scopeCategory !== "in_scope"
          const retirePriorFrame = result.retirePriorFrame === true
          const existingMovements = Array.isArray(existing.movements)
            ? existing.movements
            : []
          const movements = retirePriorFrame
            ? existingMovements.map((movement) => {
                if (!movement || typeof movement !== "object") return movement
                const row = movement as Record<string, unknown>
                return row.status === "active"
                  ? { ...row, status: "replaced" }
                  : movement
              })
            : existingMovements

          await prisma.compass_sessions.update({
            where: { id: session.id },
            data: {
              detected_patterns: {
                ...existing,
                version: 1,
                selectedArea: session.selected_area,
                scopeCategory: result.scopeCategory,
                movementReady: outsideScope ? false : result.movementReady === true,
                movements,
                currentMovementId:
                  outsideScope || retirePriorFrame
                    ? null
                    : (existing.currentMovementId ?? null),
                reframe:
                  outsideScope || retirePriorFrame
                    ? null
                    : (existing.reframe ?? null),
                followUpQuestion: null,
                updatedAt: new Date().toISOString(),
              } as object,
            },
          })
        }
      }
    }

    return NextResponse.json({
      ok: true,
      result,
    })
  } catch (error) {
    console.error("POST /api/el/conversation failed:", error)

    return NextResponse.json(
      {
        ok: false,
        error:
          error instanceof Error
            ? error.message
            : "Unknown EL conversation error.",
      },
      { status: 500 },
    )
  }
}
