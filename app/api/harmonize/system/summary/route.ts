import { auth } from "@clerk/nextjs/server"
import { NextResponse } from "next/server"

import { prisma } from "@/lib/prisma"

export const dynamic = "force-dynamic"

export async function GET(request: Request) {
  try {
    const { userId } = auth()

    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const systemId = searchParams.get("systemId")

    if (!systemId) {
      return NextResponse.json({ error: "Missing systemId" }, { status: 400 })
    }

    const system = await prisma.harmonize_systems.findFirst({
      where: {
        id: systemId,
        participants: {
          some: {
            profile_id: userId,
            active: true,
          },
        },
      },
      include: {
        participants: true,
        cycles: {
          orderBy: {
            started_at: "desc",
          },
          include: {
            reviews: {
              orderBy: {
                created_at: "desc",
              },
              take: 1,
            },
          },
        },
      },
    })

    if (!system) {
      return NextResponse.json(
        { error: "System not found or access denied" },
        { status: 404 },
      )
    }

    return NextResponse.json({
      success: true,
      system,
    })
  } catch (error) {
    console.error("GET /api/harmonize/system/summary failed:", error)

    return NextResponse.json(
      { success: false, error: "Failed to load Harmonize system" },
      { status: 500 },
    )
  }
}