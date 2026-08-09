import Link from "next/link";

import {
  RECOGNITION_PRICING,
  formatRecognitionPrice,
} from "@/src/lib/recognition/recognition-pricing";

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

export default function RecognitionPurchasePage() {
  const processCheckout =
    process.env.RECOGNITION_PROCESS_CHECKOUT_URL?.trim() || null;
  const launchPrice = formatRecognitionPrice(
    RECOGNITION_PRICING.launchPriceCents,
  );
  const regularPrice = formatRecognitionPrice(
    RECOGNITION_PRICING.regularPriceCents,
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
        <header className="mt-12 max-w-2xl">
          <p className="text-xs uppercase tracking-[0.3em] text-[#f1dfb4]/70">
            Recognition
          </p>
          <h1 className="mt-4 font-serif text-4xl font-light tracking-tight md:text-6xl">
            Begin one complete process
          </h1>
          <p className="mt-6 text-base leading-8 text-zinc-300">
            Recognition begins with what already has your attention and reflects
            what your own words make visible
          </p>
        </header>

        <div className="mt-10">
          <section className="rounded-3xl border border-[#c8a96a]/35 bg-black/45 p-6 md:p-8">
            <div className="flex flex-wrap items-end justify-between gap-4">
              <div>
                <p className="text-xs uppercase tracking-[0.22em] text-zinc-500">
                  One-time purchase
                </p>
                <h2 className="mt-2 font-serif text-2xl text-zinc-100">
                  One Recognition process
                </h2>
              </div>
              <div className="text-right">
                <p className="text-xs uppercase tracking-[0.18em] text-[#c8a96a]/70">
                  Launch offer
                </p>
                <div className="mt-1 flex items-baseline justify-end gap-3">
                  <span className="text-sm text-zinc-500 line-through">
                    {regularPrice}
                  </span>
                  <span className="text-3xl text-[#f1dfb4]">
                    {launchPrice}
                  </span>
                </div>
              </div>
            </div>

            <p className="mt-5 text-sm leading-7 text-zinc-300">
              Includes the full Recognition question sequence, your generated
              reflection, one opportunity to answer again with greater depth, and
              the completed process saved in your Recognition Archive
            </p>

            <div className="mt-7">
              <CheckoutAction
                href={processCheckout}
                label={`Begin one Recognition process · ${launchPrice}`}
              />
            </div>
          </section>
        </div>

        <div className="mt-8 flex flex-wrap items-center gap-x-6 gap-y-3 text-sm">
          <p className="leading-7 text-zinc-500">
            Prices are shown and charged in US dollars
          </p>
          <Link
            href="https://recognition.oremea.com/archive"
            className="text-zinc-400 underline underline-offset-4 transition hover:text-[#f1dfb4]"
          >
            Open Recognition Archive
          </Link>
        </div>
      </section>
    </main>
  );
}
