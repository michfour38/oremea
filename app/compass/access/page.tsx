import { auth } from "@clerk/nextjs/server";
import Link from "next/link";

import {
  COMPASS_PRICING,
  formatCompassPrice,
} from "@/src/lib/compass/compass-pricing";
import { getCompassAccessState } from "@/src/lib/compass/compass-access";
import { isCompassSubscriptionFulfillmentConfigured } from "@/src/lib/compass/compass-commerce";

export const dynamic = "force-dynamic";

const faq = [
  {
    question: "Is Compass therapy or coaching?",
    answer:
      "No. Compass is a private reflection and direction tool. It does not diagnose, treat, coach or replace professional support.",
  },
  {
    question: "Does Compass tell me what to do?",
    answer:
      "No. Compass helps clarify current reality, keep what matters visible on a working Map and identify possible movement. The decision about what to do remains yours.",
  },
  {
    question: "Do I need to complete Recognition or Resonance first?",
    answer:
      "No. Compass stands on its own. Choose it when understanding is already present and something now needs direction.",
  },
  {
    question: "Do I have to finish a sequence once I start?",
    answer:
      "No. Compass has no required destination or completion ladder. You can stop when the movement you needed has become clear.",
  },
  {
    question: "What happens if I cancel?",
    answer:
      "Compass is a monthly membership that can be cancelled anytime. New discussions and Map changes require active access, while your saved Compass Archive remains available after cancellation.",
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
  const subscriptionCheckout =
    process.env.COMPASS_SUBSCRIPTION_CHECKOUT_URL?.trim() || null;
  const subscriptionFulfillmentConfigured =
    isCompassSubscriptionFulfillmentConfigured();
  const subscriptionCheckoutHref = !userId
    ? "/sign-in?redirect_url=%2F"
    : subscriptionFulfillmentConfigured
      ? subscriptionCheckout
      : null;
  const price = formatCompassPrice(COMPASS_PRICING.launchPriceCents);
  const structuredData = [
    {
      "@context": "https://schema.org",
      "@type": "Product",
      name: "Compass",
      description:
        "Turn what matters into clear direction, keep it visible on a working Map, and make the next movement that is actually yours.",
      url: "https://compass.oremea.com/",
      brand: { "@type": "Brand", name: "Oremea" },
      offers: {
        "@type": "Offer",
        url: "https://whop.com/oremea/compass-e0/",
        priceCurrency: COMPASS_PRICING.currency,
        price: (COMPASS_PRICING.standardPriceCents / 100).toFixed(2),
        availability: "https://schema.org/InStock",
      },
    },
    {
      "@context": "https://schema.org",
      "@type": "FAQPage",
      mainEntity: faq.map((item) => ({
        "@type": "Question",
        name: item.question,
        acceptedAnswer: {
          "@type": "Answer",
          text: item.answer,
        },
      })),
    },
  ];

  return (
    <main className="relative min-h-screen overflow-x-hidden bg-zinc-950 text-white">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
      />
      <div
        className="fixed inset-0 z-0 bg-cover bg-center bg-no-repeat opacity-40 md:hidden"
        style={{ backgroundImage: "url(/images/mobile/bg-entry.webp)" }}
      />
      <div
        className="fixed inset-0 z-0 hidden bg-cover bg-center bg-no-repeat opacity-40 md:block"
        style={{ backgroundImage: "url(/images/desktop/bg-entry.webp)" }}
      />
      <div className="fixed inset-0 z-10 bg-black/70" />

      <section className="relative z-20 mx-auto max-w-3xl px-6 py-12 md:py-16">
        <Link
          href="https://www.oremea.com"
          className="text-sm text-zinc-400 underline underline-offset-4 transition hover:text-[#f1dfb4]"
        >
          ← Return to Oremea
        </Link>

        <header className="mt-12 max-w-2xl">
          <p className="text-xs uppercase tracking-[0.3em] text-[#f1dfb4]/70">
            Compass
          </p>
          <h1 className="mt-4 font-serif text-4xl font-light tracking-tight md:text-6xl">
            Enter Compass
          </h1>
          <p className="mt-6 text-base leading-8 text-zinc-300">
            Compass turns what matters into clear direction, a working Map, and
            the next movement you can actually make.
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
              <p className="text-xs uppercase tracking-[0.22em] text-[#c8a96a]">
                Monthly membership
              </p>
              <h2 className="mt-2 font-serif text-2xl text-zinc-100">
                Keep Compass available while you need it
              </h2>
              <p className="mt-5 text-3xl text-[#f1dfb4]">
                {price}<span className="ml-1 text-sm text-zinc-500">/month</span>
              </p>
              <p className="mt-5 text-sm leading-7 text-zinc-300">
                Ongoing discussions and Map changes remain available while the
                membership is active. Cancel anytime. Your saved Compass Archive
                remains available after cancellation.
              </p>
              <div className="mt-7">
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
          )}
        </div>

        <section className="mt-12">
          <h2 className="font-serif text-3xl text-white">
            Compass questions
          </h2>
          <div className="mt-6 space-y-4">
            {faq.map((item) => (
              <details
                key={item.question}
                className="rounded-2xl border border-white/10 bg-black/35 p-5"
              >
                <summary className="cursor-pointer text-sm text-[#f1dfb4]">
                  {item.question}
                </summary>
                <p className="mt-4 text-sm leading-7 text-zinc-400">
                  {item.answer}
                </p>
              </details>
            ))}
          </div>
        </section>

        <p className="mt-8 text-sm leading-7 text-zinc-500">
          Prices are shown and charged in US dollars. Compass renews monthly until
          cancelled. Cancel anytime; your saved Archive remains yours.
        </p>
      </section>
    </main>
  );
}
