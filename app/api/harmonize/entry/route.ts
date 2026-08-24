import { auth } from "@clerk/nextjs/server"
import { NextResponse } from "next/server"

import { prisma } from "@/lib/prisma"
import { reviewSharedMessage } from "@/lib/harmonize/share-review"
import { buildReckoningGuidance } from "@/src/lib/harmonize/reckoning-guidance"
import { createWitnessAnchorFromEntry } from "@/src/lib/harmonize/witness-anchor-service"
import { rebuildWitnessAnchorRelationships } from "@/src/lib/harmonize/witness-anchor-relationship-service"

export const dynamic = "force-dynamic"

const ALLOWED_SCOPES = [
  "private",
  "shared",
  "pause",
  "system",
] as const

type AllowedScope = (typeof ALLOWED_SCOPES)[number]

function isAllowedScope(
  value: unknown,
): value is AllowedScope {
  return (
    typeof value === "string" &&
    ALLOWED_SCOPES.includes(value as AllowedScope)
  )
}

export async function POST(request: Request) {
  try {
    const { userId } = await auth()

    if (!userId) {
      return NextResponse.json(
        {
          success: false,
          error: "Unauthorized",
        },
        {
          status: 401,
        },
      )
    }

    const body = await request.json()

    const cycleId =
      typeof body.cycleId === "string"
        ? body.cycleId.trim()
        : ""

    const scope = body.scope

    const content =
      typeof body.content === "string"
        ? body.content.trim()
        : ""

    const questionKey =
      typeof body.questionKey === "string"
        ? body.questionKey.trim() || null
        : null

    const promptText =
      typeof body.promptText === "string"
        ? body.promptText.trim() || null
        : null

    const phase =
      typeof body.phase === "string"
        ? body.phase.trim() || null
        : null

    if (!cycleId || !scope || !content) {
      return NextResponse.json(
        {
          success: false,
          error: "Missing cycleId, scope, or content",
        },
        {
          status: 400,
        },
      )
    }

    if (!isAllowedScope(scope)) {
      return NextResponse.json(
        {
          success: false,
          error: "Invalid scope",
        },
        {
          status: 400,
        },
      )
    }

    const cycle =
      await prisma.harmonize_cycles.findUnique({
        where: {
          id: cycleId,
        },
        include: {
          systems: {
            include: {
              participants: true,
            },
          },
        },
      })

    if (!cycle) {
      return NextResponse.json(
        {
          success: false,
          error: "Cycle not found",
        },
        {
          status: 404,
        },
      )
    }

    const participant =
      cycle.systems.participants.find(
        (candidate) =>
          candidate.profile_id === userId &&
          candidate.active,
      )

    if (!participant) {
      return NextResponse.json(
        {
          success: false,
          error:
            "You are not a participant in this cycle",
        },
        {
          status: 403,
        },
      )
    }

    /*
     * Private witness material remains raw.
     *
     * Relational assessment begins only when the
     * participant asks another person to receive the
     * message.
     */
    const shareReview =
      scope === "shared"
        ? reviewSharedMessage(content)
        : null

    if (
      scope === "shared" &&
      shareReview?.requiresReview
    ) {
      /*
       * The deterministic ladder question is always
       * available.
       *
       * EL may contextualise it, but EL failure must
       * never permit the message through or turn the
       * blocked submission into a generic server error.
       */
      let guidance =
        shareReview.nextQuestion ||
        "What part of this response belongs to you?"

      try {
        const privateEntries =
          await prisma.harmonize_entries.findMany({
            where: {
              cycle_id: cycleId,
              participant_id: participant.id,
              scope: "private",
            },
            orderBy: {
              created_at: "asc",
            },
            select: {
              content: true,
              prompt_text: true,
            },
          })

        guidance = await buildReckoningGuidance({
          draft: content,
          assessment: shareReview,
          privateEntries: privateEntries.map(
            (entry) => ({
              content: entry.content,
              promptText: entry.prompt_text,
            }),
          ),
        })
      } catch (guidanceError) {
        console.error(
          "Reckoning guidance generation failed:",
          {
            cycleId,
            participantId: participant.id,
            riskType: shareReview.riskType,
            error: guidanceError,
          },
        )
      }

      /*
       * Nothing is persisted.
       *
       * The message remains entirely with the sender
       * until their revised words pass the assessment.
       */
      return NextResponse.json(
        {
          success: false,
          code: "RECKONING_REQUIRED",
          error:
            "This message needs further reckoning before it can be shared.",
          assessment: {
            ...shareReview,
            guidance,
          },
        },
        {
          status: 422,
        },
      )
    }

    const entry =
      await prisma.harmonize_entries.create({
        data: {
          cycle_id: cycleId,
          participant_id: participant.id,
          scope,
          content,
          question_key: questionKey,
          prompt_text: promptText,
          phase,
          share_risk_level:
            shareReview?.riskLevel ?? 0,
          requires_review_before_send: false,
        },
      })

    /*
     * Only private witness entries may contribute to the
     * participant's private anchor map.
     */
    let witnessAnchorUpdated = false

    if (scope === "private") {
      try {
        const anchor =
          await createWitnessAnchorFromEntry({
            cycleId: entry.cycle_id,
            entryId: entry.id,
            content: entry.content,
          })

        if (anchor) {
          await rebuildWitnessAnchorRelationships(
            entry.cycle_id,
          )

          witnessAnchorUpdated = true
        }
      } catch (anchorError) {
        /*
         * The entry has already been saved.
         *
         * Do not return a failure that could cause the
         * client to retry and create a duplicate entry.
         */
        console.error(
          "Witness-anchor enrichment failed:",
          {
            entryId: entry.id,
            cycleId: entry.cycle_id,
            error: anchorError,
          },
        )
      }
    }

    return NextResponse.json({
      success: true,
      entry,
      shareReview,
      witnessAnchorUpdated,
    })
  } catch (error) {
    console.error(
      "POST /api/harmonize/entry failed:",
      error,
    )

    return NextResponse.json(
      {
        success: false,
        error:
          error instanceof Error
            ? error.message
            : "Failed to save Harmonize entry",
      },
      {
        status: 500,
      },
    )
  }
}