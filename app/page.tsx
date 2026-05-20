"use client";

import { useState } from "react";
import Link from "next/link";

import { SiteShell } from "@/components/site/site-shell";

const products = [
  {
    name: "Resonance",
    href: "/oremea",
    active: true,
    short:
      "A self-paced reflective journey designed to help people understand the patterns they carry into connection.",
    action: "Enter Resonance",
    full: [
      "Most people do not repeat relationship patterns because they are careless. They repeat them because the pattern became familiar before it became visible.",
      "Resonance gives you a structured place to notice what happens inside connection: how you trust, protect, hope, withdraw, over-explain, test, soften, shut down, or reach.",
      "Each reflection asks you to respond honestly to carefully sequenced prompts. Not to perform growth. Not to sound wise. Just to name what is actually there.",
      "Over time, your reflections begin to show a shape. Repeated fears. Repeated longings. Repeated contradictions. Subtle shifts that are hard to see from inside one moment.",
      "If you choose Mirror, the system reflects across your responses and helps reveal the deeper thread forming over time.",
      "Resonance is strongly recommended as the foundational entry point into Oremea before Compass, Harmonize, or The Current.",
    ],
  },
  {
    name: "Harmonize",
    active: false,
    short:
      "COMING SOON... A relational clarity layer for couples, families, and poly dynamics who want to understand the pattern between them.",
    action: "Coming soon",
    full: [
      "Harmonize is being designed for people who are tired of circling the same conflict without understanding the system underneath it.",
      "It does not decide who is right. It does not assign blame. It helps people see the pattern that forms between them.",
      "One person may pursue while the other withdraws. One may explain while the other defends. One may ask for closeness while the other hears pressure.",
      "Harmonize slows that loop down so people can recognize what they are protecting, what they are needing, and how their responses affect the space between them.",
      "The focus is not correction. The focus is relational visibility, communication awareness, and alignment.",
      "Harmonize is for couples, families, and poly dynamics who want to stop fighting the surface and begin understanding the movement underneath.",
    ],
  },
  {
    name: "The Compass",
    active: false,
    short:
      "COMING SOON... A goalsetting and execution layer for turning awareness into one executable next step.",
    action: "Coming soon",
    full: [
      "The Compass is being designed for the moment after awareness, when you know something is true but still do not know what to do next.",
      "Most people do not stay stuck because they lack insight. They stay stuck because insight creates too many possible directions.",
      "The Compass narrows the field.",
      "It helps translate a situation, goal, or repeating loop into a clear state, condition, action, repair point, and next step.",
      "It can support individuals, couples, families, and aligned groups who want to goalset as a unit.",
      "The Compass is for people who want clarity to become behavior, not just another thought they carry around.",
    ],
  },
  {
    name: "The Current",
    active: false,
    short:
      "COMING SOON... An intentional dating platform for self-aware individuals who want to meet differently.",
    action: "Coming soon",
    full: [
      "The Current is the future dating space within Oremea.",
      "It is not being designed as a typical dating pool built on swiping, performance, or surface attraction alone.",
      "The intention is different: a dating platform for self-aware individuals who have spent time seeing their own patterns before trying to meet someone else.",
      "That matters, because the quality of connection changes when people arrive with more honesty, steadiness, and self-recognition.",
      "The Current is not about rushing toward a match. It is about creating a more conscious meeting field.",
      "It is for people who want connection to begin from depth, not from projection.",
    ],
  },
];

function ProductName({ name }: { name: string }) {
  if (name === "Resonance") {
    return (
      <>
        Reso<span className="italic text-[#c8a96a]">nance</span>
      </>
    );
  }

  return <>{name}</>;
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
                        Enter Reso<span className="italic">nance</span> →
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