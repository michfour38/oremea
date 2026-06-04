import { NextResponse } from "next/server"

import { runELConversation } from "@/src/lib/el"

export async function POST(request: Request) {
  try {
    const body = await request.json()

    const result = await runELConversation({
      product: body.product ?? "compass",
      stage: body.stage ?? "discussion",
      contextBlocks: body.contextBlocks ?? [],
      conversation: body.conversation ?? [],
      latestAnswer: body.latestAnswer ?? "",
    })

    if (!result) {
      return NextResponse.json(
        { ok: false, error: "EL conversation returned no result." },
        { status: 500 },
      )
    }

    return NextResponse.json({
      ok: true,
      result,
    })
  } catch (error) {
    console.error("POST /api/el/conversation failed:", error)

    return NextResponse.json(
      {
        ok: false,
        error:
          error instanceof Error
            ? error.message
            : "Unknown EL conversation error.",
      },
      { status: 500 },
    )
  }
}