import { auth } from "@clerk/nextjs/server"
import { NextResponse } from "next/server"

import { prisma } from "@/lib/prisma"

export const dynamic = "force-dynamic"

const ADULT_ROLES = [
  "partner",
  "parent",
  "sibling",
  "colleague",
] as const

export async function POST(request: Request) {
  try {
    const { userId } = await auth()

    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await request.json()

    const systemId = body.systemId
    const profileId = body.profileId
    const role = body.role

    if (!systemId || !profileId || !role) {
      return NextResponse.json(
        { error: "Missing systemId, profileId, or role" },
        { status: 400 },
      )
    }

    if (!ADULT_ROLES.includes(role)) {
      return NextResponse.json(
        { error: "Invalid or disabled role" },
        { status: 400 },
      )
    }

    const system = await prisma.harmonize_systems.findFirst({
      where: {
        id: systemId,
        created_by: userId,
      },
    })

    if (!system) {
      return NextResponse.json(
        { error: "System not found or access denied" },
        { status: 404 },
      )
    }

    const participant = await prisma.harmonize_participants.create({
      data: {
        system_id: systemId,
        profile_id: profileId,
        role,
        is_minor: false,
        minor_access_enabled: false,
        guardian_verified: false,
      },
    })

    return NextResponse.json({
      success: true,
      participant,
    })
  } catch (error) {
    console.error("POST /api/harmonize/participant failed:", error)

    return NextResponse.json(
      {
        success: false,
        error: "Failed to add participant",
      },
      { status: 500 },
    )
  }
}