import { currentUser } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";

import { prisma } from "@/lib/prisma";
import { getRecognitionConversationAccess } from "@/src/lib/recognition/recognition-conversation-access";
import { startNewRecognitionThread } from "@/src/lib/recognition/recognition-thread";

function userEmails(user: Awaited<ReturnType<typeof currentUser>>) {
  if (!user) return [];
  return user.emailAddresses
    .map((item) => item.emailAddress.trim().toLowerCase())
    .filter(Boolean);
}

export async function POST() {
  try {
    const user = await currentUser();
    if (!user) {
      return NextResponse.json({ ok: false }, { status: 401 });
    }

    const emails = userEmails(user);
    const access = await getRecognitionConversationAccess({
      userId: user.id,
      emails,
    });
    if (!access.active) {
      return NextResponse.json(
        { ok: false, error: "Recognition access was not found for this account." },
        { status: 403 },
      );
    }

    const primaryEmail = access.matchedEmail || emails[0] || null;
    const thread = await startNewRecognitionThread({
      userId: user.id,
      primaryEmail,
    });

    return NextResponse.json({
      ok: true,
      threadId: thread.id,
      createdAt: thread.created_at.toISOString(),
    });
  } catch (error) {
    console.error("POST /api/recognition/thread failed:", error);
    return NextResponse.json(
      {
        ok: false,
        error: "Recognition could not begin a new chat just now.",
      },
      { status: 503 },
    );
  }
}

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

    const threadId = typeof body?.threadId === "string" ? body.threadId : "";
    if (!threadId) {
      return NextResponse.json(
        { ok: false, error: "Choose the conversation to delete." },
        { status: 400 },
      );
    }

    const thread = await prisma.recognition_threads.findFirst({
      where: {
        id: threadId,
        user_id: user.id,
      },
      select: {
        id: true,
        status: true,
      },
    });

    if (!thread) {
      return NextResponse.json({ ok: true });
    }

    await prisma.recognition_threads.delete({
      where: { id: thread.id },
    });

    return NextResponse.json({ ok: true, deletedThreadId: thread.id });
  } catch (error) {
    console.error("DELETE /api/recognition/thread failed:", error);
    return NextResponse.json(
      {
        ok: false,
        error: "That Recognition conversation could not be deleted just now.",
      },
      { status: 503 },
    );
  }
}
