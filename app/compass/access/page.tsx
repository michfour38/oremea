import { auth } from "@clerk/nextjs/server";
import Link from "next/link";

import {
  COMPASS_PRICING,
  formatCompassPrice,
} from "@/src/lib/compass/compass-pricing";
import { getCompassAccessState } from "@/src/lib/compass/compass-access";

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
  const compassCheckout = process.env.COMPASS_CHECKOUT_URL?.trim() || null;
  const checkoutHref = userId
    ? compassCheckout
    : "/sign-in?redirect_url=%2F";
  const launchPrice = formatCompassPrice(
    COMPASS_PRICING.launchPriceCents,
  );
  const standardPrice = formatCompassPrice(
    COMPASS_PRICING.standardPriceCents,
  );

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

      <section className="relative z-20 mx-auto max-w-3xl px-6 py-12 md:py-16">
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
                {access.expiresAt
                  ? `${access.daysRemaining} ${access.daysRemaining === 1 ? "day" : "days"} remaining. Access ends ${access.expiresAt.toLocaleDateString("en-ZA", { day: "numeric", month: "long", year: "numeric" })}.`
                  : "Your Oremea owner access is active."}
              </p>
              <Link
                href="/begin"
                className="mt-7 inline-flex rounded-xl border border-[#c8a96a]/60 px-5 py-3 text-sm text-[#f1dfb4] transition hover:bg-[#c8a96a]/10"
              >
                Continue Compass
              </Link>
            </section>
          ) : (
          <section className="rounded-3xl border border-[#c8a96a]/35 bg-black/45 p-6 md:p-8">
            <div className="flex flex-wrap items-end justify-between gap-4">
              <div>
                <p className="text-xs uppercase tracking-[0.22em] text-zinc-500">
                  Launch offer
                </p>
                <h2 className="mt-2 font-serif text-2xl text-zinc-100">
                  Compass · {COMPASS_PRICING.accessDays} days
                </h2>
              </div>
              <div className="text-right">
                <p className="text-sm text-zinc-500 line-through">
                  {standardPrice}
                </p>
                <p className="text-3xl text-[#f1dfb4]">{launchPrice}</p>
              </div>
            </div>

            <p className="mt-5 text-sm leading-7 text-zinc-300">
              One complete month of Compass, including your Map, ongoing
              discussions, and Compass Archive. This purchase does not renew
              automatically.
            </p>

            <div className="mt-7">
              <CheckoutAction
                href={checkoutHref}
                label={
                  userId
                    ? `Enter Compass · ${launchPrice}`
                    : "Sign in to enter Compass"
                }
              />
            </div>

            <p className="mt-4 text-xs leading-6 text-zinc-500">
              Standard {COMPASS_PRICING.accessDays}-day access will be {standardPrice}.
            </p>
            <p className="mt-2 text-xs leading-6 text-zinc-500">
              {userId
                ? "Use the same email address as your Oremea account at checkout. Your 30 days begin when payment succeeds."
                : "Sign in first so your purchase can be connected to your Oremea account."}
            </p>
          </section>
          )}
        </div>

        <p className="mt-8 text-sm leading-7 text-zinc-500">
          Prices are shown and charged in US dollars. Access ends after
          {` ${COMPASS_PRICING.accessDays} days`} unless you choose to return.
        </p>
      </section>
    </main>
  );
}
