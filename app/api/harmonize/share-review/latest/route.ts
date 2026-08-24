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

    const latestReview = await prisma.harmonize_share_reviews.findFirst({
      where: {
        approved: false,
        entries: {
          cycle_id: cycleId,
        },
      },
      orderBy: {
        created_at: "desc",
      },
    })

    return NextResponse.json({
      success: true,
      review: latestReview,
    })
  } catch (error) {
    console.error("GET /api/harmonize/share-review/latest failed:", error)

    return NextResponse.json(
      { success: false, error: "Failed to load latest share review" },
      { status: 500 },
    )
  }
}