import { auth } from "@clerk/nextjs/server"
import { NextResponse } from "next/server"

import { prisma } from "@/lib/prisma"

export const dynamic = "force-dynamic"

const ALLOWED_MODES = [
  "couple",
  "family_adults",
  "team",
  "parallel_parenting_adults",
] as const

const INCLUDED_OWNED_SPACE_LIMIT = 1

export async function POST(request: Request) {
  try {
    const { userId } = auth()

    if (!userId) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 },
      )
    }

    const body = await request.json()

    if (!ALLOWED_MODES.includes(body.mode)) {
      return NextResponse.json(
        { error: "Invalid mode" },
        { status: 400 },
      )
    }

    await prisma.profiles.upsert({
      where: {
        id: userId,
      },
      update: {},
      create: {
        id: userId,
        display_name: "Harmonize participant",
        pathway: "harmonize",
        updated_at: new Date(),
      },
    })

    const ownedSpaceCount =
      await prisma.harmonize_systems.count({
        where: {
          status: "active",
          OR: [
            {
              owner_profile_id: userId,
            },
            {
              owner_profile_id: null,
              created_by: userId,
            },
          ],
        },
      })

    if (ownedSpaceCount >= INCLUDED_OWNED_SPACE_LIMIT) {
      return NextResponse.json(
        {
          success: false,
          paymentRequired: true,
          error:
            "Your current relationship space allowance has been reached.",
          ownedSpaceCount,
          ownedSpaceLimit: INCLUDED_OWNED_SPACE_LIMIT,
        },
        { status: 402 },
      )
    }

    const system = await prisma.harmonize_systems.create({
      data: {
        mode: body.mode,
        name:
          typeof body.name === "string" && body.name.trim()
            ? body.name.trim()
            : null,
        created_by: userId,
        owner_profile_id: userId,
        status: "active",
        consent_snapshot: body.consentSnapshot || {},
      },
    })

    await prisma.harmonize_participants.create({
      data: {
        system_id: system.id,
        profile_id: userId,
        role: "other",
        relationship_context: null,
      },
    })

    return NextResponse.json({
      success: true,
      system,
      ownedSpaceCount: ownedSpaceCount + 1,
      ownedSpaceLimit: INCLUDED_OWNED_SPACE_LIMIT,
    })
  } catch (error) {
    console.error(
      "POST /api/harmonize/system failed:",
      error,
    )

    return NextResponse.json(
      {
        success: false,
        error: "Failed to create relationship space",
      },
      { status: 500 },
    )
  }
}