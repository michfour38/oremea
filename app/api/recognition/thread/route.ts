import { currentUser } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";

import { prisma } from "@/lib/prisma";

export async function DELETE(request: Request) {
  try {
    const user = await currentUser();
    if (!user) {
      return NextResponse.json({ ok: false }, { status: 401 });
    }

    const body = await request.json().catch(() => ({}));
    if (body?.confirm !== "delete-recognition-conversation") {
      return NextResponse.json(
        { ok: false, error: "Conversation deletion was not confirmed." },
        { status: 400 },
      );
    }

    await prisma.recognition_threads.deleteMany({
      where: { user_id: user.id },
    });

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("DELETE /api/recognition/thread failed:", error);
    return NextResponse.json(
      {
        ok: false,
        error: "The ongoing Recognition conversation could not be deleted just now.",
      },
      { status: 503 },
    );
  }
}
