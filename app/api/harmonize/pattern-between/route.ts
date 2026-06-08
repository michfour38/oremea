import { auth } from "@clerk/nextjs/server"
import { NextResponse } from "next/server"

import { buildPatternBetween } from "@/lib/harmonize/pattern-between"
import { prisma } from "@/lib/prisma"

export const dynamic = "force-dynamic"

export async function GET(request: Request) {
  try {
    const { userId } = auth()

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
        entries: {
          orderBy: { created_at: "asc" },
        },
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

    const patternBetween = buildPatternBetween(cycle.entries)

    return NextResponse.json({
      success: true,
      patternBetween,
    })
  } catch (error) {
    console.error("GET /api/harmonize/pattern-between failed:", error)

    return NextResponse.json(
      { success: false, error: "Failed to load pattern between" },
      { status: 500 },
    )
  }
}