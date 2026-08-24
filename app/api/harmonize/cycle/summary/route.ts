import { auth } from "@clerk/nextjs/server"
import { NextResponse } from "next/server"

import { prisma } from "@/lib/prisma"

export const dynamic = "force-dynamic"

export async function GET(request: Request) {
  try {
    const { userId } = await auth()

    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const cycleId = searchParams.get("cycleId")

    if (!cycleId) {
      return NextResponse.json({ error: "Missing cycleId" }, { status: 400 })
    }

    const cycle = await prisma.harmonize_cycles.findUnique({
  where: { id: cycleId },
  include: {
    reviews: {
      orderBy: {
        created_at: "desc",
      },
      take: 1,
    },
    participant_labels: true,
    systems: {
      include: {
        participants: true,
      },
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

const participantLabel = cycle.participant_labels.find(
  (label) => label.participant_id === participant?.id,
)

    return NextResponse.json({
      success: true,
      cycle: {
  id: cycle.id,
  status: cycle.status,
  displayTitle: participantLabel?.label || "Conversation",
  signalSnapshot: cycle.signal_snapshot,
  patternSnapshot: cycle.pattern_snapshot,
  systemSnapshot: cycle.system_snapshot,
  reviews: cycle.reviews,
},
    })
  } catch (error) {
    console.error("GET /api/harmonize/cycle/summary failed:", error)

    return NextResponse.json(
      { success: false, error: "Failed to load cycle summary" },
      { status: 500 },
    )
  }
}