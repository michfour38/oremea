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
    const systemId = body.systemId

    if (!systemId) {
      return NextResponse.json({ error: "Missing systemId" }, { status: 400 })
    }

    const participant = await prisma.harmonize_participants.findFirst({
      where: {
        system_id: systemId,
        profile_id: userId,
        active: true,
      },
    })

    if (!participant) {
      return NextResponse.json(
        { error: "You are not a participant in this system" },
        { status: 403 },
      )
    }

    const existingCycle = await prisma.harmonize_cycles.findFirst({
      where: {
        system_id: systemId,
        status: {
          in: ["active", "paused", "review_due"],
        },
      },
      orderBy: {
        started_at: "desc",
      },
    })

    if (existingCycle) {
      return NextResponse.json({
        success: true,
        cycle: existingCycle,
        resumed: true,
      })
    }

    const cycle = await prisma.harmonize_cycles.create({
      data: {
        system_id: systemId,
        status: "active",
        title: "Harmonize Cycle",
      },
    })

    return NextResponse.json({
      success: true,
      cycle,
      resumed: false,
    })
  } catch (error) {
    console.error("POST /api/harmonize/cycle failed:", error)

    return NextResponse.json(
      { success: false, error: "Failed to create or resume Harmonize cycle" },
      { status: 500 },
    )
  }
}