import Link from "next/link";
import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";

import { prisma } from "@/lib/prisma";
import {
  getActiveResonanceRun,
  getResonanceWeekRuns,
} from "@/src/lib/resonance/resonance-week-run";
import MemberNav from "../../member-nav";

export const dynamic = "force-dynamic";

type Props = {
  searchParams?: {
    week?: string;
  };
};

export default async function ResonancePurchasePage({ searchParams }: Props) {
  const { userId } = await auth();
  if (!userId) {
    redirect(
      `/sign-in?redirect_url=${encodeURIComponent(`/resonance/purchase?week=${searchParams?.week ?? ""}`)}`,
    );
  }

  const weekNumber = Number(searchParams?.week ?? "0");
  if (!Number.isInteger(weekNumber) || weekNumber < 1 || weekNumber > 10) {
    redirect("/entry");
  }

  const [week, activeRun, previousRuns] = await Promise.all([
    prisma.resonance_weeks.findUnique({
      where: { week_number: weekNumber },
      select: {
        week_number: true,
        title: true,
        theme: true,
        is_published: true,
      },
    }),
    getActiveResonanceRun(userId),
    getResonanceWeekRuns(userId, weekNumber),
  ]);

  if (!week?.is_published) redirect("/entry");
  if (activeRun) redirect("/resonance");

  const completedRuns = previousRuns.filter((run) => run.status === "completed");
  const nextRunNumber =
    previousRuns.reduce((highest, run) => Math.max(highest, run.runNumber), 0) + 1;

  const checkoutBase = process.env.RESONANCE_WEEK_CHECKOUT_URL?.trim() || "";
  const checkoutHref = checkoutBase
    ? `${checkoutBase}${checkoutBase.includes("?") ? "&" : "?"}week=${weekNumber}`
    : null;

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

        <div className="mx-auto max-w-2xl px-6 py-12 md:py-16">
          <p className="text-xs uppercase tracking-[0.3em] text-[#f1dfb4]/70">
            Resonance · Week {week.week_number}
          </p>

          <h1 className="mt-4 text-4xl font-light tracking-tight md:text-5xl">
            {week.title}
          </h1>

          <p className="mt-5 text-base leading-8 text-zinc-300">{week.theme}</p>

          <div className="mt-8 rounded-3xl border border-white/10 bg-black/40 p-6 md:p-7">
            <div className="flex flex-wrap items-end justify-between gap-4">
              <div>
                <p className="text-xs uppercase tracking-[0.22em] text-zinc-500">
                  {completedRuns.length > 0 ? `Return · Run ${nextRunNumber}` : "First visit"}
                </p>
                <p className="mt-2 text-2xl text-zinc-100">One seven-day run</p>
              </div>
              <p className="text-2xl text-[#f1dfb4]">$5</p>
            </div>

            <p className="mt-5 text-sm leading-7 text-zinc-300">
              This purchase opens one fresh visit to Week {week.week_number}. Your
              earlier visits remain intact in the archive, including their daily
              reflections, 2Q, and cumulative Mirrors.
            </p>

            {completedRuns.length > 0 ? (
              <p className="mt-4 text-sm leading-7 text-zinc-400">
                After this run is complete, Oremea can compare this visit with the
                earlier one without using the earlier visit to shape what you write now.
              </p>
            ) : null}

            <div className="mt-7 flex flex-wrap gap-3">
              {checkoutHref ? (
                <a
                  href={checkoutHref}
                  className="inline-flex rounded-xl border border-[#c8a96a]/60 px-5 py-3 text-sm text-[#f1dfb4] transition hover:bg-[#c8a96a]/10"
                >
                  Purchase Week {week.week_number} · $5
                </a>
              ) : (
                <span className="inline-flex rounded-xl border border-white/10 px-5 py-3 text-sm text-zinc-500">
                  Checkout connection pending
                </span>
              )}

              <Link
                href="/entry"
                className="inline-flex rounded-xl border border-white/10 px-5 py-3 text-sm text-zinc-300 transition hover:border-white/20 hover:text-white"
              >
                Return to entry
              </Link>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
