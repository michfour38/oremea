import Link from "next/link";
import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";

import { prisma } from "@/lib/prisma";
import { getResonanceWeekState } from "@/src/lib/resonance/resonance-week-state";
import MemberNav from "../member-nav";
import { activateResonanceWeekAction } from "../resonance/actions";

export const dynamic = "force-dynamic";

async function getActiveWeekDay(userId: string, weekNumber: number) {
  const week = await prisma.resonance_weeks.findUnique({
    where: { week_number: weekNumber },
    include: {
      resonance_days: {
        orderBy: { day_number: "asc" },
        include: {
          day_prompts: {
            where: { is_published: true },
            include: {
              prompt_completions: {
                where: { user_id: userId },
                select: { id: true },
              },
            },
          },
        },
      },
    },
  });

  if (!week) return 1;

  const continued = await prisma.resonance_day_continues.findMany({
    where: {
      user_id: userId,
      week_number: weekNumber,
    },
    select: { day_number: true },
  });

  const continuedDays = new Set(continued.map((row) => row.day_number));

  for (const day of week.resonance_days) {
    const prompts = day.day_prompts;
    if (prompts.length === 0) continue;

    const reflectionsComplete = prompts.every(
      (prompt) => prompt.prompt_completions.length > 0,
    );

    if (!reflectionsComplete || !continuedDays.has(day.day_number)) {
      return day.day_number;
    }
  }

  return 7;
}

function ProductCard({
  title,
  description,
  href,
  action,
}: {
  title: string;
  description: string;
  href: string;
  action: string;
}) {
  return (
    <Link
      href={href}
      className="block rounded-3xl border border-white/10 bg-black/35 p-7 backdrop-blur-[2px] transition hover:border-[#c8a96a]/40 hover:bg-black/45"
    >
      <p className="text-xs uppercase tracking-[0.24em] text-[#f1dfb4]/70">
        {title}
      </p>
      <p className="mt-4 text-base leading-8 text-zinc-300">{description}</p>
      <p className="mt-6 text-sm text-[#f1dfb4]">{action} →</p>
    </Link>
  );
}

export default async function EntryPage() {
  const { userId } = await auth();
  if (!userId) redirect("/sign-in?redirect_url=%2Fentry");

  const [weeks, weekState] = await Promise.all([
    prisma.resonance_weeks.findMany({
      orderBy: { week_number: "asc" },
      select: {
        week_number: true,
        title: true,
        theme: true,
        is_published: true,
      },
    }),
    getResonanceWeekState(userId),
  ]);

  const activeDay = weekState.activeWeek
    ? await getActiveWeekDay(userId, weekState.activeWeek)
    : null;

  const completedSet = new Set(weekState.completedWeeks);

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
            <p className="text-xs uppercase tracking-[0.3em] text-[#f1dfb4]/70">
              Oremea
            </p>
            <h1 className="mt-4 text-4xl font-light tracking-tight md:text-5xl">
              Enter where you are.
            </h1>
            <p className="mt-5 max-w-2xl text-base leading-8 text-zinc-300">
              Recognition helps you see yourself. Resonance helps you stay with
              yourself. Compass helps you move.
            </p>
          </header>

          <section className="mt-10 grid gap-5 md:grid-cols-2">
            <ProductCard
              title="Recognition"
              description="A focused private reflection for seeing what is already present in your own account."
              href="/recognition"
              action="Begin Recognition"
            />
            <ProductCard
              title="Compass"
              description="A structured space for direction, alignment, and executable movement."
              href="/compass"
              action="Enter Compass"
            />
          </section>

          <section className="mt-14">
            <div className="max-w-3xl">
              <p className="text-xs uppercase tracking-[0.3em] text-[#f1dfb4]/70">
                Resonance
              </p>
              <h2 className="mt-3 text-3xl font-light">Choose one week.</h2>
              <p className="mt-4 text-base leading-8 text-zinc-300">
                Each week is its own room. When no week is active, every unfinished
                published week is available. Once you enter one, that week becomes
                your Resonance space until its seventh day and cumulative Mirror are
                complete.
              </p>
            </div>

            <div className="mt-8 space-y-4">
              {weeks.map((week) => {
                const isCompleted = completedSet.has(week.week_number);
                const isActive = weekState.activeWeek === week.week_number;
                const isAvailable =
                  week.is_published &&
                  weekState.activeWeek === null &&
                  !isCompleted;
                const isLocked =
                  !isCompleted && !isActive && !isAvailable;

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
                          {isCompleted
                            ? "Completed"
                            : isActive
                              ? `Active · Day ${activeDay ?? 1}`
                              : isAvailable
                                ? "Available"
                                : "Locked"}
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
                            Continue Week {week.week_number}
                          </Link>
                        ) : null}

                        {isAvailable ? (
                          <form action={activateResonanceWeekAction}>
                            <input
                              type="hidden"
                              name="weekNumber"
                              value={week.week_number}
                            />
                            <button
                              type="submit"
                              className="inline-flex rounded-xl border border-[#c8a96a]/60 px-5 py-2.5 text-sm text-[#f1dfb4] transition hover:bg-[#c8a96a]/10"
                            >
                              Enter Week {week.week_number}
                            </button>
                          </form>
                        ) : null}

                        {isCompleted ? (
                          <Link
                            href="/resonance/archive?view=day"
                            className="inline-flex rounded-xl border border-white/10 px-5 py-2.5 text-sm text-zinc-300 transition hover:border-white/20 hover:text-white"
                          >
                            View in archive
                          </Link>
                        ) : null}

                        {isLocked ? (
                          <p className="text-sm text-zinc-500">
                            {week.is_published
                              ? `Complete Week ${weekState.activeWeek} before choosing another week.`
                              : "This week will open when it is published."}
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
