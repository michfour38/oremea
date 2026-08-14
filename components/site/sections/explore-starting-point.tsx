const choices = [
  {
    cue: "I need to understand what is happening.",
    product: "Recognition",
  },
  {
    cue: "I need to observe a pattern over time.",
    product: "Resonance",
  },
  {
    cue: "I know what matters; I need a next step.",
    product: "Compass",
  },
] as const;

export function ExploreStartingPoint() {
  return (
    <section className="border-b border-white/5 bg-zinc-950/60">
      <div className="mx-auto max-w-6xl px-5 py-16 md:py-20">
        <div className="grid gap-10 lg:grid-cols-[0.8fr_1.2fr] lg:items-start">
          <div className="max-w-xl">
            <p className="text-xs uppercase tracking-[0.28em] text-[#b79a63]">
              Where to begin
            </p>
            <h2 className="mt-4 text-3xl font-light leading-tight text-zinc-100 md:text-5xl">
              Start with the sentence that feels closest.
            </h2>
            <p className="mt-6 text-base leading-8 text-zinc-400">
              There is no locked sequence. Resonance remains the strongest
              foundation for deeper reflective work, while every product is
              available as its own entry point.
            </p>
          </div>

          <div className="overflow-hidden rounded-3xl border border-white/10 bg-zinc-950/90">
            {choices.map((choice, index) => (
              <div
                key={choice.product}
                className="grid gap-3 border-b border-white/10 p-5 last:border-b-0 sm:grid-cols-[1fr_auto] sm:items-center md:p-6"
              >
                <p className="text-base leading-7 text-zinc-300">
                  “{choice.cue}”
                </p>
                <div className="flex items-center gap-3 sm:justify-end">
                  <span className="text-xs tabular-nums text-zinc-600">
                    0{index + 1}
                  </span>
                  <span className="text-sm text-[#b79a63]">
                    {choice.product}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
