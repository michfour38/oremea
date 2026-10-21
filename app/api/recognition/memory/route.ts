import { logPrivateError } from "@/src/lib/security/private-errors";
import { currentUser } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";

import { mutateRecognitionMemoryCopies } from "@/src/lib/recognition/recognition-memory-mutation";

export async function DELETE(request: Request) {
  try {
    const user = await currentUser();
    if (!user) {
      return NextResponse.json({ ok: false }, { status: 401 });
    }

    const body = await request.json().catch(() => ({}));
    const clear = body?.clear === true;
    const turnIndex =
      typeof body?.turnIndex === "number" && Number.isInteger(body.turnIndex)
        ? body.turnIndex
        : null;
    const quote = typeof body?.quote === "string" ? body.quote : null;

    const next = await mutateRecognitionMemoryCopies({ userId: user.id, clear, turnIndex, quote });

    return NextResponse.json({ ok: true, anchors: next.anchors });
  } catch (error) {
    logPrivateError("DELETE /api/recognition/memory failed:", error);
    return NextResponse.json(
      {
        ok: false,
        error: "Recognition memory could not be changed just now.",
      },
      { status: 503 },
    );
  }
}
