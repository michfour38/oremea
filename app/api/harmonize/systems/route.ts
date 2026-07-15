import { auth } from "@clerk/nextjs/server"
import { NextResponse } from "next/server"

import { prisma } from "@/lib/prisma"

export const dynamic = "force-dynamic"

export async function GET() {
  try {
    const { userId } = auth()

    if (!userId) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 },
      )
    }

    const systems = await prisma.harmonize_systems.findMany({
      where: {
        participants: {
          some: {
            profile_id: userId,
            active: true,
          },
        },
      },
      orderBy: {
        created_at: "desc",
      },
      include: {
        participants: {
          where: {
            active: true,
          },
        },
        cycles: {
          orderBy: {
            started_at: "desc",
          },
        },
      },
    })

    return NextResponse.json({
      success: true,
      systems,
    })
  } catch (error) {
    console.error("GET /api/harmonize/systems failed:", error)

    return NextResponse.json(
      {
        success: false,
        error: "Failed to load relationship spaces",
      },
      { status: 500 },
    )
  }
}