import { currentUser } from "@clerk/nextjs/server";
import type { Prisma } from "@prisma/client";
import { NextResponse } from "next/server";

import { prisma } from "@/lib/prisma";
import {
  generateRecognitionConversationReply,
  readRecognitionMemory,
  type RecognitionConversationMessage,
} from "@/src/lib/recognition/recognition-conversation";
import { getRecognitionConversationAccess } from "@/src/lib/recognition/recognition-conversation-access";
import { trimRecognitionRecentContext } from "@/src/lib/recognition/recognition-context";

const RECENT_MESSAGE_FETCH_LIMIT = 40;
const MAX_MESSAGE_LENGTH = 8000;
const CLIENT_MESSAGE_ID = /^[a-zA-Z0-9_-]{12,100}$/;

class RecognitionConversationStaleError extends Error {
  constructor() {
    super("Recognition changed while this reply was being prepared.");
    this.name = "RecognitionConversationStaleError";
  }
}

function userEmails(user: Awaited<ReturnType<typeof currentUser>>) {
  if (!user) return [];
  return user.emailAddresses
    .map((item) => item.emailAddress.trim().toLowerCase())
    .filter(Boolean);
}

async function readSavedMessagePair({
  threadId,
  clientMessageId,
}: {
  threadId: string;
  clientMessageId: string;
}) {
  const userMessage = await prisma.recognition_messages.findUnique({
    where: {
      thread_id_client_message_id: {
        thread_id: threadId,
        client_message_id: clientMessageId,
      },
    },
    select: {
      role: true,
      content: true,
      turn_index: true,
      created_at: true,
    },
  });

  if (!userMessage || userMessage.role !== "user") return null;

  const assistantMessage = await prisma.recognition_messages.findUnique({
    where: {
      thread_id_turn_index: {
        thread_id: threadId,
        turn_index: userMessage.turn_index + 1,
      },
    },
    select: {
      role: true,
      content: true,
      turn_index: true,
      created_at: true,
    },
  });

  if (!assistantMessage || assistantMessage.role !== "assistant") return null;

  return {
    user: {
      role: "user" as const,
      content: userMessage.content,
      turnIndex: userMessage.turn_index,
      createdAt: userMessage.created_at.toISOString(),
    },
    assistant: {
      role: "assistant" as const,
      content: assistantMessage.content,
      turnIndex: assistantMessage.turn_index,
      createdAt: assistantMessage.created_at.toISOString(),
    },
  };
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
    const clientMessageId =
      typeof body?.clientMessageId === "string"
        ? body.clientMessageId.trim()
        : "";

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
    if (!CLIENT_MESSAGE_ID.test(clientMessageId)) {
      return NextResponse.json(
        { ok: false, error: "This Recognition send could not be identified safely." },
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

    const savedRetry = await readSavedMessagePair({
      threadId: thread.id,
      clientMessageId,
    });
    if (savedRetry) {
      if (savedRetry.user.content !== content) {
        return NextResponse.json(
          {
            ok: false,
            error: "This send ID was already used for different Recognition text.",
          },
          { status: 409 },
        );
      }

      return NextResponse.json({
        ok: true,
        replayed: true,
        messages: savedRetry,
      });
    }

    const recentRows = await prisma.recognition_messages.findMany({
      where: { thread_id: thread.id },
      orderBy: { turn_index: "desc" },
      take: RECENT_MESSAGE_FETCH_LIMIT,
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

    const promptMessages = trimRecognitionRecentContext(recentMessages);
    const generated = await generateRecognitionConversationReply({
      firstName: user.firstName,
      recentMessages: promptMessages,
      memory: readRecognitionMemory(thread.memory_snapshot),
    });

    const now = new Date();
    const assistantTurnIndex = userTurnIndex + 1;

    const saved = await prisma.$transaction(async (transaction) => {
      const lockKey = `recognition-thread:${user.id}`;
      await transaction.$queryRaw`SELECT pg_advisory_xact_lock(hashtext(${lockKey}))`;

      const existingRetry = await transaction.recognition_messages.findUnique({
        where: {
          thread_id_client_message_id: {
            thread_id: thread.id,
            client_message_id: clientMessageId,
          },
        },
        select: {
          content: true,
          turn_index: true,
          created_at: true,
        },
      });

      if (existingRetry) {
        if (existingRetry.content !== content) {
          throw new RecognitionConversationStaleError();
        }

        const existingAssistant = await transaction.recognition_messages.findUnique({
          where: {
            thread_id_turn_index: {
              thread_id: thread.id,
              turn_index: existingRetry.turn_index + 1,
            },
          },
          select: {
            content: true,
            turn_index: true,
            created_at: true,
          },
        });

        if (!existingAssistant) {
          throw new RecognitionConversationStaleError();
        }

        return {
          user: {
            role: "user" as const,
            content: existingRetry.content,
            turnIndex: existingRetry.turn_index,
            createdAt: existingRetry.created_at.toISOString(),
          },
          assistant: {
            role: "assistant" as const,
            content: existingAssistant.content,
            turnIndex: existingAssistant.turn_index,
            createdAt: existingAssistant.created_at.toISOString(),
          },
        };
      }

      const currentThread = await transaction.recognition_threads.findUnique({
        where: { id: thread.id },
        select: { message_count: true },
      });

      if (!currentThread || currentThread.message_count !== thread.message_count) {
        throw new RecognitionConversationStaleError();
      }

      await transaction.recognition_messages.createMany({
        data: [
          {
            thread_id: thread.id,
            role: "user",
            content,
            turn_index: userTurnIndex,
            client_message_id: clientMessageId,
            evidence_snapshot: {},
            created_at: now,
          },
          {
            thread_id: thread.id,
            role: "assistant",
            content: generated.reply,
            turn_index: assistantTurnIndex,
            client_message_id: null,
            evidence_snapshot: {
              memoryVersion: generated.memory.version,
              anchorCount: generated.memory.anchors.length,
              promptMessageCount: promptMessages.length,
              model: generated.model,
              inputTokens: generated.usage.inputTokens,
              outputTokens: generated.usage.outputTokens,
              cacheCreationInputTokens: generated.usage.cacheCreationInputTokens,
              cacheReadInputTokens: generated.usage.cacheReadInputTokens,
            },
            created_at: now,
          },
        ],
      });

      await transaction.recognition_threads.update({
        where: { id: thread.id },
        data: {
          memory_snapshot: generated.memory as Prisma.InputJsonValue,
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

    return NextResponse.json({ ok: true, replayed: false, messages: saved });
  } catch (error) {
    console.error("POST /api/recognition/conversation failed:", error);

    const isStale = error instanceof RecognitionConversationStaleError;

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
