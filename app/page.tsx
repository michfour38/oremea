"use client";

import { useState } from "react";
import Link from "next/link";

import { ProductLaunchPrice } from "@/components/site/product-launch-price";
import { SiteShell } from "@/components/site/site-shell";
import { OREMEA_PRODUCT_REGISTRY } from "@/src/lib/oremea/product-registry";
import {
  RESONANCE_LAUNCH_PRICE,
  RESONANCE_REGULAR_PRICE,
} from "@/src/lib/resonance/resonance-pricing";
import {
  COMPASS_PRICING,
  formatCompassPrice,
} from "@/src/lib/compass/compass-pricing";
import {
  RECOGNITION_PRICING,
  formatRecognitionPrice,
} from "@/src/lib/recognition/recognition-pricing";

const RECOGNITION_PRODUCT = OREMEA_PRODUCT_REGISTRY.recognition;
const RESONANCE_PRODUCT = OREMEA_PRODUCT_REGISTRY.resonance;
const COMPASS_PRODUCT = OREMEA_PRODUCT_REGISTRY.compass;

const COMPASS_LAUNCH_PRICE = formatCompassPrice(
  COMPASS_PRICING.launchPriceCents,
);
const COMPASS_STANDARD_PRICE = formatCompassPrice(
  COMPASS_PRICING.standardPriceCents,
);
const RECOGNITION_LAUNCH_PRICE = formatRecognitionPrice(
  RECOGNITION_PRICING.launchPriceCents,
);
const RECOGNITION_REGULAR_PRICE = formatRecognitionPrice(
  RECOGNITION_PRICING.regularPriceCents,
);

const products = [
  {
    key: RECOGNITION_PRODUCT.key,
    name: RECOGNITION_PRODUCT.name,
    href: RECOGNITION_PRODUCT.entryUrl,
    active: RECOGNITION_PRODUCT.availability === "live",
    short:
      "A private reflective entry point that helps you see what is already present in your own words.",
    action: "Enter Recognition",
    full: [
      "Recognition begins with what already has your attention.",
      "You respond to a carefully sequenced set of prompts in your own words, creating enough material for the system to reflect the pattern taking shape.",
      "The result gives you a clearer view of what is present now: the thread, tension, desire, contradiction, or movement asking to be seen.",
      "Recognition is designed as a focused entry point. It gives awareness somewhere concrete to begin.",
    ],
  },
  {
    key: RESONANCE_PRODUCT.key,
    name: RESONANCE_PRODUCT.name,
    href: RESONANCE_PRODUCT.entryUrl,
    active: RESONANCE_PRODUCT.availability === "live",
    short:
      "A private seven-day reflection experience that helps you stay with what becomes visible.",
    action: "Enter Resonance",
    full: [
      "Resonance gives you a structured place to notice what happens inside connection across seven days, one thematic room at a time.",
      "Each day you respond to carefully sequenced prompts in your own words. The Daily Mirror then reads those reflections together and reflects the pattern, tension, contrast, or movement becoming visible.",
      "That Daily Mirror ends with two precise questions arising from the reflection, giving you somewhere specific to stay before you choose to continue.",
      "On Day 7, a Closing Mirror reads across the full visit and reflects what persisted, changed, sharpened, or became newly visible over time.",
      "Your completed visit remains available in your archive, and returning to the same room later creates a fresh visit while preserving the earlier one.",
      "Resonance creates the reflective foundation from which Compass can help turn awareness into movement.",
    ],
  },
  {
    key: COMPASS_PRODUCT.key,
    name: COMPASS_PRODUCT.name,
    href: COMPASS_PRODUCT.entryUrl,
    active: COMPASS_PRODUCT.availability === "live",
    short:
      "Turn self-awareness into one executable next step. Clarity. Direction. Execution.",
    action: "Enter Compass",
    full: [
      "Compass is for the moment after awareness, when you know something matters but still do not know what to do next.",
      "It helps you move from scattered goals into one clear priority, then takes you deeper into why it matters.",
      "Compass does not rush you into fantasy intensity. It helps you find embodied momentum: the smallest honest next step you can actually take.",
      "Through layered reflection and discussion, Compass helps reveal what interrupts movement, where resistance lives, and what kind of action your nervous system can realistically hold.",
      "Confidence in the self to follow through is built through kept agreements. Compass helps you begin there.",
    ],
  },
];

function ProductName({ name }: { name: string }) {
  if (name === RESONANCE_PRODUCT.name) {
    return (
      <span className="font-serif">
        Reso<span className="italic text-[#c8a96a]">nance</span>
      </span>
    );
  }

  if (name === COMPASS_PRODUCT.name) {
    return (
      <span className="inline-flex items-baseline font-serif text-[#c8a96a]">
        <span className="text-[1.08em] leading-none">C</span>
        <span className="text-[0.82em] tracking-[0.00em] leading-none">OMPASS</span>
      </span>
    );
  }

  return <span className="font-serif">{name}</span>;
}

export default function Home() {
  const [open, setOpen] = useState<string | null>(null);

  return (
    <SiteShell>
      <section className="mx-auto flex min-h-screen max-w-4xl flex-col justify-center px-6 py-16">
        <div className="mb-12 flex justify-center">
          <img
            src="/images/oremea-logo-wht.png"
            alt="Oremea"
            className="h-16 w-auto opacity-95 md:h-24"
          />
        </div>

        <div className="max-w-3xl">
          <h1 className="mt-6 text-2xl font-semibold tracking-tight md:text-3xl">
            Pattern awareness for people who want to meet life more clearly.
          </h1>

          <p className="mt-5 max-w-2xl text-base leading-8 text-zinc-300">
            Oremea is a house of structured reflective products for
            self-recognition, relational clarity, aligned execution,
            and intentional connection.
          </p>
        </div>

        <div className="mt-12 flex flex-col gap-4">
          {products.map((product) => {
            const isOpen = open === product.key;

            return (
              <div
                key={product.key}
                className={`rounded-[2rem] border p-6 transition ${
                  product.active
                    ? "border-[#c8a96a]/35 bg-[#15120c]"
                    : "border-white/10 bg-white/[0.03]"
                }`}
              >
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <h2 className="text-2xl text-white">
                      <ProductName name={product.name} />
                    </h2>

                    <p className="mt-4 max-w-2xl text-sm leading-7 text-zinc-400">
                      {product.short}
                    </p>

                    {product.key === "recognition" ? (
                      <ProductLaunchPrice
                        className="mt-4"
                        regularPrice={RECOGNITION_REGULAR_PRICE}
                        launchPrice={RECOGNITION_LAUNCH_PRICE}
                        unit={RECOGNITION_PRODUCT.access.unit}
                      />
                    ) : null}

                    {product.key === "resonance" ? (
                      <ProductLaunchPrice
                        className="mt-4"
                        regularPrice={RESONANCE_REGULAR_PRICE}
                        launchPrice={RESONANCE_LAUNCH_PRICE}
                        unit={RESONANCE_PRODUCT.access.unit}
                      />
                    ) : null}

                    {product.key === "compass" ? (
                      <ProductLaunchPrice
                        className="mt-4"
                        regularPrice={COMPASS_STANDARD_PRICE}
                        launchPrice={COMPASS_LAUNCH_PRICE}
                        unit={COMPASS_PRODUCT.access.unit}
                      />
                    ) : null}
                  </div>

                  <button
                    type="button"
                    onClick={() => setOpen(isOpen ? null : product.key)}
                    className="shrink-0 text-sm text-[#c8a96a] transition hover:text-[#f1dfb4]"
                  >
                    {isOpen ? "Collapse" : "Expand"}
                  </button>
                </div>

                {isOpen ? (
                  <div className="mt-7 space-y-4 border-t border-white/10 pt-6 text-sm leading-7 text-zinc-300">
                    {product.full.map((paragraph, index) => (
                      <p key={index}>{paragraph}</p>
                    ))}

                    {product.active && product.href ? (
                      <Link
                        href={product.href}
                        className="inline-block pt-2 text-sm text-[#c8a96a] transition hover:text-[#f1dfb4]"
                      >
                        {product.action} →
                      </Link>
                    ) : null}
                  </div>
                ) : null}
              </div>
            );
          })}
        </div>
      </section>
    </SiteShell>
  );
}
