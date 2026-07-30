import { currentUser } from "@clerk/nextjs/server";
import Link from "next/link";
import { redirect } from "next/navigation";

import MemberNav from "@/app/(member)/member-nav";
import { prisma } from "@/lib/prisma";

function formatDate(value: Date | string) {
  return new Date(value).toLocaleDateString("en-ZA", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

export default async function RecognitionArchivePage() {
  const user = await currentUser();

  if (!user) {
    redirect("/sign-in");
  }

  const emails = user.emailAddresses
    .map((item) => item.emailAddress.trim().toLowerCase())
    .filter(Boolean);

  const lead =
    emails.length > 0
      ? await prisma.entry_leads.findFirst({
          where: {
            email: {
              in: emails,
            },
          },
          select: {
            email: true,
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
      : null;

  const sessions =
    lead?.entry_mirror_sessions.filter(
      (session) => session.entry_mirror_outputs.length > 0,
    ) ?? [];

  return (
    <main className="min-h-screen bg-[#090909] text-white">
      <MemberNav />

      <section className="mx-auto max-w-4xl px-5 py-12">
        <Link
          href="/recognition"
          className="text-sm text-zinc-200 underline underline-offset-4 transition hover:text-[#d8b15f]"
        >
          Return to Recognition
        </Link>

        <header className="mt-10 border-b border-zinc-700/80 pb-8">
          <p className="text-xs uppercase tracking-[0.32em] text-[#d8b15f]">
            Recognition Archive
          </p>
          <h1 className="mt-5 font-serif text-4xl text-white md:text-6xl">
            What became visible
          </h1>
          <p className="mt-6 max-w-2xl text-base leading-8 text-zinc-200">
            Your saved Recognition reflections and the words that shaped them.
          </p>
        </header>

        <div className="mt-10 space-y-8">
          {sessions.length === 0 ? (
            <section className="rounded-[2rem] border border-zinc-700 bg-[#11100D] p-6">
              <p className="text-base leading-7 text-zinc-100">
                No saved Recognition was found for your signed-in email.
              </p>
            </section>
          ) : (
            sessions.map((session) => (
              <article
                key={session.id}
                className="rounded-[2rem] border border-[#3A3224] bg-[#11100D] p-6 md:p-8"
              >
                <p className="text-xs uppercase tracking-[0.2em] text-[#d8b15f]">
                  {formatDate(session.completed_at ?? session.created_at)}
                </p>

                <div className="mt-7 space-y-8">
                  {session.entry_mirror_outputs.map((output, index) => (
                    <section key={output.id}>
                      <p className="text-xs uppercase tracking-[0.18em] text-[#d8b15f]">
                        {index === 0 ? "Your Recognition" : `Recognition · Pass ${index + 1}`}
                      </p>
                      <div className="mt-4 whitespace-pre-wrap font-serif text-xl leading-relaxed text-zinc-100 md:text-2xl">
                        {output.output}
                      </div>
                    </section>
                  ))}
                </div>

                <details className="mt-8 border-t border-zinc-700/80 pt-6">
                  <summary className="cursor-pointer text-sm font-medium text-[#E7C98B]">
                    Review the answers that shaped this Recognition
                  </summary>

                  <div className="mt-6 space-y-6">
                    {session.entry_mirror_responses.map((response) => (
                      <section key={response.id}>
                        <p className="text-sm leading-7 text-zinc-200">
                          {response.question_text}
                        </p>
                        <p className="mt-2 whitespace-pre-wrap text-base leading-7 text-zinc-100">
                          {response.response}
                        </p>
                      </section>
                    ))}
                  </div>
                </details>
              </article>
            ))
          )}
        </div>
      </section>
    </main>
  );
}
