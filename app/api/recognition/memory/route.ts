import { currentUser } from "@clerk/nextjs/server";
import type { Prisma } from "@prisma/client";
import { NextResponse } from "next/server";

import { prisma } from "@/lib/prisma";
import {
  EMPTY_RECOGNITION_MEMORY,
  readRecognitionMemory,
} from "@/src/lib/recognition/recognition-conversation";

export async function DELETE(request: Request) {
  try {
    const user = await currentUser();
    if (!user) {
      return NextResponse.json({ ok: false }, { status: 401 });
    }

    const thread = await prisma.recognition_threads.findUnique({
      where: { user_id: user.id },
      select: {
        id: true,
        memory_snapshot: true,
      },
    });

    if (!thread) {
      return NextResponse.json({ ok: true, anchors: [] });
    }

    const body = await request.json().catch(() => ({}));
    const clear = body?.clear === true;
    const turnIndex =
      typeof body?.turnIndex === "number" && Number.isInteger(body.turnIndex)
        ? body.turnIndex
        : null;
    const quote = typeof body?.quote === "string" ? body.quote : null;

    const current = readRecognitionMemory(thread.memory_snapshot);
    const next = clear
      ? EMPTY_RECOGNITION_MEMORY
      : {
          version: 1 as const,
          anchors: current.anchors.filter(
            (anchor) =>
              !(anchor.turnIndex === turnIndex && anchor.quote === quote),
          ),
        };

    await prisma.recognition_threads.update({
      where: { id: thread.id },
      data: {
        memory_snapshot: next as Prisma.InputJsonValue,
      },
    });

    return NextResponse.json({ ok: true, anchors: next.anchors });
  } catch (error) {
    console.error("DELETE /api/recognition/memory failed:", error);
    return NextResponse.json(
      {
        ok: false,
        error: "Recognition memory could not be changed just now.",
      },
      { status: 503 },
    );
  }
}
