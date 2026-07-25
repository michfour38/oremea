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
              <p className="text-xs uppercase tracking-[0.3em] text-[#f1dfb4]/70">
                Resonance
              </p>
              <h2 className="mt-3 text-3xl font-light">Choose a room.</h2>
              <p className="mt-4 text-base leading-8 text-zinc-300">
                Each purchase opens one seven-day Resonance run. When the run
                closes, that visit remains available in the archive. Returning to
                the same room later opens a new run while preserving the earlier
                visit.
              </p>
            </div>

            <div className="mt-8 space-y-4">
              {weeks.map((week) => {
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
                  ? `Active · Run ${activeRun.runNumber} · Day ${activeDay ?? 1}`
                  : completedRuns.length > 1
                    ? `${completedRuns.length} completed visits`
                    : completedRuns.length === 1
                      ? `Completed · Run ${completedRuns[0].runNumber}`
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
                        <p className="text-xs uppercase tracking-[0.22em] text-[#f1dfb4]/65">
                          Week {week.week_number}
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
                      <p className="max-w-3xl text-sm leading-7 text-zinc-300">
                        {week.theme}
                      </p>

                      <div className="mt-5 flex flex-wrap items-center gap-3">
                        {isActive ? (
                          <Link
                            href="/resonance"
                            className="inline-flex rounded-xl border border-[#c8a96a]/60 px-5 py-2.5 text-sm text-[#f1dfb4] transition hover:bg-[#c8a96a]/10"
                          >
                            Continue Week {week.week_number} · Run {activeRun.runNumber}
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
                            className="inline-flex rounded-xl border border-[#c8a96a]/60 px-5 py-2.5 text-sm text-[#f1dfb4] transition hover:bg-[#c8a96a]/10"
                          >
                            {hasArchivedHistory
                              ? `Purchase Week ${week.week_number} again · $5`
                              : `Purchase Week ${week.week_number} · $5`}
                          </Link>
                        ) : null}

                        {isLockedByActive ? (
                          <p className="text-sm text-zinc-500">
                            Complete Week {activeRun.weekNumber} · Run {activeRun.runNumber}
                            {" "}before opening another room.
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
