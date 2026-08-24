import { buildCycleSummary } from "@/lib/harmonize/build-cycle-summary"
import { inferReviewOutcome } from "@/lib/harmonize/review-outcome"
import { auth } from "@clerk/nextjs/server"
import { NextResponse } from "next/server"

import { prisma } from "@/lib/prisma"

export const dynamic = "force-dynamic"

export async function POST(request: Request) {
  try {
    const { userId } = await auth()

    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await request.json()
    const cycleId = body.cycleId

    if (!cycleId) {
      return NextResponse.json({ error: "Missing cycleId" }, { status: 400 })
    }

    const cycle = await prisma.harmonize_cycles.findUnique({
      where: { id: cycleId },
      include: {
        systems: {
          include: { participants: true },
        },
      },
    })

    if (!cycle) {
      return NextResponse.json({ error: "Cycle not found" }, { status: 404 })
    }

    const participant = cycle.systems.participants.find(
      (p) => p.profile_id === userId && p.active,
    )

    if (!participant) {
      return NextResponse.json(
        { error: "You are not a participant in this cycle" },
        { status: 403 },
      )
    }

const signalSnapshot = cycle.signal_snapshot as any
const signals = signalSnapshot?.signals || []
const cycleSummary = buildCycleSummary(signals)

const outcome = inferReviewOutcome({
  hasOwnershipSignal: signals.some((signal: any) => signal.type === "ownership"),
  hasPossibilitySignal: signals.some((signal: any) => signal.type === "possibility"),
  hasPauseReflection: Boolean(signalSnapshot?.pauseEntrySaved),
  pauseWasReflective: signalSnapshot?.pauseEntryPhase === "pause_reflective",
})

    const review = await prisma.harmonize_reviews.create({
      data: {
        cycle_id: cycleId,
        outcome,
        newly_visible:
  typeof body.newlyVisible === "string" ? body.newlyVisible.trim() : null,
same_within_self:
  typeof body.sameWithinSelf === "string" ? body.sameWithinSelf.trim() : null,
different_within_self:
  typeof body.differentWithinSelf === "string" ? body.differentWithinSelf.trim() : null,
different_in_system:
  typeof body.differentInSystem === "string" ? body.differentInSystem.trim() : null,
      },
    })

    await prisma.harmonize_cycles.update({
  where: { id: cycleId },
  data: {
    status: "archived",
    reviewed_at: new Date(),
    system_snapshot: {
      cycleSummary,
      lastReviewedAt: new Date().toISOString(),
    },
  },
})

    return NextResponse.json({
      success: true,
      review,
    })
  } catch (error) {
    console.error("POST /api/harmonize/review failed:", error)

    return NextResponse.json(
      { success: false, error: "Failed to save Harmonize review" },
      { status: 500 },
    )
  }
}