import { NextResponse } from "next/server"

import { runCompassMirror } from "@/src/lib/compass/session/compass-mirror.service"

export async function POST(request: Request) {
  try {
    const body = await request.json()

    const output = await runCompassMirror({
  areaResponses: body.areaResponses ?? [],
  selectedArea: body.selectedArea ?? null,
  recursiveLayers: body.recursiveLayers ?? [],
  mirrorStage: body.mirrorStage ?? "core",
})

    if (!output) {
      return NextResponse.json(
        {
          ok: false,
          error: "Compass Mirror returned no output.",
        },
        { status: 500 },
      )
    }

    return NextResponse.json({
      ok: true,
      output,
    })
  } catch (error) {
    console.error("POST /api/compass/mirror failed:", error)

    return NextResponse.json(
      {
        ok: false,
        error:
          error instanceof Error
            ? error.message
            : "Unknown Compass Mirror error.",
      },
      { status: 500 },
    )
  }
}