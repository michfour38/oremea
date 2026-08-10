import { currentUser } from "@clerk/nextjs/server";
import { Prisma } from "@prisma/client";
import { NextResponse } from "next/server";

import { prisma } from "@/lib/prisma";
import {
  generateRecognitionConversationReply,
  readRecognitionMemory,
  type RecognitionConversationMessage,
} from "@/src/lib/recognition/recognition-conversation";
import { getRecognitionConversationAccess } from "@/src/lib/recognition/recognition-conversation-access";

const RECENT_MESSAGE_LIMIT = 30;
const MAX_MESSAGE_LENGTH = 8000;

function userEmails(user: Awaited<ReturnType<typeof currentUser>>) {
  if (!user) return [];
  return user.emailAddresses
    .map((item) => item.emailAddress.trim().toLowerCase())
    .filter(Boolean);
}

export async function POST(request: Request) {
  try {
    const user = await currentUser();
    if (!user) {
      return NextResponse.json(
        { ok: false, error: "Sign in to continue Recognition." },
        { status: 401 },
      );
    }

    const emails = userEmails(user);
    const access = await getRecognitionConversationAccess({
      userId: user.id,
      emails,
    });
    if (!access.active) {
      return NextResponse.json(
        {
          ok: false,
          error:
            "Recognition access was not found for this account. Sign in with the email used at checkout.",
        },
        { status: 403 },
      );
    }

    const body = await request.json();
    const content = typeof body?.content === "string" ? body.content.trim() : "";
    if (!content) {
      return NextResponse.json(
        { ok: false, error: "Write something for Recognition to stay with." },
        { status: 400 },
      );
    }
    if (content.length > MAX_MESSAGE_LENGTH) {
      return NextResponse.json(
        {
          ok: false,
          error: `Keep each message under ${MAX_MESSAGE_LENGTH.toLocaleString()} characters so Recognition can stay precise.`,
        },
        { status: 400 },
      );
    }

    const primaryEmail = access.matchedEmail || emails[0] || null;
    const thread = await prisma.recognition_threads.upsert({
      where: { user_id: user.id },
      create: {
        user_id: user.id,
        primary_email: primaryEmail,
        status: "active",
      },
      update: {
        primary_email: primaryEmail ?? undefined,
        status: "active",
      },
      select: {
        id: true,
        message_count: true,
        memory_snapshot: true,
      },
    });

    const recentRows = await prisma.recognition_messages.findMany({
      where: { thread_id: thread.id },
      orderBy: { turn_index: "desc" },
      take: RECENT_MESSAGE_LIMIT,
      select: {
        role: true,
        content: true,
        turn_index: true,
      },
    });

    const recentMessages: RecognitionConversationMessage[] = recentRows
      .reverse()
      .filter(
        (message): message is typeof message & { role: "user" | "assistant" } =>
          message.role === "user" || message.role === "assistant",
      )
      .map((message) => ({
        role: message.role,
        content: message.content,
        turnIndex: message.turn_index,
      }));

    const userTurnIndex = thread.message_count + 1;
    recentMessages.push({
      role: "user",
      content,
      turnIndex: userTurnIndex,
    });

    const generated = await generateRecognitionConversationReply({
      firstName: user.firstName,
      recentMessages,
      memory: readRecognitionMemory(thread.memory_snapshot),
    });

    const now = new Date();
    const assistantTurnIndex = userTurnIndex + 1;

    const saved = await prisma.$transaction(async (transaction) => {
      const lockKey = `recognition-thread:${user.id}`;
      await transaction.$queryRaw`SELECT pg_advisory_xact_lock(hashtext(${lockKey}))`;

      const currentThread = await transaction.recognition_threads.findUnique({
        where: { id: thread.id },
        select: { message_count: true },
      });

      if (!currentThread || currentThread.message_count !== thread.message_count) {
        throw new Prisma.PrismaClientKnownRequestError(
          "Recognition changed while this reply was being prepared.",
          { code: "P2028", clientVersion: Prisma.prismaVersion.client },
        );
      }

      await transaction.recognition_messages.createMany({
        data: [
          {
            thread_id: thread.id,
            role: "user",
            content,
            turn_index: userTurnIndex,
            evidence_snapshot: {},
            created_at: now,
          },
          {
            thread_id: thread.id,
            role: "assistant",
            content: generated.reply,
            turn_index: assistantTurnIndex,
            evidence_snapshot: {
              memoryVersion: generated.memory.version,
              anchorCount: generated.memory.anchors.length,
            },
            created_at: now,
          },
        ],
      });

      await transaction.recognition_threads.update({
        where: { id: thread.id },
        data: {
          memory_snapshot: generated.memory,
          message_count: assistantTurnIndex,
          last_message_at: now,
          primary_email: primaryEmail ?? undefined,
        },
      });

      return {
        user: {
          role: "user" as const,
          content,
          turnIndex: userTurnIndex,
          createdAt: now.toISOString(),
        },
        assistant: {
          role: "assistant" as const,
          content: generated.reply,
          turnIndex: assistantTurnIndex,
          createdAt: now.toISOString(),
        },
      };
    });

    return NextResponse.json({ ok: true, messages: saved });
  } catch (error) {
    console.error("POST /api/recognition/conversation failed:", error);

    const isStale =
      error instanceof Error &&
      error.message.includes("Recognition changed while this reply was being prepared");

    return NextResponse.json(
      {
        ok: false,
        error: isStale
          ? "Recognition changed in another tab. Refresh before sending this message again."
          : "Recognition could not answer accurately enough just now. Your words are still here; try again.",
      },
      { status: isStale ? 409 : 503 },
    );
  }
}
