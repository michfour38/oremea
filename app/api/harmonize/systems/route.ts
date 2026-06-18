import { auth } from "@clerk/nextjs/server"
import { NextResponse } from "next/server"

import { prisma } from "@/lib/prisma"

export const dynamic = "force-dynamic"

export async function GET() {
  const { userId } = auth()

  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
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
      participants: true,
      cycles: {
        orderBy: {
          started_at: "desc",
        },
        take: 1,
      },
    },
  })

  return NextResponse.json({
    success: true,
    systems,
  })
}