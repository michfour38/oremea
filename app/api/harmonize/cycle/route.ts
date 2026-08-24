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
    const systemId = body.systemId
    const title =
      typeof body.title === "string" && body.title.trim()
        ? body.title.trim()
        : "Untitled Thread"

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

    const waitingCycle = await prisma.harmonize_cycles.findFirst({
      where: {
        system_id: systemId,
        status: "active",
        participant_labels: {
          none: {
            participant_id: participant.id,
          },
        },
      },
      orderBy: {
        started_at: "asc",
      },
    })

    if (waitingCycle) {
      await prisma.harmonize_cycle_labels.create({
        data: {
          cycle_id: waitingCycle.id,
          participant_id: participant.id,
          label: title,
        },
      })

      return NextResponse.json({
        success: true,
        cycle: waitingCycle,
        resumed: true,
      })
    }

    const cycle = await prisma.harmonize_cycles.create({
      data: {
        system_id: systemId,
        status: "active",
        title: null,
      },
    })

    await prisma.harmonize_cycle_labels.create({
      data: {
        cycle_id: cycle.id,
        participant_id: participant.id,
        label: title,
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
      { success: false, error: "Failed to create Harmonize cycle" },
      { status: 500 },
    )
  }
}