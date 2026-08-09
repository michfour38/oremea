import Link from "next/link";

const products = [
  {
    name: "Recognition",
    category: "See what is present",
    description:
      "A focused private reflection that gives the thread already present in your own words enough shape to become visible.",
    bestFor: "A clear first view of what has your attention now.",
    href: "https://recognition.oremea.com",
    action: "Enter Recognition",
  },
  {
    name: "Resonance",
    category: "Stay with what emerges",
    description:
      "A private seven-day room with daily reflections, Daily Mirrors, and a Closing Mirror that reads across the full visit.",
    bestFor: "Relational awareness and patterns that need time to deepen.",
    href: "/resonance",
    action: "Enter Resonance",
  },
  {
    name: "Compass",
    category: "Turn clarity into movement",
    description:
      "A structured process that narrows competing priorities into one honest, executable next step you can realistically sustain.",
    bestFor: "Direction, decisions, and movement after awareness.",
    href: "https://compass.oremea.com",
    action: "Enter Compass",
  },
] as const;

export function ExploreEcosystem() {
  return (
    <section id="products" className="scroll-mt-24 border-b border-white/5">
      <div className="mx-auto max-w-6xl px-5 py-16 md:py-20">
        <div className="flex flex-col gap-5 md:flex-row md:items-end md:justify-between">
          <div className="max-w-3xl">
            <p className="text-xs uppercase tracking-[0.28em] text-[#b79a63]">
              Available now
            </p>
            <h2 className="mt-4 text-3xl font-light leading-tight text-zinc-100 md:text-5xl">
              Choose the kind of movement you need.
            </h2>
          </div>
          <p className="max-w-md text-sm leading-7 text-zinc-500 md:text-right">
            Each product stands on its own. Recognition, Resonance, and Compass
            can also form a progression from seeing to sustained action.
          </p>
        </div>

        <div className="mt-10 grid gap-4 md:grid-cols-2">
          {products.map((product, index) => (
            <article
              key={product.name}
              className="group flex min-h-full flex-col rounded-3xl border border-white/10 bg-zinc-950/80 p-6 transition hover:border-[#b79a63]/35 md:p-8"
            >
              <div className="flex items-center justify-between gap-4">
                <p className="text-[11px] uppercase tracking-[0.22em] text-[#b79a63]">
                  {product.category}
                </p>
                <span className="rounded-full border border-[#b79a63]/20 bg-[#b79a63]/[0.04] px-3 py-1 text-[10px] uppercase tracking-[0.16em] text-[#b79a63]">
                  Available
                </span>
              </div>

              <div className="mt-8 flex items-baseline gap-3">
                <span className="text-sm tabular-nums text-zinc-600">
                  0{index + 1}
                </span>
                <h3 className="text-3xl font-light text-zinc-100">
                  {product.name}
                </h3>
              </div>

              <p className="mt-5 text-base leading-8 text-zinc-400">
                {product.description}
              </p>

              <p className="mt-6 border-l border-[#b79a63]/30 pl-4 text-sm leading-7 text-zinc-500">
                {product.bestFor}
              </p>

              <div className="mt-auto pt-8">
                <Link
                  href={product.href}
                  className="inline-flex rounded-full border border-[#b79a63]/30 bg-[#b79a63]/[0.04] px-4 py-2.5 text-sm text-[#b79a63] transition group-hover:border-[#b79a63]/55 group-hover:bg-[#b79a63]/[0.08]"
                >
                  {product.action} →
                </Link>
              </div>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
