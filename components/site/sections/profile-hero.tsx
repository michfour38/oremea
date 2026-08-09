export function ProfileHero() {
  return (
    <section className="relative overflow-hidden border-b border-white/10">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_18%_12%,rgba(251,191,36,0.16),transparent_34%),linear-gradient(to_bottom,rgba(9,9,11,0.08),rgba(9,9,11,0.72))]" />

      <div className="relative mx-auto max-w-6xl px-5 py-14 md:py-20">
        <div>
          <p className="mb-4 text-xs uppercase tracking-[0.32em] text-amber-200/75">
            Member profile
          </p>

          <h1 className="max-w-3xl text-5xl font-light leading-[0.98] text-white md:text-7xl">
            Your work,
            <span className="block text-amber-100">gathered.</span>
          </h1>

          <p className="mt-6 max-w-2xl text-base leading-8 text-zinc-300 md:text-lg">
            Everything you have opened, completed, and returned to across
            Oremea—held in one clear record.
          </p>
        </div>
      </div>
    </section>
  );
}
