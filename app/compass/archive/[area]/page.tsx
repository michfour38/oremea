import { auth } from "@clerk/nextjs/server";
import { redirect, notFound } from "next/navigation";
import Link from "next/link";

import { prisma } from "@/lib/prisma";
import MemberNav from "@/app/(member)/member-nav";

type Props = {
  params: {
    area: string;
  };
};

const areaLabels: Record<string, string> = {
  relationships: "Relationships",
  income: "Income",
  health: "Health",
  spirituality: "Spirituality",
  investments: "Investments",
  network: "Network",
  knowledge: "Knowledge",
  lifestyle: "Lifestyle",
};

function formatDate(value: Date | string) {
  return new Date(value).toLocaleDateString("en-ZA", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

function asStringArray(value: unknown): string[] {
  return Array.isArray(value)
    ? value.filter((item): item is string => typeof item === "string")
    : [];
}

function asLayerSummary(value: unknown): string[] {
  if (!Array.isArray(value)) return [];

  return value
    .map((item) => {
      if (!item || typeof item !== "object") return null;

      const maybeLayer = item as {
        answer?: unknown;
      };

      return typeof maybeLayer.answer === "string" ? maybeLayer.answer : null;
    })
    .filter((item): item is string => Boolean(item));
}

function getAreaAnswer(value: unknown, area: string): string | null {
  if (!Array.isArray(value)) return null;

  const match = value.find((item) => {
    if (!item || typeof item !== "object") return false;

    const response = item as {
      area?: unknown;
    };

    return response.area === area;
  });

  if (!match || typeof match !== "object") return null;

  const response = match as {
    answer?: unknown;
    response?: unknown;
  };

  if (typeof response.answer === "string") return response.answer;
  if (typeof response.response === "string") return response.response;

  return null;
}

export default async function CompassAreaArchivePage({ params }: Props) {
  const { userId } = await auth();

  if (!userId) {
    redirect("/sign-in");
  }

  const areaLabel = areaLabels[params.area];

  if (!areaLabel) {
    notFound();
  }

  const sessions = await prisma.compass_sessions.findMany({
    where: {
      user_id: userId,
      status: {
        in: ["active", "complete"],
      },
    },
    orderBy: {
      updated_at: "desc",
    },
    select: {
      id: true,
      status: true,
      selected_area: true,
      area_responses: true,
      recursive_layers: true,
      possibility_answers: true,
      proposed_step: true,
      final_step: true,
      updated_at: true,
    },
  });

  const filteredSessions = sessions.filter((session) =>
    Boolean(getAreaAnswer(session.area_responses, params.area)),
  );

  return (
    <main className="relative min-h-screen bg-[#090909] text-white">
      <MemberNav />

      <section className="mx-auto max-w-4xl px-5 py-12">
        <Link
          href="/compass/archive"
          className="text-sm text-zinc-500 underline underline-offset-4 transition hover:text-[#d8b15f]"
        >
          ← Back to Compass Archive
        </Link>

        <div className="mt-10 border-b border-zinc-800/80 pb-8">
          <p className="text-xs uppercase tracking-[0.32em] text-[#d8b15f]">
            Compass Archive
          </p>

          <h1 className="mt-5 text-4xl font-light text-white md:text-6xl">
            {areaLabel}
          </h1>

          <p className="mt-6 max-w-2xl text-base leading-8 text-zinc-400">
            Compass sessions where you reflected on {areaLabel}, whether or not
            it became the final selected direction.
          </p>
        </div>

        <div className="mt-10 space-y-6">
          {filteredSessions.length === 0 ? (
            <div className="rounded-3xl border border-zinc-800/80 bg-black/40 px-6 py-6 text-sm text-zinc-400">
              No Compass reflections have been archived for {areaLabel} yet.
            </div>
          ) : (
            filteredSessions.map((session) => {
              const areaAnswer = getAreaAnswer(session.area_responses, params.area);
              const layers = asLayerSummary(session.recursive_layers);
              const possibilities = asStringArray(session.possibility_answers);

              return (
                <article
                  key={session.id}
                  className="rounded-[2rem] border border-zinc-800/80 bg-black/40 px-6 py-7"
                >
                  <p className="text-[11px] uppercase tracking-[0.18em] text-zinc-500">
                    {formatDate(session.updated_at)}
                  </p>

                  <div className="mt-6 space-y-6">
                    {areaAnswer ? (
                      <section>
                        <p className="text-xs uppercase tracking-[0.18em] text-[#d8b15f]">
                          {areaLabel} Reflection
                        </p>

                        <p className="mt-3 whitespace-pre-wrap text-sm leading-7 text-zinc-300">
                          {areaAnswer}
                        </p>
                      </section>
                    ) : null}

                    {layers.length > 0 ? (
                      <section>
                        <p className="text-xs uppercase tracking-[0.18em] text-[#d8b15f]">
                          Core Reality
                        </p>

                        <p className="mt-3 whitespace-pre-wrap text-sm leading-7 text-zinc-300">
                          {layers[layers.length - 1]}
                        </p>
                      </section>
                    ) : null}

                    {possibilities.length > 0 ? (
                      <section>
                        <p className="text-xs uppercase tracking-[0.18em] text-[#d8b15f]">
                          Possibility
                        </p>

                        <div className="mt-3 space-y-3">
                          {possibilities.map((answer, index) => (
                            <p
                              key={`${session.id}-possibility-${index}`}
                              className="whitespace-pre-wrap text-sm leading-7 text-zinc-400"
                            >
                              {answer}
                            </p>
                          ))}
                        </div>
                      </section>
                    ) : null}

                    <section className="rounded-2xl border border-[#3A3224] bg-[#17130D] px-5 py-5">
                      <p className="text-xs uppercase tracking-[0.18em] text-[#d8b15f]">
                        Final Step
                      </p>

                      {session.final_step || session.proposed_step ? (
  <p className="mt-3 whitespace-pre-wrap text-sm leading-7 text-zinc-300">
    {session.final_step || session.proposed_step}
  </p>
) : (
  <Link
    href="/compass"
    className="mt-3 inline-block text-sm leading-7 text-[#E7C98B] underline underline-offset-4 transition hover:text-[#f1dfb4]"
  >
    This Compass session ended before a Final Step was chosen.
  </Link>
)}
                    </section>
                  </div>
                </article>
              );
            })
          )}
        </div>
      </section>
    </main>
  );
}