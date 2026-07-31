import { NextResponse } from "next/server"

import { generateCompassDescentQuestion } from "@/src/lib/compass/session/compass-descent.service"
import type {
  CompassAreaResponse,
  CompassGoalArea,
  CompassRecursiveLayer,
} from "@/src/lib/compass/session/session-types"
import { buildMirrorWhyQuestion } from "@/src/lib/oremea/mirror-question"

const FLAT_FALLBACKS = new Set([
  "Why does this matter to you right now?",
  "Why is that important to you?",
  "Why does that matter to you?",
  "Why is that important here?",
  "Why does that matter now?",
  "Why is that still important to you?",
  "Why does that matter beneath everything else you have named?",
])

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
    const currentAnswer =
      typeof body.currentAnswer === "string" ? body.currentAnswer : undefined

    const sourceAnswer =
      currentAnswer?.trim() ||
      recursiveLayers[recursiveLayers.length - 1]?.answer.trim() ||
      areaResponses.find((response) => response.area === selectedArea)?.answer.trim() ||
      ""

    const generatedQuestion = await generateCompassDescentQuestion({
      layer,
      selectedArea,
      areaResponses,
      recursiveLayers,
      currentAnswer,
    })

    const question = FLAT_FALLBACKS.has(generatedQuestion.trim())
      ? buildMirrorWhyQuestion({ layer, sourceAnswer })
      : generatedQuestion

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
