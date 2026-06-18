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

    const system = await prisma.harmonize_systems.findUnique({
      where: { id: systemId },
      include: { participants: true },
    })

    if (!system) {
      return NextResponse.json({ error: "Container not found" }, { status: 404 })
    }

    const existingParticipant = system.participants.find(
      (participant) => participant.profile_id === userId,
    )

    if (existingParticipant) {
      return NextResponse.json({
        success: true,
        participant: existingParticipant,
      })
    }

    const participant = await prisma.harmonize_participants.create({
      data: {
        system_id: systemId,
        profile_id: userId,
        role:
          system.mode === "team"
            ? "team_member"
            : system.mode === "parallel_parenting_adults"
              ? "parent"
              : system.mode === "family_adults"
                ? "adult_family_member"
                : "partner",
      },
    })

    return NextResponse.json({
      success: true,
      participant,
    })
  } catch (error) {
    console.error("POST /api/harmonize/join failed:", error)

    return NextResponse.json(
      { success: false, error: "Failed to join container" },
      { status: 500 },
    )
  }
}