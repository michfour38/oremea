import { auth } from "@clerk/nextjs/server"
import { NextResponse } from "next/server"

import { prisma } from "@/lib/prisma"

export const dynamic = "force-dynamic"

export async function POST(request: Request) {
  try {
    const { userId } = auth()

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

    const updatedCycle = await prisma.harmonize_cycles.update({
      where: { id: cycleId },
      data: { status: "review_due" },
    })

    return NextResponse.json({
      success: true,
      cycle: updatedCycle,
    })
  } catch (error) {
    console.error("POST /api/harmonize/cycle/review-due failed:", error)

    return NextResponse.json(
      { success: false, error: "Failed to mark cycle review due" },
      { status: 500 },
    )
  }
}