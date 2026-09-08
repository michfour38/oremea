import type { Metadata } from "next";
import { auth } from "@clerk/nextjs/server";
import { notFound, redirect } from "next/navigation";

import {
  PRODUCT_TEST_TARGETS,
  getProductTestTarget,
  isProductTestOwner,
  resetProductTestState,
} from "@/src/lib/testing/product-test-reset";

export const metadata: Metadata = {
  title: "Product Test Reset | Oremea",
  robots: {
    index: false,
    follow: false,
    noarchive: true,
    nocache: true,
  },
};

async function resetAndOpen(formData: FormData) {
  "use server";

  const { userId } = await auth();
  if (!userId) redirect("/sign-in");
  if (!isProductTestOwner(userId)) notFound();

  const target = getProductTestTarget(formData.get("target"));
  if (!target) {
    throw new Error("Unknown product test target.");
  }

  await resetProductTestState({ userId, target });
  redirect(target.href);
}

export default async function ProductTestPage() {
  const { userId } = await auth();

  if (!userId) redirect("/sign-in");
  if (!isProductTestOwner(userId)) notFound();

  return (
    <main className="min-h-screen bg-[#070707] px-5 py-10 text-zinc-100 sm:px-8">
      <div className="mx-auto max-w-5xl">
        <header className="mb-10 max-w-3xl">
          <p className="mb-3 text-xs uppercase tracking-[0.28em] text-[#c8a96a]">
            Owner test surface · noindex
          </p>
          <h1 className="text-4xl font-semibold tracking-tight sm:text-5xl">
            Start every Oremea product clean.
          </h1>
          <p className="mt-5 text-base leading-7 text-zinc-400">
            Each button clears only your test state for that product, then opens
            its real participant-facing start. Your Clerk identity, Oremea
            profile, Whop records, entitlements, purchase references and product
            configuration are not deleted.
          </p>
          <div className="mt-5 rounded-2xl border border-amber-200/15 bg-amber-100/[0.04] p-4 text-sm leading-6 text-zinc-300">
            Resonance is isolated room-by-room for this audit. Earlier test runs
            are preserved out of the live chronology rather than deleted, so a
            fresh room cannot inherit old reflections. If a room has never had a
            run, an owner-only test run is created without pretending it was a
            customer sale.
          </div>
        </header>

        <section className="grid gap-4 md:grid-cols-2">
          {PRODUCT_TEST_TARGETS.map((target, index) => (
            <article
              key={target.key}
              className="rounded-3xl border border-white/10 bg-white/[0.035] p-6 shadow-2xl shadow-black/20"
            >
              <div className="flex items-start justify-between gap-5">
                <div>
                  <p className="text-xs uppercase tracking-[0.22em] text-zinc-500">
                    {String(index + 1).padStart(2, "0")} · {target.kind}
                  </p>
                  <h2 className="mt-2 text-xl font-medium text-white">
                    {target.label}
                  </h2>
                  {target.kind === "resonance" ? (
                    <p className="mt-2 text-sm text-zinc-500">
                      Room {target.weekNumber} · clean seven-day run
                    </p>
                  ) : target.kind === "current" ? (
                    <p className="mt-2 text-sm text-zinc-500">
                      Resets qualification and invitation test state only; The
                      Current remains private by product truth.
                    </p>
                  ) : (
                    <p className="mt-2 text-sm text-zinc-500">
                      Clears participant test progress only.
                    </p>
                  )}
                </div>

                <form action={resetAndOpen}>
                  <input type="hidden" name="target" value={target.key} />
                  <button
                    type="submit"
                    className="shrink-0 rounded-full border border-[#c8a96a]/50 bg-[#c8a96a]/10 px-4 py-2 text-sm font-medium text-[#ead8ad] transition hover:bg-[#c8a96a]/20"
                  >
                    Reset & open
                  </button>
                </form>
              </div>
            </article>
          ))}
        </section>

        <footer className="mt-10 border-t border-white/10 pt-6 text-sm leading-6 text-zinc-500">
          This page is deliberately absent from public navigation. Use it only
          for the owner audit of Transparency · Contrast · Curiosity ·
          Participant authorship.
        </footer>
      </div>
    </main>
  );
}
