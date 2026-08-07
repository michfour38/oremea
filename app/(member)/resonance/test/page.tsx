import { randomUUID } from "node:crypto";

import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";

import {
  createPurchasedResonanceRun,
  getActiveResonanceRun,
} from "@/src/lib/resonance/resonance-week-run";
import MemberNav from "../../member-nav";

export const dynamic = "force-dynamic";

const RESONANCE_TESTER_USER_ID = "user_3CLGEx3xqgXY6DsIHPyV3yOd1xi";
const TEST_WEEK_NUMBER = 7;

async function openForgeTestRun() {
  "use server";

  const { userId } = await auth();

  if (!userId) {
    redirect("/sign-in?redirect_url=%2Fresonance%2Ftest");
  }

  if (userId !== RESONANCE_TESTER_USER_ID) {
    redirect("/entry");
  }

  const activeRun = await getActiveResonanceRun(userId);
  if (activeRun) {
    redirect("/resonance");
  }

  await createPurchasedResonanceRun({
    userId,
    weekNumber: TEST_WEEK_NUMBER,
    purchaseSource: "manual_test",
    purchaseReference: `manual-test-${userId}-${randomUUID()}`,
  });

  redirect("/resonance");
}

export default async function ResonanceTestPage() {
  const { userId } = await auth();

  if (!userId) {
    redirect("/sign-in?redirect_url=%2Fresonance%2Ftest");
  }

  if (userId !== RESONANCE_TESTER_USER_ID) {
    redirect("/entry");
  }

  const activeRun = await getActiveResonanceRun(userId);
  if (activeRun) {
    redirect("/resonance");
  }

  return (
    <main className="min-h-screen bg-zinc-950 text-white">
      <MemberNav />

      <div className="mx-auto flex min-h-[80vh] max-w-3xl items-center px-6 py-16">
        <section className="w-full rounded-3xl border border-[#c8a96a]/30 bg-black/40 p-8 md:p-12">
          <p className="text-xs uppercase tracking-[0.3em] text-[#c8a96a]/70">
            Resonance testing · Conflict &amp; Repair
          </p>
          <h1 className="mt-4 text-4xl font-light tracking-tight">
            The Forge
          </h1>
          <p className="mt-4 text-lg font-light text-zinc-200">
            What happens between us when something comes under pressure?
          </p>
          <p className="mt-6 max-w-2xl text-sm leading-7 text-zinc-400">
            This opens one active seven-day test visit through the same gate used by a
            verified purchase. The Forge will then open at Day 1.
          </p>

          <form action={openForgeTestRun} className="mt-8">
            <button
              type="submit"
              className="inline-flex rounded-xl border border-[#c8a96a]/60 px-6 py-3 text-sm text-[#c8a96a] transition hover:bg-[#c8a96a]/10"
            >
              Open The Forge test visit
            </button>
          </form>
        </section>
      </div>
    </main>
  );
}
