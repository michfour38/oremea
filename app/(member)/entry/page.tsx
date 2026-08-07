import Link from "next/link";
import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";

import { prisma } from "@/lib/prisma";
import { getRunContinuedDays } from "@/src/lib/resonance/resonance-run-data";
import {
  getActiveResonanceRun,
  getResonanceWeekRuns,
} from "@/src/lib/resonance/resonance-week-run";
import MemberNav from "../member-nav";

export const dynamic = "force-dynamic";

type RoomDetail = {
  label: string;
  question: string;
  description: string;
  chooseWhen: string;
  comparison: string;
};

const ROOM_DETAILS: Record<number, RoomDetail> = {
  1: {
    label: "Belonging",
    question: "Where do I feel able to be myself?",
    description:
      "Explore what allows you to arrive, participate, be seen, trust, and remain in relationship with yourself around other people. Notice both the spaces where belonging comes easily and what changes when the room feels less able to hold your full participation.",
    chooseWhen:
      "Belonging, welcome, trust, fitting in, or remaining yourself around others has your attention.",
    comparison: "Is there room for me to remain myself here?",
  },
  2: {
    label: "Patterns",
    question: "How do I show up in relationship?",
    description:
      "Look across different relationships for the roles, expectations, sequences, behaviours, and effects that repeatedly travel with you. See what is recognisably yours without requiring every relationship to have the same explanation.",
    chooseWhen:
      "Something keeps happening and you want to understand your own recurring participation.",
    comparison: "What do I repeatedly bring into relationships?",
  },
  3: {
    label: "Nourishment",
    question: "What sustains me in connection?",
    description:
      "Follow how care, attention, labour, resources, capacity, and consequence move between people. Notice what genuinely restores life, what you naturally provide, and what allows care to circulate sustainably.",
    chooseWhen:
      "Giving, receiving, capacity, reciprocity, care, or who carries what has your attention.",
    comparison: "What sustains the people and capacity inside connection?",
  },
  4: {
    label: "Alignment",
    question: "What am I actually oriented by?",
    description:
      "Explore what matters to you through the priorities, trade-offs, boundaries, and choices that give those values practical authority. Pay particular attention to what happens when several things you genuinely value cannot all be maximised at once.",
    chooseWhen:
      "You know several things matter and want greater clarity about what actually guides your choices.",
    comparison: "What actually has authority when I choose?",
  },
  5: {
    label: "Attraction",
    question: "What draws me toward someone?",
    description:
      "Explore what catches your attention, how attraction registers, what deepens it, what imagination adds, how momentum develops, and what you are actually wanting when desire is present.",
    chooseWhen:
      "Attraction, chemistry, desire, being wanted, fascination, or relational pull has your attention.",
    comparison: "What creates movement, desire, or pull in me?",
  },
  6: {
    label: "Protection",
    question: "What happens in me when something feels threatened?",
    description:
      "Notice the signals, meanings, evidence, and protective responses that become available when something important feels at risk. Hold intuition, history, emotion, evidence, uncertainty, and protection under enough light to see more of the picture at once.",
    chooseWhen:
      "Particular moments change your internal state strongly and you want to understand what happens inside you.",
    comparison: "What happens inside me when something feels threatened?",
  },
  7: {
    label: "Conflict & Repair",
    question: "What happens between us when something comes under pressure?",
    description:
      "Examine the actual issue in conflict, what each person is trying to establish, what gets added through escalation, what remains after rupture, where responsibility belongs, and what repair would genuinely need to address.",
    chooseWhen:
      "An argument, rupture, unresolved conflict, accountability, or repair has your attention.",
    comparison: "What happens between people under pressure?",
  },
  8: {
    label: "Creation",
    question: "What relationship structure am I actually choosing to participate in?",
    description:
      "Make the architecture of relationship visible: structure, agreement, commitment, access, responsibility, participation, and how agreements change when reality changes. Separate what is genuinely agreed from what has been assumed.",
    chooseWhen:
      "You are thinking about what kind of relationship you actually want to create or participate in.",
    comparison: "What relationship structure are we actually creating?",
  },
  9: {
    label: "Integration",
    question: "What belongs together in the way I understand myself?",
    description:
      "Bring different experiences, contexts, contradictions, interpretations, and pieces of information into the same picture. Explore what connects, what remains distinct, and how much explanatory weight each part of your story can reasonably carry.",
    chooseWhen:
      "You already have many pieces and want to understand how they belong together without forcing them into one simple answer.",
    comparison: "What belongs together in the larger picture?",
  },
  10: {
    label: "Embodiment",
    question: "What becomes established through the way I live?",
    description:
      "Look at what your everyday expression, repeated participation, surrounding conditions, lived practice, and accumulated consequences are already making more established over time. Notice how living something also changes what you understand about it.",
    chooseWhen:
      "You understand plenty intellectually and want to see what your actual life is practising into existence.",
    comparison: "What is repetition already making more established?",
  },
};

async function getActiveRunDay(runId: string) {
  const continuedDays = await getRunContinuedDays(runId);

  for (let dayNumber = 1; dayNumber <= 7; dayNumber += 1) {
    if (!continuedDays.has(dayNumber)) return dayNumber;
  }

  return 7;
}

export default async function EntryPage() {
  const { userId } = await auth();
  if (!userId) redirect("/sign-in?redirect_url=%2Fentry");

  const [weeks, activeRun, runs] = await Promise.all([
    prisma.resonance_weeks.findMany({
      orderBy: { week_number: "asc" },
      select: {
        week_number: true,
        title: true,
        theme: true,
        is_published: true,
      },
    }),
    getActiveResonanceRun(userId),
    getResonanceWeekRuns(userId),
  ]);

  const activeDay = activeRun ? await getActiveRunDay(activeRun.id) : null;
  const activeWeek = activeRun
    ? weeks.find((week) => week.week_number === activeRun.weekNumber)
    : null;

  const runsByWeek = new Map<number, typeof runs>();
  for (const run of runs) {
    const weekRuns = runsByWeek.get(run.weekNumber) ?? [];
    weekRuns.push(run);
    runsByWeek.set(run.weekNumber, weekRuns);
  }

  return (
    <main className="relative min-h-screen overflow-x-hidden bg-zinc-950 text-white">
      <div
        className="fixed inset-0 z-0 bg-cover bg-center bg-no-repeat opacity-40 md:hidden"
        style={{ backgroundImage: "url(/images/mobile/bg-entry.webp)" }}
      />
      <div
        className="fixed inset-0 z-0 hidden bg-cover bg-center bg-no-repeat opacity-40 md:block"
        style={{ backgroundImage: "url(/images/desktop/bg-entry.webp)" }}
      />
      <div className="fixed inset-0 z-10 bg-black/65" />

      <div className="relative z-20 min-h-screen">
        <MemberNav />

        <div className="mx-auto max-w-6xl px-6 py-12 md:py-16">
          <header className="max-w-3xl">
            <h1 className="text-4xl font-light tracking-tight md:text-5xl">
              Enter where you are
            </h1>
          </header>

          <section className="mt-14">
            <div className="max-w-3xl">
              <p className="text-xs uppercase tracking-[0.3em] text-[#c8a96a]/70">
                Resonance
              </p>
              <h2 className="mt-3 text-3xl font-light">Which one do you choose?</h2>
              <p className="mt-4 text-base leading-8 text-zinc-300">
                Each purchase opens one seven-day Resonance room. There is no
                required order. Choose the room containing the question that
                currently has your attention. When the visit closes, it remains
                available in the archive. Returning to the same room later opens a
                new visit while preserving the earlier one.
              </p>
            </div>

            <details className="group mt-8 rounded-3xl border border-[#c8a96a]/25 bg-black/35 backdrop-blur-[2px]">
              <summary className="flex cursor-pointer list-none items-center justify-between gap-5 px-6 py-5 md:px-7">
                <div>
                  <p className="text-xs uppercase tracking-[0.22em] text-[#c8a96a]/65">
                    Choosing between them
                  </p>
                  <h3 className="mt-2 text-xl text-zinc-100">Compare the rooms</h3>
                </div>
                <span className="text-zinc-500 transition group-open:rotate-180">
                  ↓
                </span>
              </summary>

              <div className="border-t border-white/5 px-6 py-6 md:px-7">
                <p className="max-w-3xl text-sm leading-7 text-zinc-300">
                  Every room is complete on its own. The difference is the question
                  it holds under attention for seven days.
                </p>

                <div className="mt-6 overflow-hidden rounded-2xl border border-white/10">
                  {weeks.map((week) => {
                    const detail = ROOM_DETAILS[week.week_number];
                    return (
                      <div
                        key={week.week_number}
                        className="grid gap-1 border-b border-white/5 px-5 py-4 last:border-b-0 md:grid-cols-[220px_1fr] md:gap-6"
                      >
                        <div>
                          <p className="text-sm text-zinc-100">{week.title}</p>
                          <p className="mt-1 text-xs uppercase tracking-[0.16em] text-[#c8a96a]/60">
                            {detail?.label ?? week.theme}
                          </p>
                        </div>
                        <p className="text-sm leading-6 text-zinc-300">
                          {detail?.comparison ?? week.theme}
                        </p>
                      </div>
                    );
                  })}
                </div>

                <p className="mt-5 text-sm leading-7 text-zinc-400">
                  There is no required order. Choose the room containing the question
                  that currently has your attention.
                </p>
              </div>
            </details>

            <div className="mt-8 space-y-4">
              {weeks.map((week) => {
                const detail = ROOM_DETAILS[week.week_number];
                const weekRuns = runsByWeek.get(week.week_number) ?? [];
                const completedRuns = weekRuns.filter(
                  (run) => run.status === "completed",
                );
                const preservedRuns = weekRuns.filter(
                  (run) => run.status === "preserved",
                );
                const hasArchivedHistory =
                  completedRuns.length > 0 || preservedRuns.length > 0;
                const isActive = activeRun?.weekNumber === week.week_number;
                const canPurchase = week.is_published && activeRun === null;
                const isLockedByActive =
                  week.is_published && activeRun !== null && !isActive;

                const status = isActive
                  ? `Active · Day ${activeDay ?? 1}`
                  : completedRuns.length > 1
                    ? `${completedRuns.length} completed visits`
                    : completedRuns.length === 1
                      ? "Completed"
                      : preservedRuns.length > 0
                        ? "Preserved visit"
                        : isLockedByActive
                          ? "Locked"
                          : week.is_published
                            ? "Available to purchase"
                            : "Unavailable";

                return (
                  <details
                    key={week.week_number}
                    open={isActive}
                    className="group rounded-3xl border border-white/10 bg-black/35 backdrop-blur-[2px]"
                  >
                    <summary className="flex cursor-pointer list-none items-center justify-between gap-5 px-6 py-5 md:px-7">
                      <div>
                        <p className="text-xs uppercase tracking-[0.22em] text-[#c8a96a]/65">
                          {detail?.label ?? week.theme}
                        </p>
                        <h3 className="mt-2 text-xl text-zinc-100">{week.title}</h3>
                      </div>

                      <div className="flex items-center gap-3">
                        <span className="rounded-full border border-white/10 px-3 py-1 text-[11px] uppercase tracking-[0.16em] text-zinc-400">
                          {status}
                        </span>
                        <span className="text-zinc-500 transition group-open:rotate-180">
                          ↓
                        </span>
                      </div>
                    </summary>

                    <div className="border-t border-white/5 px-6 py-6 md:px-7">
                      {detail ? (
                        <div className="max-w-3xl">
                          <p className="text-lg font-light leading-8 text-zinc-100">
                            {detail.question}
                          </p>
                          <p className="mt-3 text-sm leading-7 text-zinc-300">
                            {detail.description}
                          </p>
                          <p className="mt-4 text-sm leading-7 text-zinc-400">
                            <span className="text-[#c8a96a]/80">Choose this room when:</span>{" "}
                            {detail.chooseWhen}
                          </p>
                        </div>
                      ) : (
                        <p className="max-w-3xl text-sm leading-7 text-zinc-300">
                          {week.theme}
                        </p>
                      )}

                      <div className="mt-6 flex flex-wrap items-center gap-3">
                        {isActive ? (
                          <Link
                            href="/resonance"
                            className="inline-flex rounded-xl border border-[#c8a96a]/60 px-5 py-2.5 text-sm text-[#c8a96a] transition hover:bg-[#c8a96a]/10"
                          >
                            Continue {week.title}
                          </Link>
                        ) : null}

                        {hasArchivedHistory ? (
                          <Link
                            href="/resonance/archive?view=journey"
                            className="inline-flex rounded-xl border border-white/10 px-5 py-2.5 text-sm text-zinc-300 transition hover:border-white/20 hover:text-white"
                          >
                            View previous visit{weekRuns.length === 1 ? "" : "s"}
                          </Link>
                        ) : null}

                        {canPurchase ? (
                          <Link
                            href={`/resonance/purchase?week=${week.week_number}`}
                            className="inline-flex rounded-xl border border-[#c8a96a]/60 px-5 py-2.5 text-sm text-[#c8a96a] transition hover:bg-[#c8a96a]/10"
                          >
                            {hasArchivedHistory
                              ? `Purchase ${week.title} again · $5`
                              : `Purchase ${week.title} · $5`}
                          </Link>
                        ) : null}

                        {isLockedByActive ? (
                          <p className="text-sm text-zinc-500">
                            Complete {activeWeek?.title ?? "your active room"} before
                            opening another room.
                          </p>
                        ) : null}

                        {!week.is_published ? (
                          <p className="text-sm text-zinc-500">
                            This room will open when it is published.
                          </p>
                        ) : null}
                      </div>
                    </div>
                  </details>
                );
              })}
            </div>
          </section>
        </div>
      </div>
    </main>
  );
}
