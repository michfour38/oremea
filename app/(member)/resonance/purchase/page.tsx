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

type RoomPurchaseDetail = {
  label: string;
  question: string;
  description: string;
};

const ROOM_PURCHASE_DETAILS: Record<number, RoomPurchaseDetail> = {
  1: {
    label: "Belonging",
    question: "Where do I feel able to be myself?",
    description:
      "Explore what allows you to arrive, participate, be seen, trust, and remain in relationship with yourself around other people.",
  },
  2: {
    label: "Patterns",
    question: "How do I show up in relationship?",
    description:
      "Look across different relationships for the roles, expectations, sequences, behaviours, and effects that repeatedly travel with you.",
  },
  3: {
    label: "Nourishment",
    question: "What sustains me in connection?",
    description:
      "Follow how care, attention, labour, resources, capacity, and consequence move between people, and what allows care to circulate sustainably.",
  },
  4: {
    label: "Alignment",
    question: "What am I actually oriented by?",
    description:
      "Explore what matters through the priorities, trade-offs, boundaries, and choices that give your values practical authority.",
  },
  5: {
    label: "Attraction",
    question: "What draws me toward someone?",
    description:
      "Explore what catches your attention, how attraction registers, what deepens it, what imagination adds, how momentum develops, and what you are actually wanting when desire is present.",
  },
  6: {
    label: "Protection",
    question: "What happens in me when something feels threatened?",
    description:
      "Notice the signals, meanings, evidence, and protective responses that become available when something important feels at risk.",
  },
  7: {
    label: "Conflict & Repair",
    question: "What happens between us when something comes under pressure?",
    description:
      "Examine the issue in conflict, what each person is trying to establish, what gets added through escalation, what remains afterward, where responsibility belongs, and what repair would need to address.",
  },
  8: {
    label: "Creation",
    question: "What relationship structure am I actually choosing to participate in?",
    description:
      "Make the architecture of relationship visible through structure, agreement, commitment, access, responsibility, participation, and revision.",
  },
  9: {
    label: "Integration",
    question: "What belongs together in the way I understand myself?",
    description:
      "Bring different experiences, contexts, contradictions, interpretations, and pieces of information into the same picture without forcing them into one simple answer.",
  },
  10: {
    label: "Embodiment",
    question: "What becomes established through the way I live?",
    description:
      "Look at what everyday expression, repeated participation, surrounding conditions, and accumulated consequences are already making more established over time.",
  },
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
        is_published: true,
      },
    }),
    getActiveResonanceRun(userId),
    getResonanceWeekRuns(userId, weekNumber),
  ]);

  if (!week?.is_published) redirect("/entry");
  if (activeRun) redirect("/resonance");

  const detail = ROOM_PURCHASE_DETAILS[week.week_number];
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
          <p className="text-xs uppercase tracking-[0.3em] text-[#c8a96a]/70">
            Resonance · {detail?.label ?? "Seven-day room"}
          </p>

          <h1 className="mt-4 text-4xl font-light tracking-tight md:text-5xl">
            {week.title}
          </h1>

          {detail ? (
            <div className="mt-5">
              <p className="text-xl font-light leading-8 text-zinc-100">
                {detail.question}
              </p>
              <p className="mt-3 text-base leading-8 text-zinc-300">
                {detail.description}
              </p>
            </div>
          ) : null}

          <div className="mt-8 rounded-3xl border border-white/10 bg-black/40 p-6 md:p-7">
            <div className="flex flex-wrap items-end justify-between gap-4">
              <div>
                <p className="text-xs uppercase tracking-[0.22em] text-zinc-500">
                  {completedRuns.length > 0 ? `Return · Visit ${nextRunNumber}` : "First visit"}
                </p>
                <p className="mt-2 text-2xl text-zinc-100">One seven-day visit</p>
              </div>
              <p className="text-2xl text-[#c8a96a]">$5</p>
            </div>

            <p className="mt-5 text-sm leading-7 text-zinc-300">
              This purchase opens one fresh seven-day visit to {week.title}. When the
              visit closes, your daily reflections, 2Q answers, and cumulative Mirror
              remain available in your archive.
            </p>

            {completedRuns.length > 0 ? (
              <p className="mt-4 text-sm leading-7 text-zinc-400">
                Your earlier visits remain intact. After this visit is complete, Oremea
                can compare it with an earlier visit without using the earlier one to
                shape what you write now.
              </p>
            ) : null}

            <div className="mt-7 flex flex-wrap gap-3">
              {checkoutHref ? (
                <a
                  href={checkoutHref}
                  className="inline-flex rounded-xl border border-[#c8a96a]/60 px-5 py-3 text-sm text-[#c8a96a] transition hover:bg-[#c8a96a]/10"
                >
                  Purchase {week.title} · $5
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
                Return to rooms
              </Link>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
