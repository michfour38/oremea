"use client";

import { useState } from "react";
import Link from "next/link";

const products = [
  {
    name: "Resonance",
    href: "/oremea/enter?source=oremea_home",
    active: true,
    short:
      "A 10-week guided journey for people who want to understand the patterns they carry into connection.",
    action: "Enter",
    full: [
      "Most people do not repeat relationship patterns because they are careless. They repeat them because the pattern became familiar before it became visible.",
      "Resonance gives you a structured place to notice what happens inside connection: how you trust, protect, hope, withdraw, over-explain, test, soften, shut down, or reach.",
      "Each day asks you to respond honestly to carefully sequenced prompts. Not to perform growth. Not to sound wise. Just to name what is actually there.",
      "Over time, your reflections begin to show a shape. Repeated fears. Repeated longings. Repeated contradictions. Subtle shifts that are hard to see from inside one moment.",
      "If you choose Mirror, the system reflects across your responses and helps reveal the deeper thread forming over time.",
      "Resonance is for people who are ready to stop guessing why they keep arriving in the same emotional place — and begin seeing themselves with more clarity, honesty, and choice.",
    ],
  },
  {
    name: "Harmonize",
    active: false,
    short:
      "A future relational clarity layer for two people who want to understand the pattern between them.",
    action: "Coming soon",
    full: [
      "Harmonize is being designed for two people who are tired of circling the same conflict without understanding the system underneath it.",
      "It does not decide who is right. It does not assign blame. It helps both people see the pattern that forms between them.",
      "One person may pursue while the other withdraws. One may explain while the other defends. One may ask for closeness while the other hears pressure.",
      "Harmonize slows that loop down so both people can recognize what they are protecting, what they are needing, and how their responses affect the space between them.",
      "The focus is not correction. The focus is relational visibility.",
      "Harmonize is for people who want to stop fighting the surface and begin understanding the movement underneath.",
    ],
  },
  {
    name: "The Compass",
    active: false,
    short:
      "A future decision layer for turning self-awareness into one executable next step.",
    action: "Coming soon",
    full: [
      "The Compass is being designed for the moment after awareness, when you know something is true but still do not know what to do next.",
      "Most people do not stay stuck because they lack insight. They stay stuck because insight creates too many possible directions.",
      "The Compass narrows the field.",
      "It helps translate a situation, goal, or repeating loop into a clear state, condition, action, repair point, and next step.",
      "Instead of asking you to transform your whole life at once, it asks: what is the next aligned move?",
      "The Compass is for people who want clarity to become behavior, not just another thought they carry around.",
    ],
  },
  {
    name: "The Current",
    active: false,
    short:
      "A future meeting space for people who have moved through the work and want to meet differently.",
    action: "Coming soon",
    full: [
      "The Current is the future relational space beyond the individual journey.",
      "It is not being designed as a typical dating pool built on swiping, performance, or surface attraction alone.",
      "The intention is different: a space for people who have spent time seeing their own patterns before trying to meet someone else.",
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
  const [open, setOpen] = useState<string | null>("Resonance");

  return (
    <main className="min-h-screen bg-[#090806] text-white">
      <section className="mx-auto flex min-h-screen max-w-4xl flex-col justify-center px-6 py-16">
        <div className="max-w-3xl">
          <img
            src="/oremea-logo.png"
            alt="Oremea"
            className="h-9 w-auto opacity-90"
          />

          <h1 className="mt-8 text-5xl font-semibold tracking-tight md:text-7xl">
            Pattern awareness for people who want to meet life more clearly.
          </h1>

          <p className="mt-6 max-w-2xl text-base leading-8 text-zinc-300">
            Oremea is a house of reflective products for self-recognition,
            relational clarity, and intentional movement.
          </p>
        </div>

        <div className="mt-16 flex flex-col gap-4">
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
                    {isOpen ? "Close" : "Open"}
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
                    ) : (
                      <p className="pt-2 text-sm text-zinc-500">
                        {product.action}
                      </p>
                    )}
                  </div>
                ) : null}
              </div>
            );
          })}
        </div>
      </section>
    </main>
  );
}