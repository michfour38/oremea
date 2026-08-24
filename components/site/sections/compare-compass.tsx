import Link from "next/link";
import type { CompareMode } from "@/app/compare/page";
import { ProductLaunchPrice } from "@/components/site/product-launch-price";
import {
  COMPASS_PRICING,
  formatCompassPrice,
} from "@/src/lib/compass/compass-pricing";

const COMPASS_LAUNCH_PRICE = formatCompassPrice(
  COMPASS_PRICING.launchPriceCents,
);
const COMPASS_REGULAR_PRICE = formatCompassPrice(
  COMPASS_PRICING.standardPriceCents,
);

type CompareCompassProps = {
  mode: CompareMode;
};

export function CompareCompass({ mode }: CompareCompassProps) {
  return (
    <section className="border-b border-white/5 bg-zinc-950/60">
      <div className="mx-auto max-w-6xl px-5 py-24">
        <div className="grid gap-14 md:grid-cols-[0.95fr_1.05fr]">
          <div>
            <p className="mb-5 text-xs uppercase tracking-[0.28em] text-[#b79a63]">
              Direction & Execution
            </p>

            <h2 className="text-4xl font-light leading-tight text-zinc-100">
              Compass
            </h2>

            <p className="mt-6 text-lg leading-8 text-zinc-400">
              Turn what matters into participant-owned movement.
            </p>
          </div>

          <div className="rounded-3xl border border-white/10 bg-white/[0.02] p-10">
            {mode === "experience" ? (
              <div className="space-y-8">
                <div className="rounded-3xl border border-white/10 bg-zinc-950/80 p-8">
                  <p className="font-serif text-2xl leading-relaxed text-zinc-100 md:text-3xl">
                    Like knowing what you are choosing next.
                  </p>

                  <p className="mt-8 font-serif text-xl leading-relaxed text-zinc-400">
                    Like several competing priorities becoming clear enough to
                    choose between.
                  </p>

                  <p className="mt-8 font-serif text-xl leading-relaxed text-zinc-400">
                    Like seeing why a goal matters before deciding how to pursue
                    it.
                  </p>

                  <p className="mt-8 font-serif text-xl leading-relaxed text-zinc-400">
                    Like keeping what matters visible on a Map while your goals
                    remain yours to choose.
                  </p>

                  <p className="mt-8 font-serif text-xl leading-relaxed text-zinc-400">
                    Like noticing when more discussion is no longer changing what
                    can happen outside the conversation.
                  </p>

                  <ProductLaunchPrice
                    className="mt-10"
                    regularPrice={COMPASS_REGULAR_PRICE}
                    launchPrice={COMPASS_LAUNCH_PRICE}
                    unit="/ month"
                  />

                  <div className="mt-4 flex flex-wrap gap-4">
                    <Link
                      href="https://compass.oremea.com"
                      className="rounded-full border border-[#b79a63]/25 bg-[#b79a63]/[0.05] px-5 py-2 text-sm text-[#b79a63] transition hover:border-[#b79a63]/55 hover:bg-[#b79a63]/10"
                    >
                      Enter Compass
                    </Link>
                  </div>
                </div>
              </div>
            ) : (
              <div className="space-y-8">
                <div>
                  <p className="mb-4 text-sm uppercase tracking-[0.18em] text-zinc-500">
                    Focus
                  </p>

                  <p className="text-base leading-8 text-zinc-300">
                    Compass clarifies current reality, choice, and workable
                    movement. Its Map keeps what the conversation surfaces visible,
                    while participant-authored goals remain separate from AI-generated
                    Map state. Compass can structure navigation without becoming the
                    chooser.
                  </p>
                </div>

                <div>
                  <p className="mb-4 text-sm uppercase tracking-[0.18em] text-zinc-500">
                    Designed For
                  </p>

                  <ul className="grid gap-3 text-base leading-7 text-zinc-400 md:grid-cols-2">
                    <li>• personal direction</li>
                    <li>• decision-making</li>
                    <li>• visible priorities</li>
                    <li>• deliberate execution</li>
                  </ul>
                </div>

                <div>
                  <p className="mb-4 text-sm uppercase tracking-[0.18em] text-zinc-500">
                    Includes
                  </p>

                  <ul className="grid gap-3 text-base leading-7 text-zinc-400 md:grid-cols-2">
                    <li>• layered goal exploration</li>
                    <li>• priority clarification</li>
                    <li>• recursive discussion</li>
                    <li>• persistent Compass Map</li>
                    <li>• participant-created goals</li>
                    <li>• executable next-movement structure</li>
                  </ul>
                </div>

                <div className="rounded-2xl border border-white/10 bg-black/20 p-6">
                  <p className="text-sm leading-7 text-zinc-400">
                    Compass can illuminate and structure the choice. The participant
                    remains the chooser, and movement outside the conversation remains
                    the authority.
                  </p>
                </div>

                <ProductLaunchPrice
                  regularPrice={COMPASS_REGULAR_PRICE}
                  launchPrice={COMPASS_LAUNCH_PRICE}
                  unit="/ month"
                />

                <p className="text-sm leading-7 text-zinc-500">
                  Monthly membership. Cancel anytime. Saved Archive remains available
                  after cancellation.
                </p>

                <div className="flex flex-wrap gap-4 pt-2">
                  <Link
                    href="https://compass.oremea.com"
                    className="rounded-full border border-[#b79a63]/25 bg-[#b79a63]/[0.05] px-5 py-2 text-sm text-[#b79a63] transition hover:border-[#b79a63]/55 hover:bg-[#b79a63]/10"
                  >
                    Enter Compass
                  </Link>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
