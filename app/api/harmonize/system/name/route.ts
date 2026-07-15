import { auth } from "@clerk/nextjs/server"
import { NextResponse } from "next/server"

import { prisma } from "@/lib/prisma"

export const dynamic = "force-dynamic"

export async function PATCH(request: Request) {
  try {
    const { userId } = auth()

    if (!userId) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 },
      )
    }

    const body = await request.json()
    const systemId = body.systemId
    const name =
      typeof body.name === "string"
        ? body.name.trim()
        : ""

    if (!systemId) {
      return NextResponse.json(
        { error: "Missing systemId" },
        { status: 400 },
      )
    }

    const system = await prisma.harmonize_systems.findFirst({
      where: {
        id: systemId,
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

    if (!system) {
      return NextResponse.json(
        { error: "Relationship space not found or access denied" },
        { status: 404 },
      )
    }

    const updatedSystem = await prisma.harmonize_systems.update({
      where: {
        id: systemId,
      },
      data: {
        name: name || null,
      },
    })

    return NextResponse.json({
      success: true,
      system: updatedSystem,
    })
  } catch (error) {
    console.error(
      "PATCH /api/harmonize/system/name failed:",
      error,
    )

    return NextResponse.json(
      {
        success: false,
        error: "Failed to rename relationship space",
      },
      { status: 500 },
    )
  }
}