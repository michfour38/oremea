import { currentUser } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";

import { prisma } from "@/lib/prisma";
import { getRecognitionConversationAccess } from "@/src/lib/recognition/recognition-conversation-access";
import RecognitionChat, { type RecognitionChatMessage } from "./recognition-chat";

export const dynamic = "force-dynamic";

export default async function RecognitionPage() {
  const user = await currentUser();
  if (!user) {
    redirect("/sign-in?redirect_url=%2Fbegin");
  }

  const emails = user.emailAddresses
    .map((item) => item.emailAddress.trim().toLowerCase())
    .filter(Boolean);

  const access = await getRecognitionConversationAccess({
    userId: user.id,
    emails,
  });

  if (!access.active) {
    redirect("https://recognition.oremea.com/?access=required");
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

  const rows = await prisma.recognition_messages.findMany({
    where: { thread_id: thread.id },
    orderBy: { turn_index: "desc" },
    take: 120,
    select: {
      role: true,
      content: true,
      turn_index: true,
      created_at: true,
    },
  });

  const initialMessages: RecognitionChatMessage[] = rows
    .reverse()
    .filter(
      (message): message is typeof message & { role: "user" | "assistant" } =>
        message.role === "user" || message.role === "assistant",
    )
    .map((message) => ({
      role: message.role,
      content: message.content,
      turnIndex: message.turn_index,
      createdAt: message.created_at.toISOString(),
    }));

  return (
    <RecognitionChat
      firstName={user.firstName ?? null}
      initialMessages={initialMessages}
    />
  );
}
