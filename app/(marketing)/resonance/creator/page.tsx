import { auth } from "@clerk/nextjs/server";
import Link from "next/link";

import { SiteFooter } from "@/components/site/site-footer";
import { SiteNav } from "@/components/site/site-nav";
import { visitCheckoutAvailableFor } from "@/src/lib/resonance/visit-access";
import { visitCheckoutEnabled } from "@/src/lib/resonance/visit-offers";
import { requestAffiliateCode } from "@/src/lib/whop/affiliate-request";

export const dynamic = "force-dynamic";

export default async function CreatorResonancePage() {
  const { userId } = await auth();
  const referral = await requestAffiliateCode();
  const checkoutReady = userId
    ? await visitCheckoutAvailableFor(userId)
    : visitCheckoutEnabled();

  const funnelHref = "/resonance/visits";
  const signUpHref = `/sign-up?redirect_url=${encodeURIComponent(funnelHref)}`;

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
            <p className="res-text text-2xl font-light">Enter the normal Resonance funnel</p>
            <p className="res-text-secondary mt-4 text-sm leading-7">
              Creator invitations do not change the customer offer. Choose from the same
              Resonance visit options, prices and Complete Ten path available to every customer.
            </p>

            {!referral ? (
              <p className="res-text-primary mt-5 text-sm leading-7">
                This page needs the creator&apos;s original invitation link so attribution can follow the normal funnel.
              </p>
            ) : !checkoutReady ? (
              <p className="res-text-primary mt-5 text-sm leading-7">
                Resonance checkout is not open yet.
              </p>
            ) : userId ? (
              <Link
                href={funnelHref}
                className="res-action-soft mt-6 inline-flex w-full items-center justify-center rounded-xl border px-6 py-3 text-sm font-medium transition"
              >
                Continue to Resonance
              </Link>
            ) : (
              <Link
                href={signUpHref}
                className="res-action-soft mt-6 inline-flex w-full items-center justify-center rounded-xl border px-6 py-3 text-sm font-medium transition"
              >
                Create account to continue
              </Link>
            )}

            <p className="res-text-secondary mt-4 text-xs leading-6">
              Same customer pricing. Affiliate attribution stays in the background.
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
                "Choose the territory",
                "There are ten rooms and no required order. Choose what matches what is actually present now.",
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
            Same Resonance. Same funnel. Creator attribution follows quietly.
          </h2>
          <div className="mt-8 grid gap-4 md:grid-cols-3">
            {[
              ["1 · Choose visits", "Use the normal Resonance visit chooser and pricing ladder."],
              ["2 · Choose the room", "Select the relational territory that matches what is actually present now."],
              ["3 · Move through it", "Work through the seven stages at your own pace. The completed visit remains preserved in the Archive."],
            ].map(([heading, copy]) => (
              <article key={heading} className="res-border res-panel-soft rounded-3xl border p-6">
                <h3 className="res-accent text-sm font-medium">{heading}</h3>
                <p className="res-text-primary mt-4 text-sm leading-7">{copy}</p>
              </article>
            ))}
          </div>
        </section>

        {referral && checkoutReady ? (
          <section className="mx-auto mt-16 max-w-3xl text-center">
            <h2 className="res-text font-serif text-3xl md:text-4xl">
              Begin with the material that is already here.
            </h2>
            <p className="res-text-primary mx-auto mt-5 max-w-2xl text-base leading-8">
              No polished question is required. No complete explanation is required. The room can begin with the words already available.
            </p>
            <Link
              href={userId ? funnelHref : signUpHref}
              className="res-action-soft mt-8 inline-flex rounded-xl border px-6 py-3 text-sm font-medium transition"
            >
              Continue to Resonance
            </Link>
          </section>
        ) : null}
      </div>

      <SiteFooter />
    </main>
  );
}
