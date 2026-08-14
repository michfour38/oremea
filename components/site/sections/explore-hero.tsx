import Link from "next/link";

export function ExploreHero() {
  return (
    <section className="relative overflow-hidden border-b border-white/10">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(183,154,99,0.08),transparent_48%)]" />

      <div className="relative mx-auto max-w-5xl px-5 py-20 text-center md:py-24">
        <p className="mb-5 text-xs uppercase tracking-[0.32em] text-[#b79a63]">
          Explore Oremea
        </p>

        <h1 className="mx-auto max-w-4xl text-4xl font-light leading-tight text-zinc-100 md:text-6xl">
          Three available ways to see clearly and move deliberately.
        </h1>

        <p className="mx-auto mt-7 max-w-2xl text-base leading-8 text-zinc-400 md:text-lg">
          Recognition, Resonance, and Compass are available now. Start with the
          product that matches what you need today.
        </p>

        <div className="mt-8 flex flex-wrap justify-center gap-3">
          <Link
            href="#products"
            className="rounded-full border border-[#b79a63]/30 bg-[#b79a63]/[0.05] px-5 py-2.5 text-sm text-[#b79a63] transition hover:border-[#b79a63]/60 hover:bg-[#b79a63]/10"
          >
            View all products
          </Link>
          <Link
            href="/compare"
            className="rounded-full border border-white/10 bg-zinc-950/70 px-5 py-2.5 text-sm text-zinc-300 transition hover:border-white/25 hover:text-zinc-100"
          >
            Compare reflective products
          </Link>
        </div>
      </div>
    </section>
  );
}
