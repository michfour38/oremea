import Link from "next/link";
export function ProfileProducts() {
  return (
    <section className="border-b border-white/5 bg-zinc-950/60">
      <div className="mx-auto max-w-6xl px-5 py-20">
        <div className="mb-10">
          <p className="text-xs uppercase tracking-[0.28em] text-amber-200/70">
            Active Products
          </p>
        </div>

        <div className="grid gap-8 md:grid-cols-2">
          <div className="rounded-3xl border border-amber-200/10 bg-amber-100/[0.03] p-8">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm uppercase tracking-[0.18em] text-amber-100/70">
                  Resonance
                </p>

                <h3 className="mt-3 text-2xl font-light text-zinc-100">
                  Active Journey
                </h3>
              </div>

              <div className="rounded-full border border-amber-200/20 bg-amber-100/[0.06] px-4 py-2 text-xs uppercase tracking-[0.18em] text-amber-100">
                Active
              </div>
            </div>

            <p className="mt-6 text-base leading-8 text-zinc-400">
              Relational awareness and reflective progression
              structured around self-led participation.
            </p>

            <div className="mt-8 flex flex-wrap gap-3">
              <Link
  href="/journey#mirror"
  className="rounded-full border border-white/10 px-4 py-2 text-sm text-zinc-300 transition hover:border-white/20 hover:text-white"
>
  Mirror Available
</Link>

              <Link
  href="/journey"
  className="rounded-full border border-white/10 px-4 py-2 text-sm text-zinc-300 transition hover:border-white/20 hover:text-white"
>
  Journey Access
</Link>
            </div>
          </div>

          <div className="rounded-3xl border border-white/10 bg-white/[0.02] p-8">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm uppercase tracking-[0.18em] text-zinc-500">
                  Future Ecosystem Access
                </p>

                <h3 className="mt-3 text-2xl font-light text-zinc-100">
                  Expansion Products
                </h3>
              </div>

              <div className="rounded-full border border-white/10 px-4 py-2 text-xs uppercase tracking-[0.18em] text-zinc-400">
                Available Later
              </div>
            </div>

            <p className="mt-6 text-base leading-8 text-zinc-400">
              Progress into Compass, Harmonize,
              and The Current after foundational
              awareness work through Resonance.
            </p>

            <div className="mt-8 flex flex-wrap gap-3">
              <Link
  href="/compass"
  className="rounded-full border border-white/10 px-4 py-2 text-sm text-zinc-300 transition hover:border-white/20 hover:text-white"
>
  Compass
</Link>

              <div className="rounded-full border border-white/10 px-4 py-2 text-sm text-zinc-300">
                Harmonize
              </div>

              <div className="rounded-full border border-white/10 px-4 py-2 text-sm text-zinc-300">
                The Current
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}