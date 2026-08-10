import { currentUser } from "@clerk/nextjs/server";
import Link from "next/link";
import { redirect } from "next/navigation";

import { prisma } from "@/lib/prisma";
import { readRecognitionMemory } from "@/src/lib/recognition/recognition-conversation";
import RecognitionMemoryControls from "./recognition-memory-controls";

function formatDate(value: Date | string) {
  return new Date(value).toLocaleDateString("en-ZA", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

type Props = {
  searchParams?: {
    before?: string;
  };
};

const MESSAGE_PAGE_SIZE = 100;

export default async function RecognitionArchivePage({ searchParams }: Props) {
  const user = await currentUser();

  if (!user) {
    redirect("/sign-in?redirect_url=%2Farchive");
  }

  const emails = user.emailAddresses
    .map((item) => item.emailAddress.trim().toLowerCase())
    .filter(Boolean);
  const before = Number(searchParams?.before ?? "0");
  const beforeTurn = Number.isInteger(before) && before > 0 ? before : null;

  const [thread, lead] = await Promise.all([
    prisma.recognition_threads.findUnique({
      where: { user_id: user.id },
      select: {
        id: true,
        message_count: true,
        memory_snapshot: true,
        created_at: true,
      },
    }),
    emails.length > 0
      ? prisma.entry_leads.findFirst({
          where: {
            email: {
              in: emails,
            },
          },
          select: {
            entry_mirror_sessions: {
              orderBy: {
                created_at: "desc",
              },
              select: {
                id: true,
                created_at: true,
                completed_at: true,
                entry_mirror_responses: {
                  orderBy: {
                    response_order: "asc",
                  },
                  select: {
                    id: true,
                    question_text: true,
                    response: true,
                  },
                },
                entry_mirror_outputs: {
                  orderBy: {
                    created_at: "asc",
                  },
                  select: {
                    id: true,
                    output: true,
                    created_at: true,
                  },
                },
              },
            },
          },
        })
      : null,
  ]);

  const conversationRows = thread
    ? await prisma.recognition_messages.findMany({
        where: {
          thread_id: thread.id,
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
  const memory = readRecognitionMemory(thread?.memory_snapshot);
  const legacySessions =
    lead?.entry_mirror_sessions.filter(
      (session) => session.entry_mirror_outputs.length > 0,
    ) ?? [];

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
            The conversation you can return to
          </h1>
          <p className="mt-6 max-w-2xl text-base leading-8 text-zinc-300">
            Your own words and Recognition’s replies remain together over time.
            You also control which exact excerpts Recognition may carry forward as
            long-term memory. Earlier one-process Recognitions are preserved
            separately below.
          </p>
        </header>

        <section className="mt-10">
          <div className="flex flex-wrap items-end justify-between gap-4">
            <div>
              <p className="text-xs uppercase tracking-[0.22em] text-[#d8b15f]">
                Ongoing Recognition
              </p>
              <h2 className="mt-2 font-serif text-3xl text-zinc-100">
                Conversation history
              </h2>
            </div>
            {thread ? (
              <p className="text-sm text-zinc-500">
                {thread.message_count} saved message{thread.message_count === 1 ? "" : "s"}
              </p>
            ) : null}
          </div>

          {conversation.length === 0 ? (
            <div className="mt-6 rounded-[2rem] border border-zinc-700 bg-[#11100D] p-6">
              <p className="text-base leading-7 text-zinc-300">
                Your ongoing Recognition conversation has not started yet.
              </p>
            </div>
          ) : (
            <div className="mt-8 space-y-8">
              {hasEarlier ? (
                <div className="text-center">
                  <Link
                    href={`/recognition/archive?before=${oldestTurn}`}
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
        </section>

        <RecognitionMemoryControls initialAnchors={memory.anchors} />

        {legacySessions.length > 0 ? (
          <details className="mt-16 rounded-[2rem] border border-[#3A3224] bg-[#11100D] p-6 md:p-8">
            <summary className="cursor-pointer list-none">
              <p className="text-xs uppercase tracking-[0.22em] text-[#d8b15f]">
                Earlier Recognition format
              </p>
              <h2 className="mt-2 font-serif text-2xl text-zinc-100">
                Past completed Recognitions · {legacySessions.length}
              </h2>
              <p className="mt-3 text-sm leading-7 text-zinc-400">
                These are preserved exactly as they were created before Recognition
                became one ongoing conversation.
              </p>
            </summary>

            <div className="mt-8 space-y-8 border-t border-zinc-800 pt-8">
              {legacySessions.map((session) => (
                <article
                  key={session.id}
                  className="rounded-3xl border border-zinc-800 bg-black/20 p-5 md:p-7"
                >
                  <p className="text-xs uppercase tracking-[0.2em] text-[#d8b15f]">
                    {formatDate(session.completed_at ?? session.created_at)}
                  </p>

                  <div className="mt-6 space-y-8">
                    {session.entry_mirror_outputs.map((output, index) => (
                      <section key={output.id}>
                        <p className="text-xs uppercase tracking-[0.18em] text-zinc-500">
                          {index === 0
                            ? "Your Recognition"
                            : `Recognition · Pass ${index + 1}`}
                        </p>
                        <div className="mt-3 whitespace-pre-wrap font-serif text-xl leading-relaxed text-zinc-100">
                          {output.output}
                        </div>
                      </section>
                    ))}
                  </div>

                  <details className="mt-7 border-t border-zinc-800 pt-5">
                    <summary className="cursor-pointer text-sm text-[#E7C98B]">
                      Review the answers that shaped this Recognition
                    </summary>
                    <div className="mt-5 space-y-5">
                      {session.entry_mirror_responses.map((response) => (
                        <section key={response.id}>
                          <p className="text-sm leading-7 text-zinc-400">
                            {response.question_text}
                          </p>
                          <p className="mt-2 whitespace-pre-wrap text-base leading-7 text-zinc-200">
                            {response.response}
                          </p>
                        </section>
                      ))}
                    </div>
                  </details>
                </article>
              ))}
            </div>
          </details>
        ) : null}
      </section>
    </main>
  );
}
