import Link from "next/link";
import type { CompareMode } from "@/app/compare/page";
import { ProductLaunchPrice } from "@/components/site/product-launch-price";
import {
  RECOGNITION_PRICING,
  formatRecognitionPrice,
} from "@/src/lib/recognition/recognition-pricing";

const RECOGNITION_LAUNCH_PRICE = formatRecognitionPrice(
  RECOGNITION_PRICING.launchPriceCents,
);
const RECOGNITION_REGULAR_PRICE = formatRecognitionPrice(
  RECOGNITION_PRICING.regularPriceCents,
);

type CompareRecognitionProps = {
  mode: CompareMode;
};

export function CompareRecognition({ mode }: CompareRecognitionProps) {
  return (
    <section className="border-b border-white/5 bg-zinc-950/60">
      <div className="mx-auto max-w-6xl px-5 py-24">
        <div className="grid gap-14 md:grid-cols-[0.95fr_1.05fr]">
          <div>
            <p className="mb-5 text-xs uppercase tracking-[0.28em] text-[#b79a63]">
              Ongoing Recognition
            </p>

            <h2 className="text-4xl font-light leading-tight text-zinc-100">
              Recognition
            </h2>

            <p className="mt-6 text-lg leading-8 text-zinc-400">
              See yourself clearly while you are speaking.
            </p>
          </div>

          <div className="rounded-3xl border border-white/10 bg-white/[0.02] p-10">
            {mode === "experience" ? (
              <div className="space-y-8">
                <div className="rounded-3xl border border-white/10 bg-zinc-950/80 p-8">
                  <p className="font-serif text-2xl leading-relaxed text-zinc-100 md:text-3xl">
                    Like talking to someone who remembers what you actually said,
                    without deciding what it means for you.
                  </p>

                  <p className="mt-8 font-serif text-xl leading-relaxed text-zinc-400">
                    Like hearing two of your own statements placed beside one another
                    when they do not yet sit cleanly together.
                  </p>

                  <p className="mt-8 font-serif text-xl leading-relaxed text-zinc-400">
                    Like having “always”, “never”, “no choice”, and “everything”
                    examined closely enough to become specific.
                  </p>

                  <p className="mt-8 font-serif text-xl leading-relaxed text-zinc-400">
                    Like being held accountable to your own words while interpretation,
                    authority, responsibility, and next movement remain yours.
                  </p>

                  <ProductLaunchPrice
                    className="mt-10"
                    regularPrice={RECOGNITION_REGULAR_PRICE}
                    launchPrice={RECOGNITION_LAUNCH_PRICE}
                    unit="/ month"
                  />

                  <div className="mt-4 flex flex-wrap gap-4">
                    <Link
                      href="https://recognition.oremea.com"
                      className="rounded-full border border-[#b79a63]/25 bg-[#b79a63]/[0.05] px-5 py-2 text-sm text-[#b79a63] transition hover:border-[#b79a63]/55 hover:bg-[#b79a63]/10"
                    >
                      Enter Recognition
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
                    Recognition is one continuing private conversation. It follows
                    the participant’s newest words while preserving earlier
                    participant-written evidence for recurrence, correction,
                    contrast, responsibility, and accountability over time.
                  </p>
                </div>

                <div>
                  <p className="mb-4 text-sm uppercase tracking-[0.18em] text-[#b79a63]">
                    Includes
                  </p>

                  <ul className="grid gap-3 text-base leading-7 text-zinc-400 md:grid-cols-2">
                    <li>• fully recursive conversation</li>
                    <li>• longitudinal participant-word memory</li>
                    <li>• contradiction and distinction checks</li>
                    <li>• observation vs interpretation separation</li>
                    <li>• responsibility and participation clarity</li>
                    <li>• corrections with current authority</li>
                    <li>• participant-controlled memory</li>
                    <li>• preserved private conversation archive</li>
                  </ul>
                </div>

                <div className="rounded-2xl border border-white/10 bg-black/20 p-6">
                  <p className="text-sm leading-7 text-zinc-400">
                    Recognition helps something become visible. Resonance is a
                    separate seven-day container for staying with a chosen relational
                    question. Compass is a separate product for direction and action.
                  </p>
                </div>

                <ProductLaunchPrice
                  regularPrice={RECOGNITION_REGULAR_PRICE}
                  launchPrice={RECOGNITION_LAUNCH_PRICE}
                  unit="/ month"
                />

                <div className="flex flex-wrap gap-4 pt-2">
                  <Link
                    href="https://recognition.oremea.com"
                    className="rounded-full border border-[#b79a63]/25 bg-[#b79a63]/[0.05] px-5 py-2 text-sm text-[#b79a63] transition hover:border-[#b79a63]/55 hover:bg-[#b79a63]/10"
                  >
                    Enter Recognition
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
