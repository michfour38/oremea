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

type SavedParticipantTurn = {
  role: "user";
  content: string;
  turnIndex: number;
  clientMessageId: string | null;
  createdAt: string;
};

class RecognitionConversationStaleError extends Error {
  constructor() {
    super("Recognition changed while this reply was being prepared.");
    this.name = "RecognitionConversationStaleError";
  }
}

class RecognitionMessageIdConflictError extends Error {
  constructor() {
    super("This send ID was already used for different Recognition text.");
    this.name = "RecognitionMessageIdConflictError";
  }
}

class RecognitionPendingTurnError extends Error {
  constructor() {
    super("Recognition already has saved words waiting for a reply.");
    this.name = "RecognitionPendingTurnError";
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
      client_message_id: true,
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
      clientMessageId: userMessage.client_message_id,
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
  let savedParticipantTurn: SavedParticipantTurn | null = null;

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
      select: { id: true },
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

    const prepared = await prisma.$transaction(async (transaction) => {
      const lockKey = `recognition-thread:${user.id}`;
      await transaction.$queryRaw`SELECT pg_advisory_xact_lock(hashtext(${lockKey}))`;

      const currentThread = await transaction.recognition_threads.findUnique({
        where: { id: thread.id },
        select: {
          message_count: true,
          memory_snapshot: true,
        },
      });
      if (!currentThread) throw new RecognitionConversationStaleError();

      const existingUser = await transaction.recognition_messages.findUnique({
        where: {
          thread_id_client_message_id: {
            thread_id: thread.id,
            client_message_id: clientMessageId,
          },
        },
        select: {
          role: true,
          content: true,
          turn_index: true,
          client_message_id: true,
          created_at: true,
        },
      });

      if (existingUser) {
        if (existingUser.role !== "user" || existingUser.content !== content) {
          throw new RecognitionMessageIdConflictError();
        }

        const existingAssistant = await transaction.recognition_messages.findUnique({
          where: {
            thread_id_turn_index: {
              thread_id: thread.id,
              turn_index: existingUser.turn_index + 1,
            },
          },
          select: {
            role: true,
            content: true,
            turn_index: true,
            created_at: true,
          },
        });

        if (existingAssistant?.role === "assistant") {
          return {
            completed: {
              user: {
                role: "user" as const,
                content: existingUser.content,
                turnIndex: existingUser.turn_index,
                clientMessageId: existingUser.client_message_id,
                createdAt: existingUser.created_at.toISOString(),
              },
              assistant: {
                role: "assistant" as const,
                content: existingAssistant.content,
                turnIndex: existingAssistant.turn_index,
                createdAt: existingAssistant.created_at.toISOString(),
              },
            },
            userTurnIndex: existingUser.turn_index,
            memorySnapshot: currentThread.memory_snapshot,
          };
        }

        if (currentThread.message_count !== existingUser.turn_index) {
          throw new RecognitionConversationStaleError();
        }

        return {
          completed: null,
          user: {
            role: "user" as const,
            content: existingUser.content,
            turnIndex: existingUser.turn_index,
            clientMessageId: existingUser.client_message_id,
            createdAt: existingUser.created_at.toISOString(),
          },
          userTurnIndex: existingUser.turn_index,
          memorySnapshot: currentThread.memory_snapshot,
        };
      }

      if (currentThread.message_count > 0) {
        const lastMessage = await transaction.recognition_messages.findUnique({
          where: {
            thread_id_turn_index: {
              thread_id: thread.id,
              turn_index: currentThread.message_count,
            },
          },
          select: { role: true },
        });
        if (lastMessage?.role === "user") {
          throw new RecognitionPendingTurnError();
        }
      }

      const now = new Date();
      const userTurnIndex = currentThread.message_count + 1;
      const userMessage = await transaction.recognition_messages.create({
        data: {
          thread_id: thread.id,
          role: "user",
          content,
          turn_index: userTurnIndex,
          client_message_id: clientMessageId,
          evidence_snapshot: {},
          created_at: now,
        },
        select: {
          content: true,
          turn_index: true,
          client_message_id: true,
          created_at: true,
        },
      });

      await transaction.recognition_threads.update({
        where: { id: thread.id },
        data: {
          message_count: userTurnIndex,
          last_message_at: now,
          primary_email: primaryEmail ?? undefined,
          status: "active",
        },
      });

      return {
        completed: null,
        user: {
          role: "user" as const,
          content: userMessage.content,
          turnIndex: userMessage.turn_index,
          clientMessageId: userMessage.client_message_id,
          createdAt: userMessage.created_at.toISOString(),
        },
        userTurnIndex,
        memorySnapshot: currentThread.memory_snapshot,
      };
    });

    if (prepared.completed) {
      return NextResponse.json({
        ok: true,
        replayed: true,
        messages: prepared.completed,
      });
    }

    savedParticipantTurn = prepared.user;

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

    const promptMessages = trimRecognitionRecentContext(recentMessages);
    const generated = await generateRecognitionConversationReply({
      firstName: user.firstName,
      recentMessages: promptMessages,
      memory: readRecognitionMemory(prepared.memorySnapshot),
    });

    const assistantTurnIndex = prepared.userTurnIndex + 1;
    const saved = await prisma.$transaction(async (transaction) => {
      const lockKey = `recognition-thread:${user.id}`;
      await transaction.$queryRaw`SELECT pg_advisory_xact_lock(hashtext(${lockKey}))`;

      const existingAssistant = await transaction.recognition_messages.findUnique({
        where: {
          thread_id_turn_index: {
            thread_id: thread.id,
            turn_index: assistantTurnIndex,
          },
        },
        select: {
          role: true,
          content: true,
          turn_index: true,
          created_at: true,
        },
      });

      if (existingAssistant?.role === "assistant") {
        return {
          user: prepared.user,
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
      if (!currentThread || currentThread.message_count !== prepared.userTurnIndex) {
        throw new RecognitionConversationStaleError();
      }

      const now = new Date();
      const assistantMessage = await transaction.recognition_messages.create({
        data: {
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
        select: {
          content: true,
          turn_index: true,
          created_at: true,
        },
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
        user: prepared.user,
        assistant: {
          role: "assistant" as const,
          content: assistantMessage.content,
          turnIndex: assistantMessage.turn_index,
          createdAt: assistantMessage.created_at.toISOString(),
        },
      };
    });

    return NextResponse.json({ ok: true, replayed: false, messages: saved });
  } catch (error) {
    console.error("POST /api/recognition/conversation failed:", error);

    if (error instanceof RecognitionMessageIdConflictError) {
      return NextResponse.json(
        { ok: false, error: error.message },
        { status: 409 },
      );
    }

    if (error instanceof RecognitionPendingTurnError) {
      return NextResponse.json(
        {
          ok: false,
          saved: false,
          error: "Your previous words are already saved. Refresh to continue from them.",
        },
        { status: 409 },
      );
    }

    const isStale = error instanceof RecognitionConversationStaleError;
    return NextResponse.json(
      {
        ok: false,
        saved: Boolean(savedParticipantTurn),
        message: savedParticipantTurn,
        error: isStale
          ? "Recognition changed in another tab. Refresh before continuing."
          : savedParticipantTurn
            ? "Your words are saved. Recognition could not complete the reply just now; continue when you are ready."
            : "Recognition could not respond just now. Your draft is still here; try again.",
      },
      { status: isStale ? 409 : 503 },
    );
  }
}
