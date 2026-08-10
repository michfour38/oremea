import Link from "next/link";
import type { CompareMode } from "@/app/compare/page";
import { ProductLaunchPrice } from "@/components/site/product-launch-price";
import { OREMEA_PRODUCT_REGISTRY } from "@/src/lib/oremea/product-registry";
import {
  RECOGNITION_PRICING,
  formatRecognitionPrice,
} from "@/src/lib/recognition/recognition-pricing";

const RECOGNITION_PRODUCT = OREMEA_PRODUCT_REGISTRY.recognition;
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
              Focused Entry Point
            </p>

            <h2 className="text-4xl font-light leading-tight text-zinc-100">
              {RECOGNITION_PRODUCT.name}
            </h2>

            <p className="mt-6 text-lg leading-8 text-zinc-400">
              See what is already present.
            </p>
          </div>

          <div className="rounded-3xl border border-white/10 bg-white/[0.02] p-10">
            {mode === "experience" ? (
              <div className="space-y-8">
                <div className="rounded-3xl border border-white/10 bg-zinc-950/80 p-8">
                  <p className="font-serif text-2xl leading-relaxed text-zinc-100 md:text-3xl">
                    Like putting down everything that has been occupying your
                    attention and finally seeing the thread through it.
                  </p>

                  <p className="mt-8 font-serif text-xl leading-relaxed text-zinc-400">
                    Like noticing that several things can be true at once.
                  </p>

                  <p className="mt-8 font-serif text-xl leading-relaxed text-zinc-400">
                    Like seeing what matters become clearer in your own words.
                  </p>

                  <p className="mt-8 font-serif text-xl leading-relaxed text-zinc-400">
                    Like having your own words reflected back while meaning and
                    next movement remain yours.
                  </p>

                  <ProductLaunchPrice
                    className="mt-10"
                    regularPrice={RECOGNITION_REGULAR_PRICE}
                    launchPrice={RECOGNITION_LAUNCH_PRICE}
                    unit={RECOGNITION_PRODUCT.access.unit}
                  />

                  <div className="mt-4 flex flex-wrap gap-4">
                    <Link
                      href={RECOGNITION_PRODUCT.entryUrl}
                      className="rounded-full border border-[#b79a63]/25 bg-[#b79a63]/[0.05] px-5 py-2 text-sm text-[#b79a63] transition hover:border-[#b79a63]/55 hover:bg-[#b79a63]/10"
                    >
                      Begin Recognition
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
                    Recognition is a focused private reflection that helps make
                    the structure already present in your own account visible
                    while preserving your authority over what that structure
                    means.
                  </p>
                </div>

                <div>
                  <p className="mb-4 text-sm uppercase tracking-[0.18em] text-[#b79a63]">
                    Includes
                  </p>

                  <ul className="grid gap-3 text-base leading-7 text-zinc-400 md:grid-cols-2">
                    <li>• guided reflection sequence</li>
                    <li>• cross-answer recognition</li>
                    <li>• recurring subjects and relationships</li>
                    <li>• participant-stated importance and clarity</li>
                    <li>• tensions that preserve multiple truths</li>
                    <li>• synthesis grounded in your own words</li>
                    <li>• one opportunity to refine the reflection</li>
                  </ul>
                </div>

                <div className="rounded-2xl border border-white/10 bg-black/20 p-6">
                  <p className="text-sm leading-7 text-zinc-400">
                    Recognition creates a clear first view of what is already
                    present. Resonance then gives that seeing somewhere to
                    deepen over time.
                  </p>
                </div>

                <ProductLaunchPrice
                  regularPrice={RECOGNITION_REGULAR_PRICE}
                  launchPrice={RECOGNITION_LAUNCH_PRICE}
                  unit={RECOGNITION_PRODUCT.access.unit}
                />

                <div className="flex flex-wrap gap-4 pt-2">
                  <Link
                    href={RECOGNITION_PRODUCT.entryUrl}
                    className="rounded-full border border-[#b79a63]/25 bg-[#b79a63]/[0.05] px-5 py-2 text-sm text-[#b79a63] transition hover:border-[#b79a63]/55 hover:bg-[#b79a63]/10"
                  >
                    Begin Recognition
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
