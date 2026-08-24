import { auth } from "@clerk/nextjs/server"
import { NextResponse } from "next/server"

import { prisma } from "@/lib/prisma"

export const dynamic = "force-dynamic"

export async function POST(request: Request) {
  try {
    const { userId } = await auth()

    if (!userId) {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 },
      )
    }

    const body = await request.json()

    const cycleId =
      typeof body.cycleId === "string" ? body.cycleId.trim() : ""

    const latestAnswer =
      typeof body.latestAnswer === "string" ? body.latestAnswer.trim() : ""

    const witnessReply =
      typeof body.witnessReply === "string" ? body.witnessReply.trim() : null

    const feedback =
      typeof body.feedback === "string" ? body.feedback.trim() : ""

    const strongestAnchor =
      typeof body.strongestAnchor === "string"
        ? body.strongestAnchor.trim()
        : null

    const strongestSignal =
      typeof body.strongestSignal === "string"
        ? body.strongestSignal.trim()
        : null

    if (!cycleId || !latestAnswer || !feedback) {
      return NextResponse.json(
        {
          success: false,
          error: "Missing cycleId, latestAnswer, or feedback",
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

    const feedbackEntry = await prisma.witness_feedback.create({
      data: {
        cycle_id: cycleId,
        participant_id: participant.id,
        latest_answer: latestAnswer,
        witness_reply: witnessReply,
        strongest_anchor: strongestAnchor,
        strongest_signal: strongestSignal,
        feedback,
      },
    })

    return NextResponse.json({
      success: true,
      feedback: feedbackEntry,
    })
  } catch (error) {
    console.error("POST /api/harmonize/witness-feedback failed:", error)

    return NextResponse.json(
      {
        success: false,
        error:
          error instanceof Error
            ? error.message
            : "Failed to save witness feedback",
      },
      { status: 500 },
    )
  }
}