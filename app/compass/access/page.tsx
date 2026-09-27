import { affiliateCheckoutUrl } from "@/src/lib/whop/affiliate-attribution";
import { requestAffiliateCode } from "@/src/lib/whop/affiliate-request";
import { auth } from "@clerk/nextjs/server";
import Link from "next/link";

import {
  COMPASS_PRICING,
  formatCompassPrice,
} from "@/src/lib/compass/compass-pricing";
import { getCompassAccessState } from "@/src/lib/compass/compass-access";
import { isCompassSubscriptionFulfillmentConfigured } from "@/src/lib/compass/compass-commerce";

export const dynamic = "force-dynamic";

const compassFaq = [
  {
    question: "Is Compass for setting and achieving goals?",
    answer:
      "Yes. Compass helps you clarify and set goals that are actually yours, understand why they matter, and keep movement toward achieving them visible. It does not choose the goal or do the movement for you.",
  },
  {
    question: "Does Compass decide what I should do?",
    answer:
      "No. Compass can help clarify current reality, surface priorities, and keep movement toward your goal visible. The choice remains yours.",
  },
  {
    question: "Does Compass guarantee that I will achieve a goal?",
    answer:
      "No. Compass supports goal setting, clarification, and structured movement toward achievement. What happens outside the conversation still depends on your choices, circumstances, and participation.",
  },
  {
    question: "Can I return to Compass later?",
    answer:
      "Yes. While membership is active, ongoing discussions and saved progress remain available. Your saved Compass record remains available after cancellation.",
  },
] as const;

function CheckoutAction({
  href,
  label,
}: {
  href: string | null;
  label: string;
}) {
  if (!href) {
    return (
      <span className="inline-flex rounded-xl border border-white/10 px-5 py-3 text-sm text-zinc-500">
        Checkout connection pending
      </span>
    );
  }

  return (
    <a
      href={href}
      className="inline-flex rounded-xl border border-[color:var(--oremea-gold-border-strong)] px-5 py-3 text-sm text-[color:var(--oremea-gold)] transition hover:bg-[color:var(--oremea-gold-10)]"
    >
      {label}
    </a>
  );
}

export default async function CompassAccessPage() {
  const { userId } = await auth();
  const access = userId ? await getCompassAccessState(userId) : null;
  const subscriptionCheckout = affiliateCheckoutUrl(
    process.env.COMPASS_SUBSCRIPTION_CHECKOUT_URL?.trim() || null,
    await requestAffiliateCode(),
  );
  const subscriptionFulfillmentConfigured =
    isCompassSubscriptionFulfillmentConfigured();
  const subscriptionCheckoutHref = !userId
    ? "/sign-in?redirect_url=%2F"
    : subscriptionFulfillmentConfigured
      ? subscriptionCheckout
      : null;
  const price = formatCompassPrice(COMPASS_PRICING.launchPriceCents);

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
      <div className="fixed inset-0 z-10 bg-black/70" />

      <section className="relative z-20 mx-auto max-w-4xl px-6 py-12 md:py-16">
        <Link
          href="https://www.oremea.com"
          className="text-sm text-zinc-400 underline underline-offset-4 transition hover:text-[color:var(--oremea-gold)]"
        >
          ← Return to Oremea
        </Link>

        <header className="mt-12 max-w-3xl">
          <p className="text-xs uppercase tracking-[0.3em] text-[color:var(--oremea-gold)]">
            Compass · Goal setting & movement
          </p>
          <h1 className="mt-4 font-serif text-4xl font-light tracking-tight md:text-6xl">
            Set goals that are actually yours — then work toward achieving them
          </h1>
          <p className="mt-6 max-w-2xl text-base leading-8 text-zinc-300">
            Compass helps you clarify what you want, choose a meaningful goal,
            understand why it matters, and keep your next movement visible as you
            work toward it. Compass can structure the path without becoming the
            chooser. The goal, decisions, and movement remain yours.
          </p>
        </header>

        <div className="mt-10">
          {access?.active ? (
            <section className="rounded-3xl border border-[color:var(--oremea-gold-border-soft)] bg-black/45 p-6 md:p-8">
              <p className="text-xs uppercase tracking-[0.22em] text-zinc-500">
                Access active
              </p>
              <h2 className="mt-3 font-serif text-3xl text-zinc-100">
                Compass is ready
              </h2>
              <p className="mt-5 text-sm leading-7 text-zinc-300">
                {access.source === "membership"
                  ? access.expiresAt
                    ? `Compass membership is active through ${access.expiresAt.toLocaleDateString("en-ZA", { day: "numeric", month: "long", year: "numeric" })}.`
                    : "Your Compass membership is active."
                  : access.expiresAt
                    ? `Your earlier Compass pass remains honoured through ${access.expiresAt.toLocaleDateString("en-ZA", { day: "numeric", month: "long", year: "numeric" })}.`
                    : "Your Oremea owner access is active."}
              </p>
              <Link
                href="/begin"
                className="mt-7 inline-flex rounded-xl border border-[color:var(--oremea-gold-border-strong)] px-5 py-3 text-sm text-[color:var(--oremea-gold)]"
              >
                Continue Compass
              </Link>
            </section>
          ) : (
            <section className="rounded-3xl border border-[color:var(--oremea-gold-border-soft)] bg-black/45 p-6 md:p-8">
              <div className="flex flex-wrap items-end justify-between gap-5">
                <div>
                  <p className="text-xs uppercase tracking-[0.22em] text-[color:var(--oremea-gold)]">
                    Monthly membership
                  </p>
                  <h2 className="mt-2 font-serif text-2xl text-zinc-100">
                    Keep Compass available while you work toward your goals
                  </h2>
                </div>
                <p className="text-3xl text-[color:var(--oremea-gold)]">
                  {price}
                  <span className="ml-1 text-sm text-zinc-500">/month</span>
                </p>
              </div>

              <p className="mt-5 text-sm leading-7 text-zinc-300">
                Ongoing discussions and saved progress remain available while the
                membership is active. Cancel anytime. Your saved Compass record
                remains available after cancellation.
              </p>
              <div className="mt-7 flex flex-wrap items-center gap-4">
                <CheckoutAction
                  href={subscriptionCheckoutHref}
                  label={
                    userId
                      ? `Enter Compass · ${price}/month`
                      : "Sign in to enter Compass"
                  }
                />
                {userId ? null : (
                  <span className="text-sm text-zinc-500">
                    Sign in first so purchase and Compass access stay connected.
                  </span>
                )}
              </div>
            </section>
          )}
        </div>

        {!access?.active ? (
          <>
            <section className="mt-12">
              <p className="text-xs uppercase tracking-[0.28em] text-[color:var(--oremea-gold)]">
                From goal setting to movement
              </p>
              <div className="mt-6 grid gap-4 md:grid-cols-3">
                {[
                  [
                    "1 · Clarify and choose the goal",
                    "Look across the areas of life that matter, make what you want visible, and choose the goal you want to work with now.",
                  ],
                  [
                    "2 · Understand why it matters",
                    "Stay with the goal long enough to understand what gives it weight, what could pull against it, and what needs to remain visible.",
                  ],
                  [
                    "3 · Work toward achieving it",
                    "Turn what becomes clear into practical direction you can return to, revise, and keep moving with as circumstances change.",
                  ],
                ].map(([heading, copy]) => (
                  <article
                    key={heading}
                    className="rounded-2xl border border-white/10 bg-black/35 p-5"
                  >
                    <h3 className="text-base text-[color:var(--oremea-gold)]">{heading}</h3>
                    <p className="mt-3 text-sm leading-7 text-zinc-300">{copy}</p>
                  </article>
                ))}
              </div>
            </section>

            <section className="mt-12 grid gap-5 md:grid-cols-2">
              <div className="rounded-3xl border border-white/10 bg-black/35 p-6">
                <p className="text-xs uppercase tracking-[0.22em] text-zinc-500">
                  Compass may fit when
                </p>
                <ul className="mt-5 space-y-3 text-sm leading-7 text-zinc-300">
                  <li>— you want to set a meaningful goal but need help making it specific</li>
                  <li>— several goals or priorities are competing for authority</li>
                  <li>— a goal matters but the reason beneath it is still unclear</li>
                  <li>— you know what you want and need structure for working toward it</li>
                  <li>— progress needs somewhere visible to return to and revise</li>
                </ul>
              </div>

              <div className="rounded-3xl border border-white/10 bg-black/35 p-6">
                <p className="text-xs uppercase tracking-[0.22em] text-zinc-500">
                  What Compass keeps yours
                </p>
                <ul className="mt-5 space-y-3 text-sm leading-7 text-zinc-300">
                  <li>— the meaning of what you say</li>
                  <li>— the goal you choose</li>
                  <li>— whether a suggested movement actually fits</li>
                  <li>— the authority to act, revise, wait, or choose differently</li>
                </ul>
              </div>
            </section>

            <section className="mt-12">
              <p className="text-xs uppercase tracking-[0.28em] text-[color:var(--oremea-gold)]">
                After purchase
              </p>
              <h2 className="mt-3 font-serif text-3xl text-zinc-100">
                Purchase once. Then return to Compass.
              </h2>
              <p className="mt-4 max-w-2xl text-sm leading-7 text-zinc-300">
                Use the same email for your purchase and Oremea sign-in. As soon as
                access is confirmed, return here and Compass opens into the product.
              </p>
            </section>

            <section className="mt-12">
              <h2 className="font-serif text-3xl text-zinc-100">
                Compass questions
              </h2>
              <div className="mt-6 space-y-4">
                {compassFaq.map((item) => (
                  <details
                    key={item.question}
                    className="rounded-2xl border border-white/10 bg-black/35 p-5"
                  >
                    <summary className="cursor-pointer text-sm text-[color:var(--oremea-gold)]">
                      {item.question}
                    </summary>
                    <p className="mt-4 text-sm leading-7 text-zinc-300">
                      {item.answer}
                    </p>
                  </details>
                ))}
              </div>
            </section>

            <section className="mt-14 rounded-3xl border border-[color:var(--oremea-gold-border-soft)] bg-black/45 p-6 text-center md:p-8">
              <p className="text-xs uppercase tracking-[0.28em] text-[color:var(--oremea-gold)]">
                The goal remains yours
              </p>
              <h2 className="mx-auto mt-3 max-w-2xl font-serif text-3xl text-zinc-100 md:text-4xl">
                Set the goal. Understand why it matters. Keep moving toward it.
              </h2>
              <p className="mx-auto mt-4 max-w-2xl text-sm leading-7 text-zinc-300">
                Compass can help structure goal setting and the movement toward
                achievement. The decisions and participation outside the conversation
                remain yours.
              </p>
              <div className="mt-7 flex flex-wrap items-center justify-center gap-4">
                <CheckoutAction
                  href={subscriptionCheckoutHref}
                  label={
                    userId
                      ? `Enter Compass · ${price}/month`
                      : "Sign in to enter Compass"
                  }
                />
              </div>
            </section>
          </>
        ) : null}

        <p className="mt-8 text-sm leading-7 text-zinc-500">
          Prices are shown and charged in US dollars. Compass renews monthly until
          cancelled. Cancel anytime; your saved Compass record remains yours.
        </p>
      </section>
    </main>
  );
}
