"use client";

import { useState } from "react";
import Link from "next/link";

import { ProductLaunchPrice } from "@/components/site/product-launch-price";
import { SiteShell } from "@/components/site/site-shell";
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
    name: "Recognition",
    href: "https://recognition.oremea.com",
    active: true,
    short:
      "An ongoing private conversation that keeps you accountable to your own words without deciding where you should go.",
    action: "Enter Recognition",
    full: [
      "Recognition begins wherever your attention is now.",
      "There is no fixed question sequence. Each reply follows what you actually said, while earlier participant-written evidence can return when it materially clarifies recurrence, correction, contrast, responsibility, or a distinction you are trying to hold.",
      "Recognition can question an absolute, place two of your own statements beside one another, separate observation from interpretation, and keep your participation visible without absorbing someone else's responsibility for you.",
      "Recognition does not turn clarity into an action plan. The conversation can end with one thing simply becoming visible.",
    ],
  },
  {
    name: "Resonance",
    href: "/resonance",
    active: true,
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
    name: "The Compass",
    href: "/compass/access",
    active: true,
    short:
      "Turn clarity into direction, keep what matters visible on your Map, and choose the next movement you can actually make.",
    action: "Enter Compass",
    full: [
      "The Compass is for the moment after awareness, when you know something matters but still do not know what to do next.",
      "It helps you move from scattered goals into one clear priority, then takes you deeper into why it matters.",
      "Your Map keeps what the conversation surfaces visible, while Today lets you add and tick off the goals you choose for yourself.",
      "Compass does not rush you into fantasy intensity. It helps you find embodied momentum: the smallest honest next step you can actually take.",
      "Through layered reflection and discussion, Compass helps reveal what interrupts movement, where resistance lives, and what kind of action your nervous system can realistically hold.",
      "Confidence in the self to follow through is built through kept agreements. Compass helps you begin there.",
    ],
  },
];

function ProductName({ name }: { name: string }) {
  if (name === "Resonance") {
    return (
      <span className="font-serif">
        Reso<span className="italic text-[#c8a96a]">nance</span>
      </span>
    );
  }

  if (name === "The Compass") {
    return (
      <span className="inline-flex items-baseline font-serif text-[#c8a96a]">
        <span className="text-[1.08em] leading-none">T</span>
        <span className="text-[0.82em] tracking-[0.00em] leading-none">HE</span>
        <span className="ml-[0.18em] text-[1.08em] leading-none">C</span>
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
            const isOpen = open === product.name;

            return (
              <div
                key={product.name}
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

                    {product.name === "Recognition" ? (
                      <ProductLaunchPrice
                        className="mt-4"
                        regularPrice={RECOGNITION_REGULAR_PRICE}
                        launchPrice={RECOGNITION_LAUNCH_PRICE}
                        unit="/ month"
                      />
                    ) : null}

                    {product.name === "Resonance" ? (
                      <ProductLaunchPrice
                        className="mt-4"
                        regularPrice={RESONANCE_REGULAR_PRICE}
                        launchPrice={RESONANCE_LAUNCH_PRICE}
                        unit="per seven-day room"
                      />
                    ) : null}

                    {product.name === "The Compass" ? (
                      <ProductLaunchPrice
                        className="mt-4"
                        regularPrice={COMPASS_STANDARD_PRICE}
                        launchPrice={COMPASS_LAUNCH_PRICE}
                        unit="30-day pass or monthly"
                      />
                    ) : null}
                  </div>

                  <button
                    type="button"
                    onClick={() => setOpen(isOpen ? null : product.name)}
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
