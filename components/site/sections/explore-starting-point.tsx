export function ExploreStartingPoint() {
  return (
    <section className="border-b border-white/5">
      <div className="mx-auto max-w-6xl px-5 py-24">
        <div className="grid gap-14 md:grid-cols-[1fr_1.2fr] md:items-center">
          <div>
            <p className="mb-5 text-xs uppercase tracking-[0.28em] text-amber-200/70">
              Recommended Starting Point
            </p>

            <h2 className="text-3xl font-light leading-tight text-zinc-100 md:text-5xl">
              Resonance is the foundation of the Oremea ecosystem.
            </h2>
          </div>

          <div className="rounded-3xl border border-amber-200/10 bg-amber-100/[0.03] p-10">
            <p className="text-sm uppercase tracking-[0.18em] text-amber-100/70">
              Resonance by Oremea
            </p>

            <div className="mt-6 space-y-6 text-base leading-8 text-zinc-300">
              <p>
                Resonance is strongly recommended as the foundational
                reflection experience before progressing into Compass.
              </p>

              <p>
                The system is designed to help users build:
              </p>

              <ul className="grid gap-3 text-zinc-300 md:grid-cols-2">
                <li>• relational awareness</li>
                <li>• reflective honesty</li>
                <li>• emotional observation</li>
                <li>• pattern recognition</li>
                <li>• communication awareness</li>
                <li>• intentional reflection</li>
              </ul>

              <p>
                Oremea is structured around the principle that
                awareness should precede execution, alignment,
                and intentional connection.
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
