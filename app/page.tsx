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

const COMPASS_PRICE = formatCompassPrice(COMPASS_PRICING.launchPriceCents);
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
      "A private AI discussion journal for thoughts that need more than a journal page.",
    action: "Enter Recognition",
    full: [
      "Recognition begins wherever your attention is now.",
      "There is no fixed question sequence. Each reply follows what you actually said, while earlier participant-written evidence can return when it materially clarifies recurrence, correction, contrast, responsibility, or a distinction you are trying to hold.",
      "Recognition can question an absolute, place two of your own statements beside one another, separate observation from interpretation, and keep your participation visible without absorbing someone else's responsibility for you.",
      "Recognition does not turn clarity into an action plan. Meaning and choices remain yours, and the conversation can end with one thing simply becoming visible.",
    ],
  },
  {
    name: "Resonance",
    href: "/resonance",
    active: true,
    short:
      "A private seven-day reflection room that helps you stay with yourself inside one relational territory.",
    action: "Enter Resonance",
    full: [
      "Resonance gives you a structured place to notice what happens inside connection across seven days, one teacher at a time.",
      "Each day you respond to the room's current seed questions in your own words. Guiding questions stay inside that teacher and that day's material rather than turning the experience into advice or diagnosis.",
      "A Daily Mirror can reflect what is visible in that day's participant-written material without inventing a deeper theory about you.",
      "On Day 7, a Closing Mirror can read across the full visit and reflect what becomes visible because the seven days can now be heard together.",
      "Your completed visit remains available in your Archive, and returning to the same room later creates a fresh visit while preserving the earlier one.",
    ],
  },
  {
    name: "Compass",
    href: "/compass/access",
    active: true,
    short:
      "Turn what matters into clear direction, a working Map, and the next movement you can actually make.",
    action: "Enter Compass",
    full: [
      "Compass is for navigation when something needs to move.",
      "It helps clarify current reality, make the choice visible, and structure movement without becoming the chooser.",
      "Your Map keeps what the conversation surfaces visible, while participant-authored goals remain yours rather than being silently rewritten by the intelligence.",
      "Understanding and planning are useful only while they improve navigation. When movement is current, Compass can stop and reality becomes the teacher again.",
      "Compass is available as one monthly membership. Cancel anytime; your saved Archive remains available after cancellation.",
    ],
  },
];

function ProductName({ name }: { name: string }) {
  if (name === "Recognition") {
    return <span className="font-serif text-[#c8a96a]">Recognition</span>;
  }

  if (name === "Resonance") {
    return (
      <span className="font-serif">
        Reso<span className="italic text-[#c8a96a]">nance</span>
      </span>
    );
  }

  if (name === "Compass") {
    return (
      <span className="font-serif uppercase tracking-[0.12em] text-[#c8a96a]">
        Compass
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
            const toggleCard = () => setOpen(isOpen ? null : product.name);

            return (
              <div
                key={product.name}
                role="button"
                tabIndex={0}
                aria-expanded={isOpen}
                aria-label={`${isOpen ? "Collapse" : "Expand"} ${product.name}`}
                onClick={toggleCard}
                onKeyDown={(event) => {
                  if (event.target !== event.currentTarget) return;
                  if (event.key === "Enter" || event.key === " ") {
                    event.preventDefault();
                    toggleCard();
                  }
                }}
                className={`cursor-pointer rounded-[2rem] border p-6 transition focus:outline-none focus-visible:ring-2 focus-visible:ring-[#c8a96a]/70 ${
                  product.active
                    ? "border-[#c8a96a]/35 bg-[#15120c] hover:border-[#c8a96a]/55"
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

                    {product.name === "Compass" ? (
                      <ProductLaunchPrice
                        className="mt-4"
                        regularPrice={COMPASS_STANDARD_PRICE}
                        launchPrice={COMPASS_PRICE}
                        unit="/ month"
                      />
                    ) : null}
                  </div>

                  <span className="shrink-0 text-sm text-[#c8a96a] transition group-hover:text-[#f1dfb4]">
                    {isOpen ? "Collapse" : "Expand"}
                  </span>
                </div>

                {isOpen ? (
                  <div className="mt-7 space-y-4 border-t border-white/10 pt-6 text-sm leading-7 text-zinc-300">
                    {product.full.map((paragraph, index) => (
                      <p key={index}>{paragraph}</p>
                    ))}

                    {product.active && product.href ? (
                      <Link
                        href={product.href}
                        onClick={(event) => event.stopPropagation()}
                        onKeyDown={(event) => event.stopPropagation()}
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
