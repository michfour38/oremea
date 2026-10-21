import { logPrivateError } from "@/src/lib/security/private-errors";
import { auth } from "@clerk/nextjs/server"
import { NextResponse } from "next/server"

import { prisma } from "@/lib/prisma"

export const dynamic = "force-dynamic"

export async function GET(request: Request) {
  try {
    const { userId } = await auth()

    if (!userId) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 },
      )
    }

    const { searchParams } = new URL(request.url)

    const systemId = searchParams.get("systemId")

    if (!systemId) {
      return NextResponse.json(
        { error: "Missing systemId" },
        { status: 400 },
      )
    }

    const system = await prisma.harmonize_systems.findFirst({
      where: {
        id: systemId,
        participants: { some: { profile_id: userId, active: true } },
      },
      select: {
        cycles: {
          where: {
            status: "archived",
          },
          orderBy: {
            started_at: "desc",
          },
          select: {
            id: true,
            status: true,
            started_at: true,
            participant_labels: {
              where: { participants: { profile_id: userId, active: true } },
              select: { label: true },
            },
          },
        },
      },
    })

    if (!system) {
      return NextResponse.json(
        { error: "Relationship Space not found" },
        { status: 404 },
      )
    }

    return NextResponse.json({
      success: true,
      archive: {
        conversations: system.cycles.map((cycle) => ({
          id: cycle.id,
          status: cycle.status,
          started_at: cycle.started_at,
          displayTitle: cycle.participant_labels[0]?.label || "Conversation",
        })),
      },
    })
  } catch (error) {
    logPrivateError("GET /api/harmonize/archive/summary failed:", error)

    return NextResponse.json(
      {
        success: false,
        error: "Failed to load archive",
      },
      { status: 500 },
    )
  }
}
