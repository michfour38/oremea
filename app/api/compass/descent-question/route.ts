import { NextResponse } from "next/server"

import {
  evaluateCompassDescentAnswer,
  generateCompassDescentQuestion,
} from "@/src/lib/compass/session/compass-descent.service"
import type {
  CompassAreaResponse,
  CompassGoalArea,
  CompassRecursiveLayer,
} from "@/src/lib/compass/session/session-types"
import type { CompassDescentAttempt } from "@/src/lib/compass/session/compass-descent.types"

export async function POST(request: Request) {
  try {
    const body = await request.json()

    const layer = Number(body.layer)
    const selectedArea = body.selectedArea as CompassGoalArea | undefined

    if (!Number.isInteger(layer) || layer < 1 || layer > 7 || !selectedArea) {
      return NextResponse.json(
        { ok: false, error: "Invalid Compass Descent request." },
        { status: 400 },
      )
    }

    const areaResponses = Array.isArray(body.areaResponses)
      ? (body.areaResponses as CompassAreaResponse[])
      : []
    const recursiveLayers = Array.isArray(body.recursiveLayers)
      ? (body.recursiveLayers as CompassRecursiveLayer[])
      : []

    if (
      typeof body.currentQuestion === "string" &&
      typeof body.currentAnswer === "string"
    ) {
      const attempts = Array.isArray(body.attempts)
        ? (body.attempts as CompassDescentAttempt[])
        : []

      const decision = await evaluateCompassDescentAnswer({
        layer,
        selectedArea,
        areaResponses,
        recursiveLayers,
        currentQuestion: body.currentQuestion,
        currentAnswer: body.currentAnswer,
        attempts,
      })

      return NextResponse.json({ ok: true, decision })
    }

    const question = await generateCompassDescentQuestion({
      layer,
      selectedArea,
      areaResponses,
      recursiveLayers,
    })

    return NextResponse.json({ ok: true, question })
  } catch (error) {
    console.error("POST /api/compass/descent-question failed:", error)

    return NextResponse.json(
      {
        ok: false,
        error:
          "Mirror could not follow the next movement without leaving the participant's evidence.",
      },
      { status: 503 },
    )
  }
}
