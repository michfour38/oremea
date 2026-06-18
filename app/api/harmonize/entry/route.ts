import { createWitnessAnchorFromEntry } from "@/src/lib/harmonize/witness-anchor-service";
import { rebuildWitnessAnchorRelationships } from "@/src/lib/harmonize/witness-anchor-relationship-service";
import { auth } from "@clerk/nextjs/server"
import { NextResponse } from "next/server"

import { prisma } from "@/lib/prisma"

export const dynamic = "force-dynamic"

export async function POST(request: Request) {
  try {
    const { userId } = auth()

    if (!userId) {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 },
      )
    }

    const body = await request.json()

    const cycleId = body.cycleId
    const scope = body.scope
    const content =
      typeof body.content === "string"
        ? body.content.trim()
        : ""

const questionKey =
  typeof body.questionKey === "string" ? body.questionKey.trim() : null

const promptText =
  typeof body.promptText === "string" ? body.promptText.trim() : null

const phase =
  typeof body.phase === "string" ? body.phase.trim() : null

    if (!cycleId || !scope || !content) {
      return NextResponse.json(
        {
          success: false,
          error: "Missing cycleId, scope, or content",
        },
        { status: 400 },
      )
    }

    const cycle = await prisma.harmonize_cycles.findUnique({
      where: { id: cycleId },
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
        { success: false, error: "Cycle not found" },
        { status: 404 },
      )
    }

    const participant = cycle.systems.participants.find(
      (p) => p.profile_id === userId && p.active,
    )

    if (!participant) {
      return NextResponse.json(
        {
          success: false,
          error: "You are not a participant in this cycle",
        },
        { status: 403 },
      )
    }

    const entry = await prisma.harmonize_entries.create({
  data: {
    cycle_id: cycleId,
    participant_id: participant.id,
    scope,
    content,
    question_key: questionKey,
    prompt_text: promptText,
    phase,
  },
});

const anchor = await createWitnessAnchorFromEntry({
  cycleId: entry.cycle_id,
  entryId: entry.id,
  content: entry.content,
});

if (anchor) {
  await rebuildWitnessAnchorRelationships(entry.cycle_id);
}

    return NextResponse.json({
      success: true,
      entry,
    })
  } catch (error) {
    console.error(error)

    return NextResponse.json(
      {
        success: false,
        error:
          error instanceof Error
            ? error.message
            : "Failed to save entry",
      },
      { status: 500 },
    )
  }
}