import { NextResponse } from "next/server"

import { generateCompassDescentQuestion } from "@/src/lib/compass/session/compass-descent.service"
import type {
  CompassAreaResponse,
  CompassGoalArea,
  CompassRecursiveLayer,
} from "@/src/lib/compass/session/session-types"

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

    const question = await generateCompassDescentQuestion({
      layer,
      selectedArea,
      areaResponses: Array.isArray(body.areaResponses)
        ? (body.areaResponses as CompassAreaResponse[])
        : [],
      recursiveLayers: Array.isArray(body.recursiveLayers)
        ? (body.recursiveLayers as CompassRecursiveLayer[])
        : [],
      currentAnswer:
        typeof body.currentAnswer === "string" ? body.currentAnswer : undefined,
    })

    return NextResponse.json({ ok: true, question })
  } catch (error) {
    console.error("POST /api/compass/descent-question failed:", error)

    return NextResponse.json(
      {
        ok: false,
        error:
          error instanceof Error
            ? error.message
            : "Unknown Compass Descent error.",
      },
      { status: 500 },
    )
  }
}
