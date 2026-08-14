export function ExploreWhatNot() {
  return (
    <section className="border-b border-white/5 bg-zinc-950/60">
      <div className="mx-auto max-w-6xl px-5 py-16 md:py-20">
        <div className="max-w-3xl">
          <p className="text-xs uppercase tracking-[0.28em] text-[#b79a63]">
            What Oremea Is Not
          </p>

          <h2 className="mt-4 text-3xl font-light leading-tight text-zinc-100 md:text-5xl">
            Clear boundaries are part of the product.
          </h2>
        </div>

        <div className="mt-10 grid gap-4 md:grid-cols-2">
          <div className="rounded-3xl border border-white/10 bg-zinc-950/80 p-6 md:p-8">
            <p className="mb-6 text-sm uppercase tracking-[0.18em] text-zinc-500">
              Oremea is not
            </p>

            <ul className="space-y-4 text-base leading-7 text-zinc-300">
              <li>• therapy or medical treatment</li>
              <li>• crisis support or emergency care</li>
              <li>• diagnosis or predictive profiling</li>
              <li>• an open-ended AI chat service</li>
              <li>• forced social participation</li>
              <li>• manipulative engagement design</li>
            </ul>
          </div>

          <div className="rounded-3xl border border-[#b79a63]/20 bg-[#b79a63]/[0.03] p-6 md:p-8">
            <p className="mb-6 text-sm uppercase tracking-[0.18em] text-[#b79a63]">
              Core principles
            </p>

            <ul className="space-y-4 text-base leading-7 text-zinc-300">
              <li>• self-led participation</li>
              <li>• private reflections remain private</li>
              <li>• structured awareness systems</li>
              <li>• guided recognition over dependency</li>
              <li>• clarity before action</li>
              <li>• intentional communication and alignment</li>
            </ul>
          </div>
        </div>
      </div>
    </section>
  );
}
