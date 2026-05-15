import Link from "next/link";
export function ExploreEcosystem() {
  return (
    <section className="border-b border-white/5 bg-zinc-950/60">
      <div className="mx-auto max-w-6xl px-5 py-24">
        <div className="max-w-3xl">
          <p className="mb-5 text-xs uppercase tracking-[0.28em] text-amber-200/70">
            Product Ecosystem
          </p>

          <h2 className="text-3xl font-light leading-tight text-zinc-100 md:text-5xl">
            Structured systems for awareness, execution,
            relationships, and intentional connection.
          </h2>
        </div>

        <div className="mt-20 grid gap-8">
          <div className="rounded-3xl border border-amber-200/10 bg-amber-100/[0.03] p-10">
            <div className="flex flex-col gap-6 md:flex-row md:items-start md:justify-between">
              <div className="max-w-2xl">
                <p className="text-sm uppercase tracking-[0.18em] text-amber-100/70">
                  Resonance
                </p>

                <h3 className="mt-3 text-2xl font-light text-zinc-100">
                  Relational awareness and self-observation.
                </h3>

                <p className="mt-6 text-base leading-8 text-zinc-400">
                  A self-paced guided reflection experience structured
                  across approximately 10 weeks, designed to help users
                  better understand relational patterns,
                  communication tendencies, emotional loops,
                  and reflective honesty.
                </p>
              </div>

              <Link
  href="/oremea/enter"
  className="rounded-2xl border border-white/10 bg-black/20 px-5 py-3 text-sm tracking-[0.16em] text-amber-100 transition hover:border-amber-100/40 hover:bg-black/35"
>
  Recommended First
</Link>
            </div>
          </div>

          <div className="flex justify-center">
            <div className="h-16 w-px bg-gradient-to-b from-amber-200/20 to-transparent" />
          </div>

          <div className="grid gap-8 md:grid-cols-2">
            <div className="rounded-3xl border border-white/10 bg-white/[0.02] p-10">
              <p className="text-sm uppercase tracking-[0.18em] text-zinc-500">
                Compass
              </p>

              <h3 className="mt-3 text-2xl font-light text-zinc-100">
                Direction, execution, and alignment.
              </h3>

              <p className="mt-6 text-base leading-8 text-zinc-400">
                Structured goal and execution systems designed
                for individuals, couples, families, and aligned
                group dynamics seeking clearer direction,
                accountability, and executable next steps.
              </p>
            </div>

            <div className="rounded-3xl border border-white/10 bg-white/[0.02] p-10">
              <p className="text-sm uppercase tracking-[0.18em] text-zinc-500">
                Harmonize
              </p>

              <h3 className="mt-3 text-2xl font-light text-zinc-100">
                Multi-person relational interaction systems.
              </h3>

              <p className="mt-6 text-base leading-8 text-zinc-400">
                Shared reflection and communication-awareness
                systems designed for couples, families,
                and poly dynamics seeking greater alignment,
                repair, and intentional interaction.
              </p>
            </div>
          </div>

          <div className="flex justify-center">
            <div className="h-16 w-px bg-gradient-to-b from-amber-200/20 to-transparent" />
          </div>

          <div className="rounded-3xl border border-white/10 bg-white/[0.02] p-10">
            <p className="text-sm uppercase tracking-[0.18em] text-zinc-500">
              The Current
            </p>

            <h3 className="mt-3 text-2xl font-light text-zinc-100">
              Intentional dating for self-aware individuals.
            </h3>

            <p className="mt-6 max-w-3xl text-base leading-8 text-zinc-400">
              An intentional dating platform designed for
              self-aware individuals seeking meaningful
              connection beyond swipe-based interaction.
              The Current is positioned as a continuation
              layer after foundational awareness work
              through Resonance.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}