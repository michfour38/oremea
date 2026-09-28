import { randomUUID } from "node:crypto";

import { auth } from "@clerk/nextjs/server";
import Link from "next/link";

import { SiteFooter } from "@/components/site/site-footer";
import { SiteNav } from "@/components/site/site-nav";
import { purchaseCreatorStarter } from "@/app/(member)/resonance/visits/actions";
import {
  creatorStarterEligibility,
} from "@/src/lib/resonance/visit-orders";
import {
  visitCheckoutAvailableFor,
} from "@/src/lib/resonance/visit-access";
import { visitCheckoutEnabled } from "@/src/lib/resonance/visit-offers";
import { requestAffiliateCode } from "@/src/lib/whop/affiliate-request";

export const dynamic = "force-dynamic";

export default async function CreatorResonancePage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const { userId } = await auth();
  const query = await searchParams;
  const referral = await requestAffiliateCode();
  const checkoutReady = userId
    ? await visitCheckoutAvailableFor(userId)
    : visitCheckoutEnabled();
  const eligibility = userId
    ? await creatorStarterEligibility(userId)
    : { eligible: true as const, reason: null };

  const canBuy = Boolean(referral && checkoutReady && eligibility.eligible);
  const signInHref = `/sign-up?redirect_url=${encodeURIComponent("/resonance/creator")}`;

  return (
    <main id="top" className="resonance-theme relative min-h-screen overflow-x-hidden">
      <SiteNav />

      <div className="relative z-10 mx-auto max-w-5xl px-6 py-12 md:py-16">
        <header className="mx-auto max-w-3xl text-center">
          <img
            src="/images/oremea-logo-wht.png"
            alt="Oremea"
            className="mx-auto h-16 w-auto md:h-24"
          />

          <p className="res-accent mt-8 text-sm uppercase tracking-[0.32em] md:text-base">
            A private Resonance invitation
          </p>
          <h1 className="res-text mt-4 font-serif text-4xl font-semibold leading-[0.98] tracking-tight md:text-6xl">
            Some things do not need another quick answer.
          </h1>
          <p className="res-text-primary mx-auto mt-6 max-w-2xl text-base leading-8 md:text-lg">
            They need somewhere to remain visible long enough for the pattern to stop
            disappearing between conversations. Resonance gives one relational territory
            a private seven-stage room to unfold in your own words.
          </p>

          <div className="res-border res-panel mx-auto mt-9 max-w-xl rounded-[2rem] border p-7 md:p-9">
            <p className="res-text text-2xl font-light">One Resonance visit</p>
            <p className="res-text-secondary mt-4 text-sm leading-7">
              One visit opens one room. Choose the room after purchase. Move through
              its seven stages at your own pace. The completed visit remains in your Archive.
            </p>

            {query.error ? (
              <p role="alert" className="res-alert mt-5 text-sm leading-6">
                {query.error === "email"
                  ? "Verify the primary email on this account before purchasing."
                  : query.error === "invite"
                    ? "This creator invitation is no longer connected. Return through the creator's original Oremea link."
                    : "Checkout could not be opened. No payment has been confirmed."}
              </p>
            ) : null}

            {!referral ? (
              <p className="res-text-primary mt-5 text-sm leading-7">
                This page needs the creator&apos;s original invitation link before the starter can open.
              </p>
            ) : !checkoutReady ? (
              <p className="res-text-primary mt-5 text-sm leading-7">
                This invitation is not open for checkout yet.
              </p>
            ) : !eligibility.eligible ? (
              <div className="mt-5">
                <p className="res-text-primary text-sm leading-7">
                  The creator starter is reserved for a first Oremea purchase. Your existing access stays unchanged.
                </p>
                <Link
                  href="/resonance/visits"
                  className="res-action-soft mt-5 inline-flex rounded-xl border px-6 py-3 text-sm font-medium transition"
                >
                  See Resonance visit options
                </Link>
              </div>
            ) : userId ? (
              <form action={purchaseCreatorStarter} className="mt-6">
                <input type="hidden" name="requestId" value={randomUUID()} />
                <button
                  type="submit"
                  disabled={!canBuy}
                  className="res-action-soft inline-flex w-full items-center justify-center rounded-xl border px-6 py-3 text-sm font-medium transition disabled:cursor-not-allowed disabled:opacity-50"
                >
                  Begin one Resonance visit
                </button>
              </form>
            ) : (
              <Link
                href={signInHref}
                className="res-action-soft mt-6 inline-flex w-full items-center justify-center rounded-xl border px-6 py-3 text-sm font-medium transition"
              >
                Create account to begin
              </Link>
            )}

            <p className="res-text-secondary mt-4 text-xs leading-6">
              One-time purchase. No subscription is created by this starter. Current purchase details appear at checkout.
            </p>
          </div>
        </header>

        <section className="mx-auto mt-16 max-w-4xl">
          <div className="grid gap-4 md:grid-cols-3">
            {[
              [
                "Bring what keeps circling",
                "A conversation, rupture, expectation, fear, need or unanswered relational pattern can be enough to begin.",
              ],
              [
                "Choose the territory next",
                "There are ten rooms and no required order. The visit is capacity first; the room is selected only when you are ready to enter it.",
              ],
              [
                "Keep authorship",
                "Resonance reflects what is present in your own written evidence. It does not diagnose you, decide what another person intended or tell you what decision to make.",
              ],
            ].map(([heading, copy]) => (
              <article key={heading} className="res-border res-panel rounded-3xl border p-6 md:p-7">
                <h2 className="res-accent text-sm font-medium">{heading}</h2>
                <p className="res-text-primary mt-4 text-sm leading-7">{copy}</p>
              </article>
            ))}
          </div>
        </section>

        <section className="res-border res-panel mx-auto mt-16 max-w-4xl rounded-[2rem] border p-7 md:p-10">
          <p className="res-accent text-xs uppercase tracking-[0.28em]">What happens after the yes</p>
          <h2 className="res-text mt-3 font-serif text-3xl md:text-4xl">
            Purchase the visit. Then choose where it belongs.
          </h2>
          <div className="mt-8 grid gap-4 md:grid-cols-3">
            {[
              ["1 · Add one visit", "Purchase one Resonance visit through your creator invitation."],
              ["2 · Choose one room", "Select the relational territory that matches what is actually present now."],
              ["3 · Move through it", "Work through the seven stages at your own pace. The completed visit remains preserved in the Archive."],
            ].map(([heading, copy]) => (
              <article key={heading} className="res-border res-panel-soft rounded-3xl border p-6">
                <h3 className="res-accent text-sm font-medium">{heading}</h3>
                <p className="res-text-primary mt-4 text-sm leading-7">{copy}</p>
              </article>
            ))}
          </div>
        </section>

        <section className="mx-auto mt-16 max-w-3xl text-center">
          <h2 className="res-text font-serif text-3xl md:text-4xl">
            Begin with the material that is already here.
          </h2>
          <p className="res-text-primary mx-auto mt-5 max-w-2xl text-base leading-8">
            No polished question is required. No complete explanation is required. The room can begin with the words already available.
          </p>

          {userId && canBuy ? (
            <form action={purchaseCreatorStarter} className="mx-auto mt-8 max-w-md">
              <input type="hidden" name="requestId" value={randomUUID()} />
              <button
                type="submit"
                className="res-action-soft inline-flex w-full items-center justify-center rounded-xl border px-6 py-3 text-sm font-medium transition"
              >
                Begin one Resonance visit
              </button>
            </form>
          ) : !userId && referral && checkoutReady ? (
            <Link
              href={signInHref}
              className="res-action-soft mt-8 inline-flex rounded-xl border px-6 py-3 text-sm font-medium transition"
            >
              Create account to begin
            </Link>
          ) : null}
        </section>
      </div>

      <SiteFooter />
    </main>
  );
}
