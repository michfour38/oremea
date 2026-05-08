import { NextRequest, NextResponse } from "next/server";
import { generateEntryMirror } from "../../../../src/lib/mirror/entry-mirror.service";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const sessionId = body?.sessionId;

    if (!sessionId || typeof sessionId !== "string") {
      return NextResponse.json(
        { error: "Missing sessionId" },
        { status: 400 }
      );
    }

    const output = await generateEntryMirror({ sessionId });

    if (!output) {
      return NextResponse.json(
        { error: "Entry Mirror could not be generated" },
        { status: 500 }
      );
    }

    return NextResponse.json({ output });
  } catch (error) {
    console.error("Entry Mirror generate route failed:", error);

    return NextResponse.json(
      { error: "Entry Mirror generate route failed" },
      { status: 500 }
    );
  }
}