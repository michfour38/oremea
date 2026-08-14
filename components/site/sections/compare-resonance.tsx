import Link from "next/link";
import type { CompareMode } from "@/app/compare/page";
import { ProductLaunchPrice } from "@/components/site/product-launch-price";
import {
  RESONANCE_LAUNCH_PRICE,
  RESONANCE_REGULAR_PRICE,
} from "@/src/lib/resonance/resonance-pricing";

type CompareResonanceProps = {
  mode: CompareMode;
};

export function CompareResonance({ mode }: CompareResonanceProps) {
  return (
    <section className="border-b border-white/5">
      <div className="mx-auto max-w-6xl px-5 py-24">
        <div className="grid gap-14 md:grid-cols-[0.95fr_1.05fr]">
          <div>
            <p className="mb-5 text-xs uppercase tracking-[0.28em] text-[#b79a63]">
              Recommended Starting Point
            </p>

            <h2 className="text-4xl font-light leading-tight text-zinc-100">
              Resonance
            </h2>

            <p className="mt-6 text-lg leading-8 text-zinc-400">
              Relational awareness and self-observation.
            </p>

            <div className="mt-10 inline-flex rounded-full border border-[#b79a63]/25 bg-[#b79a63]/[0.05] px-5 py-2 text-xs uppercase tracking-[0.18em] text-[#b79a63]">
              Foundation of the Ecosystem
            </div>
          </div>

          <div className="rounded-3xl border border-[#b79a63]/20 bg-[#b79a63]/[0.03] p-10">
            {mode === "experience" ? (
              <div className="space-y-8">
                <div className="rounded-3xl border border-white/10 bg-zinc-950/80 p-8">
                  <p className="font-serif text-2xl leading-relaxed text-zinc-100 md:text-3xl">
                    Like finally slowing down enough to notice what keeps
                    repeating.
                  </p>

                  <p className="mt-8 font-serif text-xl leading-relaxed text-zinc-400">
                    Like seeing your own patterns without being shamed for them.
                  </p>

                  <p className="mt-8 font-serif text-xl leading-relaxed text-zinc-400">
                    Like someone held up a mirror gently — and didn’t look away.
                  </p>

                  <p className="mt-8 font-serif text-xl leading-relaxed text-zinc-400">
                    Like becoming more honest with yourself over time.
                  </p>

                  <p className="mt-8 font-serif text-xl leading-relaxed text-zinc-400">
                    Like finally recognising the difference between attraction,
                    attachment, clarity, and repetition.
                  </p>

                  <ProductLaunchPrice
                    className="mt-10"
                    regularPrice={RESONANCE_REGULAR_PRICE}
                    launchPrice={RESONANCE_LAUNCH_PRICE}
                    unit="per seven-day room"
                  />

                  <div className="mt-4 flex flex-wrap gap-4">
                    <Link
                      href="https://resonance.oremea.com"
                      className="rounded-full border border-[#b79a63]/25 bg-[#b79a63]/[0.05] px-5 py-2 text-sm text-[#b79a63] transition hover:border-[#b79a63]/55 hover:bg-[#b79a63]/10"
                    >
                      Enter Resonance
                    </Link>
                  </div>
                </div>
              </div>
            ) : (
              <div className="space-y-8">
                <div>
                  <p className="mb-4 text-sm uppercase tracking-[0.18em] text-[#b79a63]">
                    Focus
                  </p>

                  <p className="text-base leading-8 text-zinc-300">
                    Resonance is a structured reflective journey designed to
                    help users better understand repeated relational patterns,
                    communication tendencies, emotional loops, attraction
                    dynamics, and reflective honesty over time.
                  </p>
                </div>

                <div>
                  <p className="mb-4 text-sm uppercase tracking-[0.18em] text-[#b79a63]">
                    Includes
                  </p>

                  <ul className="grid gap-3 text-base leading-7 text-zinc-400 md:grid-cols-2">
                    <li>• one seven-day thematic room</li>
                    <li>• guided daily reflections</li>
                    <li>• Daily Mirrors</li>
                    <li>• two precise mirror questions each day</li>
                    <li>• a Day 7 Closing Mirror</li>
                    <li>• the completed visit in your archive</li>
                  </ul>
                </div>

                <div>
                  <p className="mb-4 text-sm uppercase tracking-[0.18em] text-[#b79a63]">
                    Mirrors
                  </p>

                  <p className="text-base leading-8 text-zinc-400">
                    Daily Mirrors reflect what is becoming visible across each
                    day&apos;s responses. The Closing Mirror reads across the
                    full seven-day visit and reflects what persisted, changed,
                    or became newly visible.
                  </p>
                </div>

                <div className="rounded-2xl border border-white/10 bg-black/20 p-6">
                  <p className="text-sm leading-7 text-zinc-400">
                    Resonance is strongly recommended before progressing into
                    Compass, Harmonize, or The Current.
                  </p>
                </div>

                <ProductLaunchPrice
                  regularPrice={RESONANCE_REGULAR_PRICE}
                  launchPrice={RESONANCE_LAUNCH_PRICE}
                  unit="per seven-day room"
                />

                <div className="flex flex-wrap gap-4 pt-2">
                  <Link
                    href="https://resonance.oremea.com"
                    className="rounded-full border border-[#b79a63]/25 bg-[#b79a63]/[0.05] px-5 py-2 text-sm text-[#b79a63] transition hover:border-[#b79a63]/55 hover:bg-[#b79a63]/10"
                  >
                    Enter Resonance
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
