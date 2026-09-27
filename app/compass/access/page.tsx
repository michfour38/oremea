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
    question: "Does Compass decide what I should do?",
    answer:
      "No. Compass can clarify current reality, surface priorities, structure a Map, and keep the movement visible. The choice remains yours.",
  },
  {
    question: "Are the seven why layers still part of Compass?",
    answer:
      "Yes. After you choose the area that matters most, Compass keeps the full seven-layer why descent before the Core Reflection and continuing discussion.",
  },
  {
    question: "Can I return to Compass later?",
    answer:
      "Yes. While membership is active, ongoing discussions and Map changes remain available. Your saved Compass Archive remains available after cancellation.",
  },
  {
    question: "Is Compass a fixed action plan?",
    answer:
      "No. Compass structures navigation around what you actually say. It can help make a next movement visible without turning that movement into an instruction.",
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
      className="inline-flex rounded-xl border border-[#c8a96a]/60 px-5 py-3 text-sm text-[#f1dfb4] transition hover:bg-[#c8a96a]/10"
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
          className="text-sm text-zinc-400 underline underline-offset-4 transition hover:text-[#f1dfb4]"
        >
          ← Return to Oremea
        </Link>

        <header className="mt-12 max-w-3xl">
          <p className="text-xs uppercase tracking-[0.3em] text-[#f1dfb4]/70">
            Compass · Help me move
          </p>
          <h1 className="mt-4 font-serif text-4xl font-light tracking-tight md:text-6xl">
            Turn what matters into direction you can actually move with
          </h1>
          <p className="mt-6 max-w-2xl text-base leading-8 text-zinc-300">
            Compass helps make current reality, priorities, the reasons beneath a
            goal, and the next workable movement visible without becoming the
            chooser. Your Map keeps what matters in view while the decisions remain
            yours.
          </p>
        </header>

        <div className="mt-10">
          {access?.active ? (
            <section className="rounded-3xl border border-[#c8a96a]/35 bg-black/45 p-6 md:p-8">
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
                className="mt-7 inline-flex rounded-xl border border-[#c8a96a]/60 px-5 py-3 text-sm text-[#f1dfb4]"
              >
                Continue Compass
              </Link>
            </section>
          ) : (
            <section className="rounded-3xl border border-[#c8a96a]/35 bg-black/45 p-6 md:p-8">
              <div className="flex flex-wrap items-end justify-between gap-5">
                <div>
                  <p className="text-xs uppercase tracking-[0.22em] text-[#c8a96a]">
                    Monthly membership
                  </p>
                  <h2 className="mt-2 font-serif text-2xl text-zinc-100">
                    Keep Compass available while you need it
                  </h2>
                </div>
                <p className="text-3xl text-[#f1dfb4]">
                  {price}
                  <span className="ml-1 text-sm text-zinc-500">/month</span>
                </p>
              </div>

              <p className="mt-5 text-sm leading-7 text-zinc-300">
                Ongoing discussions and Map changes remain available while the
                membership is active. Cancel anytime. Your saved Compass Archive
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
              <p className="text-xs uppercase tracking-[0.28em] text-[#c8a96a]">
                What happens inside Compass
              </p>
              <div className="mt-6 grid gap-4 md:grid-cols-3">
                {[
                  [
                    "1 · See the field",
                    "Move across the areas of life that matter, then bring the one with the strongest pull into focus.",
                  ],
                  [
                    "2 · Go through all seven why layers",
                    "Compass keeps the complete seven-layer descent so the reason beneath the goal has room to become visible before the Core Reflection.",
                  ],
                  [
                    "3 · Continue into movement",
                    "The Core Reflection opens into discussion, while the Compass Map keeps participant-owned priorities and movement visible.",
                  ],
                ].map(([heading, copy]) => (
                  <article
                    key={heading}
                    className="rounded-2xl border border-white/10 bg-black/35 p-5"
                  >
                    <h3 className="text-base text-[#f1dfb4]">{heading}</h3>
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
                  <li>— several priorities are competing for authority</li>
                  <li>— a goal matters but the reason beneath it is still unclear</li>
                  <li>— discussion is useful, but movement now needs somewhere to land</li>
                  <li>— what matters needs to stay visible after the conversation</li>
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
              <p className="text-xs uppercase tracking-[0.28em] text-[#c8a96a]">
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
                    <summary className="cursor-pointer text-sm text-[#f1dfb4]">
                      {item.question}
                    </summary>
                    <p className="mt-4 text-sm leading-7 text-zinc-300">
                      {item.answer}
                    </p>
                  </details>
                ))}
              </div>
            </section>

            <section className="mt-14 rounded-3xl border border-[#c8a96a]/35 bg-black/45 p-6 text-center md:p-8">
              <p className="text-xs uppercase tracking-[0.28em] text-[#c8a96a]">
                Movement remains yours
              </p>
              <h2 className="mx-auto mt-3 max-w-2xl font-serif text-3xl text-zinc-100 md:text-4xl">
                When what matters is clear enough to move, keep it visible.
              </h2>
              <p className="mx-auto mt-4 max-w-2xl text-sm leading-7 text-zinc-300">
                Compass can help structure the navigation. The decision and the
                movement outside the conversation remain yours.
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
          cancelled. Cancel anytime; your saved Archive remains yours.
        </p>
      </section>
    </main>
  );
}
