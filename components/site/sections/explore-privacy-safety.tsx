export function ExplorePrivacySafety() {
  return (
    <section>
      <div className="mx-auto max-w-6xl px-5 py-24">
        <div className="max-w-3xl">
          <p className="mb-5 text-xs uppercase tracking-[0.28em] text-amber-200/70">
            Privacy & Safety
          </p>

          <h2 className="text-3xl font-light leading-tight text-zinc-100 md:text-5xl">
            Self-led systems designed around privacy, reflection,
            and intentional participation.
          </h2>
        </div>

        <div className="mt-16 grid gap-8 md:grid-cols-2">
          <div className="rounded-3xl border border-amber-200/10 bg-amber-100/[0.03] p-10">
            <p className="text-sm uppercase tracking-[0.18em] text-amber-100/70">
              Core Principles
            </p>

            <ul className="mt-8 space-y-4 text-base leading-8 text-zinc-300">
              <li>• self-led participation</li>
              <li>• private reflections remain private</li>
              <li>• no forced social exposure</li>
              <li>• guided awareness over dependency</li>
              <li>• structured reflection over manipulation</li>
              <li>• intentional communication and alignment</li>
            </ul>
          </div>

          <div className="rounded-3xl border border-white/10 bg-white/[0.02] p-10">
            <p className="text-sm uppercase tracking-[0.18em] text-zinc-400">
              Important Clarifications
            </p>

            <div className="mt-8 space-y-6 text-base leading-8 text-zinc-300">
              <p>
                Oremea does not provide therapy, medical treatment,
                crisis support, or diagnostic services.
              </p>

              <p>
                Expanded recognition tools are designed to support
                reflective synthesis and awareness rather than replace
                personal judgment, responsibility, or professional care.
              </p>

              <p>
                Users remain in control of their participation,
                reflections, and progression throughout the ecosystem.
              </p>
            </div>
          </div>
        </div>

        <div className="mt-16 flex justify-center">
          <a
            href="/compare"
            className="rounded-full border border-amber-200/30 bg-amber-100/10 px-7 py-3 text-sm uppercase tracking-[0.18em] text-amber-100 transition hover:border-amber-100/60 hover:bg-amber-100/15"
          >
            Compare Products
          </a>
        </div>
      </div>
    </section>
  );
}
