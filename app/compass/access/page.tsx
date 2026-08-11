import { auth } from "@clerk/nextjs/server";
import Link from "next/link";

import {
  COMPASS_PRICING,
  formatCompassPrice,
} from "@/src/lib/compass/compass-pricing";
import { getCompassAccessState } from "@/src/lib/compass/compass-access";
import {
  isCompassPassFulfillmentConfigured,
  isCompassSubscriptionFulfillmentConfigured,
} from "@/src/lib/compass/compass-commerce";

export const dynamic = "force-dynamic";

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
  const { userId } = auth();
  const access = userId ? await getCompassAccessState(userId) : null;
  const compassPassCheckout = process.env.COMPASS_CHECKOUT_URL?.trim() || null;
  const compassSubscriptionCheckout =
    process.env.COMPASS_SUBSCRIPTION_CHECKOUT_URL?.trim() || null;
  const passFulfillmentConfigured = isCompassPassFulfillmentConfigured();
  const subscriptionFulfillmentConfigured =
    isCompassSubscriptionFulfillmentConfigured();
  const passCheckoutHref = !userId
    ? "/sign-in?redirect_url=%2F"
    : passFulfillmentConfigured
      ? compassPassCheckout
      : null;
  const subscriptionCheckoutHref = !userId
    ? "/sign-in?redirect_url=%2F"
    : subscriptionFulfillmentConfigured
      ? compassSubscriptionCheckout
      : null;
  const launchPrice = formatCompassPrice(COMPASS_PRICING.launchPriceCents);
  const standardPrice = formatCompassPrice(COMPASS_PRICING.standardPriceCents);

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

        <header className="mt-12 max-w-2xl">
          <p className="text-xs uppercase tracking-[0.3em] text-[#f1dfb4]/70">
            The Compass
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
                    ? `Monthly Compass is active through ${access.expiresAt.toLocaleDateString("en-ZA", { day: "numeric", month: "long", year: "numeric" })}.`
                    : "Your monthly Compass membership is active."
                  : access.expiresAt
                    ? `${access.daysRemaining} ${access.daysRemaining === 1 ? "day" : "days"} remaining. Access ends ${access.expiresAt.toLocaleDateString("en-ZA", { day: "numeric", month: "long", year: "numeric" })}.`
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
            <div className="grid gap-5 md:grid-cols-2">
              <section className="rounded-3xl border border-[#c8a96a]/35 bg-black/45 p-6 md:p-8">
                <p className="text-xs uppercase tracking-[0.22em] text-zinc-500">
                  Launch offer
                </p>
                <h2 className="mt-2 font-serif text-2xl text-zinc-100">
                  {COMPASS_PRICING.accessDays}-day pass
                </h2>
                <div className="mt-5">
                  <p className="text-sm text-zinc-500 line-through">{standardPrice}</p>
                  <p className="mt-1 text-3xl text-[#f1dfb4]">{launchPrice}</p>
                </div>
                <p className="mt-5 text-sm leading-7 text-zinc-300">
                  One complete 30-day Compass period, including Map changes and
                  ongoing discussions. Your saved Compass Archive remains available
                  afterward. The pass does not renew automatically.
                </p>
                <div className="mt-7">
                  <CheckoutAction
                    href={passCheckoutHref}
                    label={
                      userId
                        ? `Choose 30-day pass · ${launchPrice}`
                        : "Sign in to enter Compass"
                    }
                  />
                </div>
              </section>

              <section className="rounded-3xl border border-[#c8a96a]/35 bg-black/45 p-6 md:p-8">
                <p className="text-xs uppercase tracking-[0.22em] text-[#c8a96a]">
                  Monthly option
                </p>
                <h2 className="mt-2 font-serif text-2xl text-zinc-100">
                  Ongoing Compass
                </h2>
                <div className="mt-5">
                  <p className="text-sm text-zinc-500 line-through">
                    {standardPrice}/month
                  </p>
                  <p className="mt-1 text-3xl text-[#f1dfb4]">
                    {launchPrice}<span className="ml-1 text-sm text-zinc-500">/month</span>
                  </p>
                </div>
                <p className="mt-5 text-sm leading-7 text-zinc-300">
                  Keep Compass available month to month without repurchasing a new
                  30-day pass. Access follows the active subscription and your saved
                  Compass Archive remains available if the subscription ends.
                </p>
                <div className="mt-7">
                  <CheckoutAction
                    href={subscriptionCheckoutHref}
                    label={
                      userId
                        ? `Choose monthly · ${launchPrice}/month`
                        : "Sign in to enter Compass"
                    }
                  />
                </div>
              </section>
            </div>
          )}
        </div>

        <p className="mt-8 text-sm leading-7 text-zinc-500">
          Prices are shown and charged in US dollars. Choose a 30-day pass when you
          want a defined Compass period, or monthly access when you want Compass to
          remain available continuously.
        </p>
      </section>
    </main>
  );
}
