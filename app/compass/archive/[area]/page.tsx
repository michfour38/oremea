import { auth } from "@clerk/nextjs/server";
import { redirect, notFound } from "next/navigation";
import Link from "next/link";

import { prisma } from "@/lib/prisma";
import MemberNav from "@/app/(member)/member-nav";
import { getCompassAccessState } from "@/src/lib/compass/compass-access";

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

function getDiscussionPreview(value: unknown): string | null {
  if (!Array.isArray(value)) return null;

  for (let index = value.length - 1; index >= 0; index -= 1) {
    const item = value[index];
    if (!item || typeof item !== "object") continue;

    const message = item as {
      role?: unknown;
      content?: unknown;
    };

    if (
      message.role === "participant" &&
      typeof message.content === "string" &&
      message.content.trim()
    ) {
      return message.content.trim();
    }
  }

  return null;
}

function getMapCounts(value: unknown) {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return { active: 0, completed: 0, archived: 0 };
  }

  const state = value as {
    version?: unknown;
    mapItems?: unknown;
  };

  if (state.version !== 1 || !Array.isArray(state.mapItems)) {
    return { active: 0, completed: 0, archived: 0 };
  }

  return state.mapItems.reduce(
    (counts, item) => {
      if (!item || typeof item !== "object") return counts;
      const status = (item as { status?: unknown }).status;

      if (status === "active" || status === "waiting") counts.active += 1;
      if (status === "completed") counts.completed += 1;
      if (status === "released") counts.archived += 1;

      return counts;
    },
    { active: 0, completed: 0, archived: 0 },
  );
}

export default async function CompassAreaArchivePage({ params }: Props) {
  const { userId } = await auth();

  if (!userId) {
    redirect("/sign-in");
  }

  if (!(await getCompassAccessState(userId)).active) {
    redirect("/");
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
      phase: true,
      selected_area: true,
      area_responses: true,
      recursive_layers: true,
      possibility_answers: true,
      discussion_messages: true,
      detected_patterns: true,
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
            Compass runs that included a {areaLabel} goal or direction.
          </p>
        </div>

        <div className="mt-10 space-y-6">
          {filteredSessions.length === 0 ? (
            <div className="rounded-3xl border border-zinc-800/80 bg-black/40 px-6 py-6 text-sm text-zinc-400">
              No Compass runs have been archived for {areaLabel} yet.
            </div>
          ) : (
            filteredSessions.map((session) => {
              const areaAnswer = getAreaAnswer(session.area_responses, params.area);
              const layers = asLayerSummary(session.recursive_layers);
              const possibilities = asStringArray(session.possibility_answers);
              const discussionPreview = getDiscussionPreview(
                session.discussion_messages,
              );
              const mapCounts = getMapCounts(session.detected_patterns);
              const isConversationWithExistingGoals =
                session.phase === "discussion" &&
                layers.length === 0 &&
                possibilities.length === 0;

              return (
                <article
                  key={session.id}
                  className="rounded-[2rem] border border-zinc-800/80 bg-black/40 px-6 py-7"
                >
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <p className="text-[11px] uppercase tracking-[0.18em] text-zinc-500">
                      {formatDate(session.updated_at)}
                    </p>
                    <span className="rounded-full border border-zinc-800 px-3 py-1 text-[10px] uppercase tracking-[0.16em] text-zinc-500">
                      {session.status === "active" ? "Current" : "Complete"}
                    </span>
                  </div>

                  {isConversationWithExistingGoals ? (
                    <div className="mt-6">
                      <p className="text-xs uppercase tracking-[0.18em] text-[#d8b15f]">
                        Conversation with existing goals
                      </p>

                      <p className="mt-3 whitespace-pre-wrap text-sm leading-7 text-zinc-300">
                        {discussionPreview ??
                          "This conversation continues with the goals already held in this Compass."}
                      </p>

                      {mapCounts.active > 0 ||
                      mapCounts.completed > 0 ||
                      mapCounts.archived > 0 ? (
                        <div className="mt-4 flex flex-wrap gap-2 text-xs text-zinc-500">
                          {mapCounts.active > 0 ? (
                            <span>{mapCounts.active} active on Map</span>
                          ) : null}
                          {mapCounts.completed > 0 ? (
                            <span>{mapCounts.completed} completed</span>
                          ) : null}
                          {mapCounts.archived > 0 ? (
                            <span>{mapCounts.archived} archived</span>
                          ) : null}
                        </div>
                      ) : null}
                    </div>
                  ) : (
                    <div className="mt-6 space-y-6">
                      {areaAnswer ? (
                        <section>
                          <p className="text-xs uppercase tracking-[0.18em] text-[#d8b15f]">
                            {areaLabel} goal
                          </p>

                          <p className="mt-3 whitespace-pre-wrap text-sm leading-7 text-zinc-300">
                            {areaAnswer}
                          </p>
                        </section>
                      ) : null}

                      {layers.length > 0 ? (
                        <section>
                          <p className="text-xs uppercase tracking-[0.18em] text-[#d8b15f]">
                            Where the Descent arrived
                          </p>

                          <p className="mt-3 whitespace-pre-wrap text-sm leading-7 text-zinc-300">
                            {layers[layers.length - 1]}
                          </p>
                        </section>
                      ) : null}

                      {possibilities.length > 0 ? (
                        <section>
                          <p className="text-xs uppercase tracking-[0.18em] text-[#d8b15f]">
                            What became possible
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

                      {session.final_step || session.proposed_step ? (
                        <section className="rounded-2xl border border-[#3A3224] bg-[#17130D] px-5 py-5">
                          <p className="text-xs uppercase tracking-[0.18em] text-[#d8b15f]">
                            Movement chosen in this Compass
                          </p>

                          <p className="mt-3 whitespace-pre-wrap text-sm leading-7 text-zinc-300">
                            {session.final_step || session.proposed_step}
                          </p>
                        </section>
                      ) : null}
                    </div>
                  )}

                  <Link
                    href={`/compass/archive/session/${session.id}`}
                    className="mt-6 flex w-full items-center justify-center rounded-full border border-[#3A3224] bg-[#17130D] px-5 py-3 text-sm text-[#E7C98B] transition hover:border-[#C8A96A] hover:bg-[#21190F]"
                  >
                    Open Discussion and Map
                  </Link>
                </article>
              );
            })
          )}
        </div>
      </section>
    </main>
  );
}
