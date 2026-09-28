import { affiliateCheckoutUrl } from "@/src/lib/whop/affiliate-attribution";
import { requestAffiliateCode } from "@/src/lib/whop/affiliate-request";
import { auth } from "@clerk/nextjs/server";
import Link from "next/link";

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
    question: "Is Compass just another productivity tool?",
    answer:
      "No. Productivity can help once the direction is already clear. Compass is for the part before and alongside action: identifying what actually matters, making the goal specific enough to work with, and keeping movement connected to the reason the goal matters in the first place.",
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
      "Yes. While your Compass access is active, ongoing discussions and saved progress remain available so you can return, reassess, and keep working with what changes.",
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
        Access connection pending
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
            A goal can look perfectly sensible on paper and still go nowhere. Sometimes
            the problem is not discipline, motivation, or another missing system.
            Sometimes the goal is vague. Sometimes several priorities are competing.
            Sometimes the reason for wanting it has never become clear enough to carry
            the weight of the work.
          </p>
          <p className="mt-4 max-w-2xl text-base leading-8 text-zinc-300">
            Compass gives that uncertainty somewhere to become visible. It helps you
            clarify what you want, choose a meaningful goal, understand why it matters,
            and keep practical movement in view as you work toward it. Compass can help
            structure the path without becoming the chooser. The goal, the decisions,
            and the movement remain yours.
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
                    ? `Compass access is active through ${access.expiresAt.toLocaleDateString("en-ZA", { day: "numeric", month: "long", year: "numeric" })}.`
                    : "Your Compass access is active."
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
              <p className="text-xs uppercase tracking-[0.22em] text-[color:var(--oremea-gold)]">
                Compass access
              </p>
              <h2 className="mt-2 max-w-2xl font-serif text-2xl text-zinc-100 md:text-3xl">
                Give the goal somewhere to become clear before asking yourself to carry it
              </h2>
              <p className="mt-5 max-w-2xl text-sm leading-7 text-zinc-300">
                Compass is designed to stay available while a goal develops in real life.
                Return when something changes, when a priority moves, when progress stalls,
                or when the next step no longer fits as neatly as it did before.
              </p>
              <div className="mt-7 flex flex-wrap items-center gap-4">
                <CheckoutAction
                  href={subscriptionCheckoutHref}
                  label={userId ? "View Compass access" : "Sign in to view Compass access"}
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
            <section className="mt-16 max-w-3xl">
              <p className="text-xs uppercase tracking-[0.28em] text-[color:var(--oremea-gold)]">
                The problem is not always motivation
              </p>
              <h2 className="mt-3 font-serif text-3xl text-zinc-100 md:text-4xl">
                A goal can be important and still be difficult to move toward
              </h2>
              <div className="mt-6 space-y-5 text-sm leading-7 text-zinc-300 md:text-base md:leading-8">
                <p>
                  There are times when more discipline is useful. There are also times
                  when pushing harder simply makes an unclear goal louder. A person can
                  keep making lists, setting deadlines, restarting routines, and trying to
                  force consistency while the underlying direction is still unsettled.
                </p>
                <p>
                  Compass is built for that distinction. It does not assume that every
                  stalled goal needs pressure. It creates a place to look at the goal,
                  the competing demands around it, the reason it matters, and the movement
                  that is actually available now.
                </p>
                <p>
                  The aim is not to produce a perfect plan that life is then expected to
                  obey. The aim is to make the direction clear enough that movement can be
                  chosen, noticed, revised, and continued without losing the person who is
                  doing the choosing.
                </p>
              </div>
            </section>

            <section className="mt-16">
              <p className="text-xs uppercase tracking-[0.28em] text-[color:var(--oremea-gold)]">
                From goal setting to movement
              </p>
              <div className="mt-6 grid gap-4 md:grid-cols-3">
                {[
                  [
                    "1 · Clarify and choose the goal",
                    "Look across the areas of life that matter, make what you want visible, and choose the goal you want to work with now. The point is not to choose the most impressive goal. It is to identify the one that actually has authority for this season of life.",
                  ],
                  [
                    "2 · Understand why it matters",
                    "Stay with the goal long enough to notice what gives it weight, what could pull against it, and what needs to remain visible when enthusiasm changes. A goal becomes easier to work with when the reason for carrying it is not hidden from view.",
                  ],
                  [
                    "3 · Work toward achieving it",
                    "Turn what becomes clear into practical direction you can return to, revise, and keep moving with as circumstances change. Progress does not have to be dramatic to be real; it has to remain connected to the goal you actually chose.",
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

            <section className="mt-16 grid gap-5 md:grid-cols-2">
              <div className="rounded-3xl border border-white/10 bg-black/35 p-6">
                <p className="text-xs uppercase tracking-[0.22em] text-[color:var(--oremea-gold)]">
                  Compass may fit when
                </p>
                <ul className="mt-5 space-y-3 text-sm leading-7 text-zinc-300">
                  <li>— you want to set a meaningful goal but need help making it specific</li>
                  <li>— several goals or priorities are competing for authority</li>
                  <li>— a goal matters but the reason beneath it is still unclear</li>
                  <li>— you keep restarting and want to understand what keeps changing</li>
                  <li>— you know what you want and need structure for working toward it</li>
                  <li>— progress needs somewhere visible to return to and revise</li>
                </ul>
              </div>

              <div className="rounded-3xl border border-white/10 bg-black/35 p-6">
                <p className="text-xs uppercase tracking-[0.22em] text-[color:var(--oremea-gold)]">
                  What Compass keeps yours
                </p>
                <ul className="mt-5 space-y-3 text-sm leading-7 text-zinc-300">
                  <li>— the meaning of what you say</li>
                  <li>— the goal you choose</li>
                  <li>— whether a suggested movement actually fits</li>
                  <li>— the pace at which you work with it</li>
                  <li>— the authority to act, revise, wait, or choose differently</li>
                  <li>— the right to discover that the goal itself has changed</li>
                </ul>
              </div>
            </section>

            <section className="mt-16 max-w-3xl">
              <p className="text-xs uppercase tracking-[0.28em] text-[color:var(--oremea-gold)]">
                Not a promise of perfect outcomes
              </p>
              <h2 className="mt-3 font-serif text-3xl text-zinc-100 md:text-4xl">
                Compass helps hold direction. It does not pretend to control life.
              </h2>
              <div className="mt-6 space-y-5 text-sm leading-7 text-zinc-300 md:text-base md:leading-8">
                <p>
                  Goals live inside changing circumstances. Other people make decisions.
                  Resources change. Bodies get tired. Opportunities open and close.
                  Sometimes a goal remains right while the route changes completely.
                </p>
                <p>
                  Compass does not promise that every goal will be achieved exactly as
                  imagined. It helps make the goal, its meaning, and the available movement
                  visible enough to participate deliberately instead of repeatedly losing
                  the thread.
                </p>
              </div>
            </section>

            <section className="mt-16">
              <p className="text-xs uppercase tracking-[0.28em] text-[color:var(--oremea-gold)]">
                After purchase
              </p>
              <h2 className="mt-3 font-serif text-3xl text-zinc-100">
                Complete checkout. Then return to Compass.
              </h2>
              <p className="mt-4 max-w-2xl text-sm leading-7 text-zinc-300">
                Use the same email for your purchase and Oremea sign-in. As soon as
                access is confirmed, return here and Compass opens into the product.
              </p>
            </section>

            <section className="mt-16">
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

            <section className="mt-16 rounded-3xl border border-[color:var(--oremea-gold-border-soft)] bg-black/45 p-6 text-center md:p-8">
              <p className="text-xs uppercase tracking-[0.28em] text-[color:var(--oremea-gold)]">
                The goal remains yours
              </p>
              <h2 className="mx-auto mt-3 max-w-2xl font-serif text-3xl text-zinc-100 md:text-4xl">
                Set the goal. Understand why it matters. Keep moving toward it.
              </h2>
              <p className="mx-auto mt-4 max-w-2xl text-sm leading-7 text-zinc-300">
                Compass can help structure goal setting and the movement toward
                achievement without taking over the decisions that belong to you.
                When you are ready, continue to the access page to see the current
                purchase options.
              </p>
              <div className="mt-7 flex flex-wrap items-center justify-center gap-4">
                <CheckoutAction
                  href={subscriptionCheckoutHref}
                  label={userId ? "View Compass access" : "Sign in to view Compass access"}
                />
              </div>
            </section>
          </>
        ) : null}
      </section>
    </main>
  );
}
