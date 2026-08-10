import type { CompareMode } from "@/app/compare/page";

type CompareHeroProps = {
  mode: CompareMode;
  setMode: (mode: CompareMode) => void;
};

export function CompareHero({ mode, setMode }: CompareHeroProps) {
  return (
    <section className="relative overflow-hidden border-b border-white/10">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(183,154,99,0.08),transparent_45%)]" />

      <div className="relative mx-auto max-w-4xl px-5 py-28 text-center">
        <p className="mb-6 text-xs uppercase tracking-[0.32em] text-[#b79a63]">
          Compare The Ecosystem
        </p>

        <h1 className="mx-auto max-w-3xl text-4xl font-light leading-tight text-zinc-100 md:text-6xl">
          Different kinds of participation for what is here now.
        </h1>

        <p className="mx-auto mt-10 max-w-2xl font-serif text-xl leading-relaxed text-zinc-300 md:text-2xl">
          Each Oremea product has its own job.
        </p>

        <p className="mx-auto mt-6 max-w-2xl text-base leading-8 text-zinc-400 md:text-lg">
          Recognition helps you see yourself clearly. Resonance gives what becomes
          visible somewhere to deepen. Compass helps when you are ready to move.
          Other products hold their own relational and participation contexts.
        </p>

        <p className="mx-auto mt-6 max-w-2xl text-base leading-8 text-zinc-500 md:text-lg">
          There is no compulsory sequence. Choose the container that matches the
          need you actually have.
        </p>

        <div className="mt-12 inline-flex rounded-full border border-white/10 bg-black/30 p-1">
          <button
            type="button"
            onClick={() => setMode("experience")}
            className={`rounded-full px-5 py-2 text-sm tracking-[0.14em] transition ${
              mode === "experience"
                ? "bg-zinc-800 text-zinc-100"
                : "text-zinc-500 hover:text-zinc-300"
            }`}
          >
            EXPERIENCE
          </button>

          <button
            type="button"
            onClick={() => setMode("understand")}
            className={`rounded-full px-5 py-2 text-sm tracking-[0.14em] transition ${
              mode === "understand"
                ? "bg-zinc-800 text-zinc-100"
                : "text-zinc-500 hover:text-zinc-300"
            }`}
          >
            UNDERSTAND
          </button>
        </div>
      </div>
    </section>
  );
}
