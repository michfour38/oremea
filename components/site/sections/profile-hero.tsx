export function ProfileHero() {
  return (
    <section className="relative overflow-hidden border-b border-white/10">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_18%_12%,rgba(183,154,99,0.1),transparent_30%),linear-gradient(to_bottom,rgba(9,9,11,0.35),rgba(9,9,11,0.8))]" />

      <div className="relative mx-auto max-w-6xl px-5 py-8 md:py-10">
        <div>
          <p className="mb-3 text-[11px] uppercase tracking-[0.28em] text-[#b79a63]">
            Member profile
          </p>

          <h1 className="max-w-3xl text-4xl font-light leading-tight text-zinc-100 md:text-5xl">
            Your work, gathered.
          </h1>

          <p className="mt-3 max-w-2xl text-sm leading-6 text-zinc-400 md:text-base">
            Everything you have opened, completed, and returned to across
            Oremea—held in one clear record.
          </p>
        </div>
      </div>
    </section>
  );
}
