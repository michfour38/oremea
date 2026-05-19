import { auth } from "@clerk/nextjs/server"
import { NextResponse } from "next/server"

import {
  getActiveCompassSession,
  saveCompassSession,
} from "@/src/lib/compass/session/session-persistence"

export const dynamic = "force-dynamic"

export async function GET() {
  const { userId } = auth()

  if (!userId) {
    return NextResponse.json(
      { session: null },
      { status: 401 },
    )
  }

  const session = await getActiveCompassSession(userId)

  return NextResponse.json({ session })
}

export async function POST(request: Request) {
  const { userId } = auth()

  if (!userId) {
    return NextResponse.json(
      { error: "Unauthorized" },
      { status: 401 },
    )
  }

  const body = await request.json()

  const session = await saveCompassSession({
    userId,
    phase: body.phase,
    selectedArea: body.selectedArea,
    areaResponses: body.areaResponses,
    recursiveLayers: body.recursiveLayers,
    resistanceMap: body.resistanceMap,
    discussionMessages: body.discussionMessages,
    proposedStep: body.proposedStep,
    finalStep: body.finalStep,
    detectedPatterns: body.detectedPatterns,
  })

  return NextResponse.json({ session })
}