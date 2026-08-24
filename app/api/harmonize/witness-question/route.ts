import { auth } from "@clerk/nextjs/server"
import { NextResponse } from "next/server"

import { prisma } from "@/lib/prisma"
import { runELConversation } from "@/src/lib/el"
import { privateWitnessEngine } from "@/src/lib/harmonize/private-witness-engine"
import {
  buildWitnessContextBlocks,
  buildWitnessConversation,
} from "@/src/lib/harmonize/witness-context-builder"

export const dynamic = "force-dynamic"

function buildWitnessFailureQuestion(latestAnswer: string): string {
  const answer = latestAnswer.trim()

  if (!answer) {
    return "Tell me what happened."
  }

  if (
    /become who i am|who i am|everything i was|cost everything/i.test(answer)
  ) {
    return "You named a cost that sounds like identity, not inconvenience. What part of becoming who you are feels most expensive?"
  }

  if (
    /children|kids|team|provide|house|clothing|responsibility/i.test(answer)
  ) {
    return "You are describing responsibility becoming visible. What would you have to carry alone if the other person were fully out of the picture?"
  }

  if (
    /consent|saying no|take what he wants|coerced|forces/i.test(answer)
  ) {
    return "You are describing consent being overridden. What changes when your no is treated as something to overcome?"
  }

  if (/repair|forgiveness|all is well|sex/i.test(answer)) {
    return "You are describing a place where physical access is being mistaken for repair. What still has not been repaired?"
  }

  return "Something important appeared here, but it should not be reduced too quickly. What part of this would change your life if it became fully true?"
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

    if (!cycleId) {
      return NextResponse.json(
        {
          success: false,
          error: "Missing cycleId",
        },
        {
          status: 400,
        },
      )
    }

    const cycle = await prisma.harmonize_cycles.findUnique({
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

    const participant = cycle.systems.participants.find(
      (candidate) =>
        candidate.profile_id === userId &&
        candidate.active,
    )

    if (!participant) {
      return NextResponse.json(
        {
          success: false,
          error: "You are not a participant in this cycle",
        },
        {
          status: 403,
        },
      )
    }

    /*
     * Private witness entries must be loaded only after the
     * authenticated participant has been identified.
     *
     * One participant's private witness material must never
     * enter another participant's EL conversation or context.
     */
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

    const entries = privateEntries.map((entry) => ({
      content: entry.content,
      prompt_text: entry.prompt_text,
    }))

    const witness = privateWitnessEngine(entries)

    const latestAnswer =
      entries[entries.length - 1]?.content ?? ""

    const result = await runELConversation({
      product: "harmonize",
      stage: "private_witness",
      latestAnswer,
      conversation: buildWitnessConversation(entries),
      contextBlocks: buildWitnessContextBlocks({
        entries,
        anchorDefinition: witness.anchorDefinition,
        strongestSignal: witness.strongestSignal,
      }),
    })

    if (!result?.reply) {
      console.warn("WITNESS FALLBACK USED", {
        cycleId,
        participantId: participant.id,
        latestAnswer,
        anchor:
          witness.anchorDefinition?.anchor ?? null,
        signalSource:
          witness.strongestSignal?.source ?? null,
      })
    }

    return NextResponse.json({
      success: true,
      nextQuestion:
        result?.reply ||
        buildWitnessFailureQuestion(latestAnswer),
      readyForSharedSpace:
        witness.readyForSharedSpace,
    })
  } catch (error) {
    console.error(
      "POST /api/harmonize/witness-question failed:",
      error,
    )

    return NextResponse.json(
      {
        success: false,
        error:
          error instanceof Error
            ? error.message
            : "Failed to generate witness question",
      },
      {
        status: 500,
      },
    )
  }
}