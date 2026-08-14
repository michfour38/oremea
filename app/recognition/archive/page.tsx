import { currentUser } from "@clerk/nextjs/server";
import Link from "next/link";
import { redirect } from "next/navigation";

import { prisma } from "@/lib/prisma";
import { readRecognitionMemory } from "@/src/lib/recognition/recognition-conversation";
import RecognitionMemoryControls from "./recognition-memory-controls";
import RecognitionThreadControls from "./recognition-thread-controls";

function formatDate(value: Date | string) {
  return new Date(value).toLocaleDateString("en-ZA", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

function preview(value: string | undefined | null) {
  const text = value?.trim().replace(/\s+/g, " ") ?? "";
  if (!text) return "No messages yet";
  return text.length > 110 ? `${text.slice(0, 107)}…` : text;
}

type Props = {
  searchParams?: {
    before?: string;
    thread?: string;
  };
};

const MESSAGE_PAGE_SIZE = 100;

export default async function RecognitionArchivePage({ searchParams }: Props) {
  const user = await currentUser();

  if (!user) {
    redirect("/sign-in?redirect_url=%2Frecognition%2Farchive");
  }

  const before = Number(searchParams?.before ?? "0");
  const beforeTurn = Number.isInteger(before) && before > 0 ? before : null;
  const requestedThreadId = searchParams?.thread?.trim() || null;

  const rawThreads = await prisma.recognition_threads.findMany({
    where: { user_id: user.id },
    orderBy: { created_at: "desc" },
    select: {
      id: true,
      status: true,
      message_count: true,
      memory_snapshot: true,
      last_message_at: true,
      archived_at: true,
      created_at: true,
      messages: {
        where: { role: "user" },
        orderBy: { turn_index: "asc" },
        take: 1,
        select: {
          content: true,
          created_at: true,
        },
      },
    },
  });

  const threads = [...rawThreads].sort((a, b) => {
    if (a.status === "active" && b.status !== "active") return -1;
    if (a.status !== "active" && b.status === "active") return 1;
    return b.created_at.getTime() - a.created_at.getTime();
  });

  const selectedThread =
    (requestedThreadId
      ? threads.find((thread) => thread.id === requestedThreadId)
      : null) ??
    threads.find((thread) => thread.status === "active") ??
    threads[0] ??
    null;

  const conversationRows = selectedThread
    ? await prisma.recognition_messages.findMany({
        where: {
          thread_id: selectedThread.id,
          ...(beforeTurn ? { turn_index: { lt: beforeTurn } } : {}),
        },
        orderBy: { turn_index: "desc" },
        take: MESSAGE_PAGE_SIZE,
        select: {
          id: true,
          role: true,
          content: true,
          turn_index: true,
          created_at: true,
        },
      })
    : [];

  const conversation = conversationRows.reverse();
  const oldestTurn = conversation[0]?.turn_index ?? null;
  const hasEarlier = Boolean(oldestTurn && oldestTurn > 1);
  const memory = readRecognitionMemory(selectedThread?.memory_snapshot);

  return (
    <main className="min-h-screen bg-[#090909] text-white">
      <nav className="border-b border-white/5 bg-black/50 px-6 py-4">
        <div className="mx-auto flex max-w-4xl items-center justify-between gap-6 text-sm">
          <Link
            href="https://www.oremea.com"
            className="uppercase tracking-[0.28em] text-[#C8A96A]/90 transition hover:text-[#f1dfb4]"
          >
            Oremea
          </Link>
          <div className="flex items-center gap-5">
            <Link
              href="https://recognition.oremea.com/begin"
              className="text-zinc-400 transition hover:text-[#f1dfb4]"
            >
              Recognition
            </Link>
            <span className="text-[#E7C98B]">Archive</span>
          </div>
        </div>
      </nav>

      <section className="mx-auto max-w-4xl px-5 py-12">
        <Link
          href="https://recognition.oremea.com/begin"
          className="text-sm text-zinc-200 underline underline-offset-4 transition hover:text-[#d8b15f]"
        >
          Return to Recognition
        </Link>

        <header className="mt-10 border-b border-zinc-700/80 pb-8">
          <p className="text-xs uppercase tracking-[0.32em] text-[#d8b15f]">
            Recognition Archive
          </p>
          <h1 className="mt-5 font-serif text-4xl text-white md:text-6xl">
            Your conversations stay here
          </h1>
          <p className="mt-6 max-w-2xl text-base leading-8 text-zinc-300">
            Starting a new chat does not overwrite the old one. Each conversation
            stays intact, so you can come back later and see exactly where it began
            and where it went.
          </p>
        </header>

        {threads.length > 0 ? (
          <section className="mt-10">
            <div className="flex items-end justify-between gap-4">
              <div>
                <p className="text-xs uppercase tracking-[0.22em] text-[#d8b15f]">
                  Chats
                </p>
                <h2 className="mt-2 font-serif text-3xl text-zinc-100">
                  Conversation history
                </h2>
              </div>
              <p className="text-sm text-zinc-500">
                {threads.length} chat{threads.length === 1 ? "" : "s"}
              </p>
            </div>

            <div className="mt-6 grid gap-3">
              {threads.map((thread) => {
                const selected = thread.id === selectedThread?.id;
                const firstMessage = thread.messages[0];
                return (
                  <Link
                    key={thread.id}
                    href={`/recognition/archive?thread=${thread.id}`}
                    className={`rounded-[1.5rem] border px-5 py-4 transition ${
                      selected
                        ? "border-[#7f693e] bg-[#15130f]"
                        : "border-zinc-800 bg-black/20 hover:border-zinc-700"
                    }`}
                  >
                    <div className="flex flex-wrap items-center justify-between gap-3">
                      <p className="text-xs uppercase tracking-[0.18em] text-[#b79a63]">
                        {thread.status === "active" ? "Current chat" : formatDate(thread.created_at)}
                      </p>
                      <p className="text-xs text-zinc-600">
                        {thread.message_count} saved message{thread.message_count === 1 ? "" : "s"}
                      </p>
                    </div>
                    <p className="mt-2 text-sm leading-6 text-zinc-300">
                      {preview(firstMessage?.content)}
                    </p>
                  </Link>
                );
              })}
            </div>
          </section>
        ) : null}

        <section className="mt-12">
          {selectedThread ? (
            <>
              <div className="flex flex-wrap items-end justify-between gap-4">
                <div>
                  <p className="text-xs uppercase tracking-[0.22em] text-[#d8b15f]">
                    {selectedThread.status === "active" ? "Current chat" : "Archived chat"}
                  </p>
                  <h2 className="mt-2 font-serif text-3xl text-zinc-100">
                    {formatDate(selectedThread.messages[0]?.created_at ?? selectedThread.created_at)}
                  </h2>
                </div>
                <p className="text-sm text-zinc-500">
                  {selectedThread.message_count} saved message{selectedThread.message_count === 1 ? "" : "s"}
                </p>
              </div>

              {conversation.length === 0 ? (
                <div className="mt-6 rounded-[2rem] border border-zinc-700 bg-[#11100D] p-6">
                  <p className="text-base leading-7 text-zinc-300">
                    This chat has no messages yet.
                  </p>
                </div>
              ) : (
                <div className="mt-8 space-y-8">
                  {hasEarlier ? (
                    <div className="text-center">
                      <Link
                        href={`/recognition/archive?thread=${selectedThread.id}&before=${oldestTurn}`}
                        className="text-sm text-[#d8b15f] underline underline-offset-4"
                      >
                        Load earlier conversation
                      </Link>
                    </div>
                  ) : null}

                  {conversation.map((message) => (
                    <article
                      key={message.id}
                      className={
                        message.role === "user"
                          ? "ml-auto max-w-2xl"
                          : "mr-auto max-w-3xl"
                      }
                    >
                      <p
                        className={`mb-2 text-[11px] uppercase tracking-[0.18em] ${
                          message.role === "user"
                            ? "text-right text-zinc-600"
                            : "text-[#9d8659]"
                        }`}
                      >
                        {message.role === "user" ? "You" : "Recognition"} · {formatDate(message.created_at)}
                      </p>
                      <div
                        className={
                          message.role === "user"
                            ? "whitespace-pre-wrap rounded-[1.5rem] border border-white/[0.08] bg-zinc-900 px-5 py-4 text-base leading-7 text-zinc-200"
                            : "whitespace-pre-wrap border-l border-[#6f5a31] pl-5 font-serif text-xl leading-9 text-[#e6dfd2] md:pl-7 md:text-2xl"
                        }
                      >
                        {message.content}
                      </div>
                    </article>
                  ))}
                </div>
              )}

              {selectedThread.status === "active" ? (
                <RecognitionMemoryControls initialAnchors={memory.anchors} />
              ) : (
                <section className="mt-16 rounded-[2rem] border border-zinc-800 bg-black/20 p-6 md:p-8">
                  <p className="text-xs uppercase tracking-[0.22em] text-zinc-500">
                    Archived memory
                  </p>
                  <p className="mt-3 max-w-2xl text-sm leading-7 text-zinc-400">
                    This chat is closed. Its messages remain unchanged here; new
                    Recognition replies use the current chat instead.
                  </p>
                </section>
              )}

              <RecognitionThreadControls
                threadId={selectedThread.id}
                isActive={selectedThread.status === "active"}
                hasConversation={Boolean(selectedThread.message_count)}
              />
            </>
          ) : (
            <div className="rounded-[2rem] border border-zinc-700 bg-[#11100D] p-6">
              <p className="text-base leading-7 text-zinc-300">
                Your Recognition conversation has not started yet.
              </p>
            </div>
          )}
        </section>
      </section>
    </main>
  );
}
