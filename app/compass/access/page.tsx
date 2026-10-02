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
      "Yes. Compass helps you get clear on a goal that actually matters to you, understand why it matters, and keep your movement toward it visible. It does not choose the goal or make the decisions for you.",
  },
  {
    question: "Is Compass just another productivity tool?",
    answer:
      "No. A planner can be useful once the direction is already clear. Compass is for the part where the goal itself needs clarity: what you really want, what keeps getting in the way, what still matters when motivation changes, and what movement actually fits now.",
  },
  {
    question: "Does Compass tell me what I should do?",
    answer:
      "No. Compass can help you see the goal, the competing priorities around it, and the movement available to you. The choices remain yours.",
  },
  {
    question: "Does Compass guarantee that I will achieve a goal?",
    answer:
      "No. Compass supports goal setting, clarity, and movement toward achievement. Real life still changes, and outcomes still depend on choices, circumstances, timing, and participation.",
  },
  {
    question: "Can I come back when things change?",
    answer:
      "Yes. That is part of the point. A goal can stay important while the route changes. While your Compass access is active, you can return, reassess, and keep working with what is true now.",
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
            Ever noticed how a goal can really matter to you — and still keep slipping away?
          </h1>
          <p className="mt-6 max-w-2xl text-base leading-8 text-zinc-300">
            You decide this is the thing you are finally going to do. You picture it.
            You make the list. Maybe you even start well. And then life moves, another
            priority gets louder, the plan stops fitting, or the energy you had at the
            beginning simply disappears.
          </p>
          <p className="mt-4 max-w-2xl text-base leading-8 text-zinc-300">
            And then comes the annoying part: wondering whether the problem is discipline.
            Whether you just need to try harder. Whether everyone else somehow knows how
            to stay focused and you missed the memo.
          </p>
          <p className="mt-4 max-w-2xl text-base leading-8 text-zinc-300">
            What you actually wish for is a way to work out what you really want, why it
            matters enough to keep carrying, and what the next move looks like when real
            life refuses to follow the original plan. That is where Compass comes in.
          </p>
        </header>

        <div className="mt-10">
          {access?.active ? (
            <section className="rounded-3xl border border-[color:var(--oremea-gold-border-soft)] bg-black/45 p-6 text-center md:p-8">
              <p className="text-xs uppercase tracking-[0.22em] text-zinc-500">
                Access active
              </p>
              <h2 className="mt-3 font-serif text-3xl text-zinc-100">
                Compass is ready
              </h2>
              <p className="mx-auto mt-5 max-w-2xl text-sm leading-7 text-zinc-300">
                {access.source === "eternal_key"
                  ? "Your Golden Key gives you lifetime Compass access."
                  : access.source === "membership"
                    ? access.expiresAt
                      ? `Compass access is active through ${access.expiresAt.toLocaleDateString("en-ZA", { day: "numeric", month: "long", year: "numeric" })}.`
                      : "Your Compass access is active."
                    : access.expiresAt
                      ? `Your earlier Compass pass remains honoured through ${access.expiresAt.toLocaleDateString("en-ZA", { day: "numeric", month: "long", year: "numeric" })}.`
                      : "Your Oremea owner access is active."}
              </p>
              <div className="mt-7 flex justify-center">
                <Link
                  href="/begin"
                  className="inline-flex rounded-xl border border-[color:var(--oremea-gold-border-strong)] px-5 py-3 text-sm text-[color:var(--oremea-gold)]"
                >
                  Continue Compass
                </Link>
              </div>
            </section>
          ) : (
            <section className="rounded-3xl border border-[color:var(--oremea-gold-border-soft)] bg-black/45 p-6 text-center md:p-8">
              <p className="text-xs uppercase tracking-[0.22em] text-[color:var(--oremea-gold)]">
                Compass access
              </p>
              <h2 className="mx-auto mt-2 max-w-2xl font-serif text-2xl text-zinc-100 md:text-3xl">
                What if the goal did not need more pressure — just more clarity?
              </h2>
              <p className="mx-auto mt-5 max-w-2xl text-sm leading-7 text-zinc-300">
                Compass is designed to stay with the goal while real life changes around
                it. Come back when a priority moves, when progress stalls, when the next
                step stops fitting, or when the goal itself starts asking a different
                question.
              </p>
              <div className="mt-7 flex flex-wrap items-center justify-center gap-4">
                <CheckoutAction
                  href={subscriptionCheckoutHref}
                  label={userId ? "View Compass access" : "Sign in to view Compass access"}
                />
              </div>
              {userId ? null : (
                <p className="mx-auto mt-4 max-w-xl text-sm text-zinc-500">
                  Sign in first so purchase and Compass access stay connected.
                </p>
              )}
            </section>
          )}
        </div>

        {!access?.active ? (
          <>
            <section className="mt-16 max-w-3xl">
              <p className="text-xs uppercase tracking-[0.28em] text-[color:var(--oremea-gold)]">
                Sound familiar?
              </p>
              <h2 className="mt-3 font-serif text-3xl text-zinc-100 md:text-4xl">
                You keep restarting the same kind of goal — and every restart feels like proof that you failed the last one
              </h2>
              <div className="mt-6 space-y-5 text-sm leading-7 text-zinc-300 md:text-base md:leading-8">
                <p>
                  New month. New notebook. New promise to yourself. This time you will be
                  organised. This time you will make the move, finish the thing, build the
                  habit, change the work, sort the finances, write the book, get stronger,
                  launch the idea, have the conversation — whatever the goal happens to be.
                </p>
                <p>
                  And then something shifts. Not necessarily dramatically. A child needs
                  you. Work gets louder. Energy changes. The goal starts competing with
                  three other things that also matter. Suddenly the neat plan you made on
                  Sunday looks ridiculous by Wednesday.
                </p>
                <p>
                  So you either force yourself harder or quietly stop looking at the goal.
                  Neither one answers the useful question: <em>what is actually happening here?</em>
                </p>
                <p>
                  Sometimes the goal is right and the route is wrong. Sometimes the goal is
                  too vague to move toward. Sometimes it belongs to an older version of life.
                  Sometimes it is absolutely yours, but it has never been clear enough to
                  survive contact with reality.
                </p>
              </div>
            </section>

            <section className="mt-16 max-w-3xl">
              <p className="text-xs uppercase tracking-[0.28em] text-[color:var(--oremea-gold)]">
                That is the problem Compass is built for
              </p>
              <h2 className="mt-3 font-serif text-3xl text-zinc-100 md:text-4xl">
                Not another person telling you to want it more
              </h2>
              <div className="mt-6 space-y-5 text-sm leading-7 text-zinc-300 md:text-base md:leading-8">
                <p>
                  There is no shortage of advice about goals. Wake up earlier. Be more
                  disciplined. Make the vision board. Break it into tasks. Track the habit.
                  Optimise the morning routine.
                </p>
                <p>
                  All of that can be useful — <em>after</em> the direction is clear. But a
                  beautifully organised plan for the wrong goal is still the wrong goal.
                  And a plan that ignores the life you are actually living becomes another
                  thing to feel behind on.
                </p>
                <p>
                  Compass starts somewhere more human: with what is true now. What matters.
                  What is competing for attention. What keeps changing. What still pulls at
                  you after the excitement has worn off. From there, the goal can become
                  specific enough to work with and flexible enough to live with.
                </p>
              </div>
            </section>

            <section className="mt-16">
              <p className="text-xs uppercase tracking-[0.28em] text-[color:var(--oremea-gold)]">
                What working with Compass feels like
              </p>
              <div className="mt-6 grid gap-4 md:grid-cols-3">
                {[
                  [
                    "Get clear on the goal",
                    "Not the goal that sounds impressive. Not the one somebody else thinks should matter. The one that actually has weight for you now.",
                  ],
                  [
                    "Understand why it keeps pulling at you",
                    "Notice what gives the goal meaning, what competes with it, and what needs to remain visible when motivation changes.",
                  ],
                  [
                    "Keep movement connected to real life",
                    "Work with practical direction that can change when circumstances change, without losing sight of what the goal was trying to move toward in the first place.",
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
                  Compass may feel familiar if...
                </p>
                <ul className="mt-5 space-y-3 text-sm leading-7 text-zinc-300">
                  <li>— you keep saying “I know what I want” but the next move stays fuzzy</li>
                  <li>— several goals all feel important at the same time</li>
                  <li>— you are brilliant at starting and tired of starting over</li>
                  <li>— the goal matters, but forcing yourself toward it is not working</li>
                  <li>— progress disappears the minute real life gets busy</li>
                  <li>— you want movement without handing someone else authority over the direction</li>
                </ul>
              </div>

              <div className="rounded-3xl border border-white/10 bg-black/35 p-6">
                <p className="text-xs uppercase tracking-[0.22em] text-[color:var(--oremea-gold)]">
                  What Compass does not take from you
                </p>
                <ul className="mt-5 space-y-3 text-sm leading-7 text-zinc-300">
                  <li>— the meaning of what you say</li>
                  <li>— the goal you choose</li>
                  <li>— the right to decide that a suggestion does not fit</li>
                  <li>— the pace at which you move</li>
                  <li>— the authority to act, revise, wait, or choose differently</li>
                  <li>— the right to realise that the goal itself has changed</li>
                </ul>
              </div>
            </section>

            <section className="mt-16 max-w-3xl">
              <p className="text-xs uppercase tracking-[0.28em] text-[color:var(--oremea-gold)]">
                And no, Compass cannot control the outcome
              </p>
              <h2 className="mt-3 font-serif text-3xl text-zinc-100 md:text-4xl">
                Because no honest goal-setting tool can promise that life will cooperate
              </h2>
              <div className="mt-6 space-y-5 text-sm leading-7 text-zinc-300 md:text-base md:leading-8">
                <p>
                  Other people make decisions. Resources change. Bodies get tired.
                  Opportunities appear late or disappear early. Sometimes the goal stays
                  right while the route changes completely.
                </p>
                <p>
                  Compass is not here to pretend those things do not exist. It is here to
                  help keep the goal, its meaning, and the movement available now visible
                  enough that you can participate deliberately instead of repeatedly losing
                  the thread.
                </p>
                <p>
                  That is also why Compass does not need to become the boss of the goal.
                  The point is not obedience to a system. The point is clearer participation
                  in something you actually chose.
                </p>
              </div>
            </section>

            <section className="mt-16">
              <p className="text-xs uppercase tracking-[0.28em] text-[color:var(--oremea-gold)]">
                After purchase
              </p>
              <h2 className="mt-3 font-serif text-3xl text-zinc-100">
                Purchase. Come back. Start with the goal that is already on your mind.
              </h2>
              <p className="mt-4 max-w-2xl text-sm leading-7 text-zinc-300">
                Use the same email for your purchase and Oremea sign-in. As soon as access
                is confirmed, return here and Compass opens into the product. No new system
                to learn before beginning. Bring the goal as it is now.
              </p>
            </section>

            <section className="mt-16">
              <h2 className="font-serif text-3xl text-zinc-100">
                Questions that usually come up before starting
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
                Maybe the goal does not need another restart
              </p>
              <h2 className="mx-auto mt-3 max-w-2xl font-serif text-3xl text-zinc-100 md:text-4xl">
                Maybe it needs somewhere to become clear enough to move with
              </h2>
              <p className="mx-auto mt-4 max-w-2xl text-sm leading-7 text-zinc-300">
                Compass can help you set the goal, understand why it matters, and keep
                movement toward it visible without taking the decisions away from you.
                When you are ready, the current access options are one click away.
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
