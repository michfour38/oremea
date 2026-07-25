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
            Structured systems for recognition, awareness, and aligned execution.
          </h2>
        </div>

        <div className="mt-20 grid gap-8">
          <div className="rounded-3xl border border-white/10 bg-white/[0.02] p-10">
            <div className="flex flex-col gap-6 md:flex-row md:items-start md:justify-between">
              <div className="max-w-2xl">
                <p className="text-sm uppercase tracking-[0.18em] text-zinc-400">
                  Recognition
                </p>

                <h3 className="mt-3 text-2xl font-light text-zinc-100">
                  See what is already present.
                </h3>

                <p className="mt-6 text-base leading-8 text-zinc-300">
                  A focused private reflection that listens for the thread already
                  present in your own words and gives it enough shape to become
                  visible.
                </p>
              </div>

              <Link
                href="/recognition"
                className="rounded-2xl border border-white/10 bg-black/20 px-5 py-3 text-sm tracking-[0.16em] text-amber-100 transition hover:border-amber-100/40 hover:bg-black/35"
              >
                Begin Recognition
              </Link>
            </div>
          </div>

          <div className="flex justify-center">
            <div className="h-16 w-px bg-gradient-to-b from-amber-200/20 to-transparent" />
          </div>

          <div className="rounded-3xl border border-amber-200/10 bg-amber-100/[0.03] p-10">
            <div className="flex flex-col gap-6 md:flex-row md:items-start md:justify-between">
              <div className="max-w-2xl">
                <p className="text-sm uppercase tracking-[0.18em] text-amber-100/70">
                  Resonance
                </p>

                <h3 className="mt-3 text-2xl font-light text-zinc-100">
                  Relational awareness and self-observation.
                </h3>

                <p className="mt-6 text-base leading-8 text-zinc-300">
                  A self-paced guided reflection experience structured across
                  approximately 10 weeks, designed to help users better understand
                  relational patterns, communication tendencies, emotional loops,
                  and reflective honesty.
                </p>
              </div>

              <Link
                href="/resonance"
                className="rounded-2xl border border-white/10 bg-black/20 px-5 py-3 text-sm tracking-[0.16em] text-amber-100 transition hover:border-amber-100/40 hover:bg-black/35"
              >
                Enter Resonance
              </Link>
            </div>
          </div>

          <div className="flex justify-center">
            <div className="h-16 w-px bg-gradient-to-b from-amber-200/20 to-transparent" />
          </div>

          <div className="rounded-3xl border border-white/10 bg-white/[0.02] p-10">
            <div className="flex flex-col gap-6 md:flex-row md:items-start md:justify-between">
              <div className="max-w-2xl">
                <p className="text-sm uppercase tracking-[0.18em] text-zinc-400">
                  Compass
                </p>

                <h3 className="mt-3 text-2xl font-light text-zinc-100">
                  Direction, execution, and alignment.
                </h3>

                <p className="mt-6 max-w-3xl text-base leading-8 text-zinc-300">
                  Structured goal and execution systems designed for individuals,
                  couples, families, and aligned group dynamics seeking clearer
                  direction, accountability, and executable next steps.
                </p>
              </div>

              <Link
                href="/compass"
                className="rounded-2xl border border-white/10 bg-black/20 px-5 py-3 text-sm tracking-[0.16em] text-amber-100 transition hover:border-amber-100/40 hover:bg-black/35"
              >
                Enter Compass
              </Link>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
