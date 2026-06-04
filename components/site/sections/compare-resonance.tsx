import Link from "next/link";
import type { CompareMode } from "@/app/compare/page";

type CompareResonanceProps = {
  mode: CompareMode;
};

export function CompareResonance({
  mode,
}: CompareResonanceProps) {
  return (
    <section className="border-b border-white/5">
      <div className="mx-auto max-w-6xl px-5 py-24">
        <div className="grid gap-14 md:grid-cols-[0.95fr_1.05fr]">
          <div>
            <p className="mb-5 text-xs uppercase tracking-[0.28em] text-amber-200/70">
              Recommended Starting Point
            </p>

            <h2 className="text-4xl font-light leading-tight text-zinc-100">
              Resonance
            </h2>

            <p className="mt-6 text-lg leading-8 text-zinc-400">
              Relational awareness and self-observation.
            </p>

            <div className="mt-10 inline-flex rounded-full border border-amber-200/20 bg-amber-100/[0.05] px-5 py-2 text-xs uppercase tracking-[0.18em] text-amber-100">
              Foundation of the Ecosystem
            </div>
          </div>

          <div className="rounded-3xl border border-amber-200/10 bg-amber-100/[0.03] p-10">
            {mode === "experience" ? (
  <div className="space-y-8">
    <div className="rounded-3xl border border-[#2A2418] bg-[#11100D] p-8">
      <p className="font-serif text-2xl leading-relaxed text-[#EAEAEA] md:text-3xl">
        Like finally slowing down enough to notice what keeps repeating.
      </p>

      <p className="mt-8 font-serif text-xl leading-relaxed text-[#BFBFBF]">
        Like seeing your own patterns without being shamed for them.
      </p>

      <p className="mt-8 font-serif text-xl leading-relaxed text-[#BFBFBF]">
        Like someone held up a mirror gently — and didn’t look away.
      </p>

      <p className="mt-8 font-serif text-xl leading-relaxed text-[#BFBFBF]">
        Like becoming more honest with yourself over time.
      </p>

      <p className="mt-8 font-serif text-xl leading-relaxed text-[#BFBFBF]">
        Like finally recognising the difference between attraction, attachment, clarity, and repetition.
      </p>

      <div className="mt-10 flex flex-wrap gap-4">
        <Link
          href="/oremea/enter"
          className="rounded-full border border-white/10 px-5 py-2 text-sm text-zinc-300 transition hover:border-amber-200/30 hover:text-amber-100"
        >
          Resonance — R520
        </Link>

        <Link
          href="/oremea/enter"
          className="rounded-full border border-amber-200/20 bg-amber-100/[0.05] px-5 py-2 text-sm text-amber-100 transition hover:border-amber-100/50 hover:bg-amber-100/[0.08]"
        >
          Resonance + Mirror — R1240
        </Link>
      </div>
    </div>
  </div>
            ) : (
              <div className="space-y-8">
                <div>
                  <p className="mb-4 text-sm uppercase tracking-[0.18em] text-amber-100/70">
                    Focus
                  </p>

                  <p className="text-base leading-8 text-zinc-300">
                    Resonance is a structured reflective journey designed
                    to help users better understand repeated relational
                    patterns, communication tendencies, emotional loops,
                    attraction dynamics, and reflective honesty over time.
                  </p>
                </div>

                <div>
                  <p className="mb-4 text-sm uppercase tracking-[0.18em] text-amber-100/70">
                    Includes
                  </p>

                  <ul className="grid gap-3 text-base leading-7 text-zinc-400 md:grid-cols-2">
                    <li>• self-paced reflective journey</li>
                    <li>• approximately 10-week structure</li>
                    <li>• guided reflective frameworks</li>
                    <li>• pattern recognition systems</li>
                    <li>• communication awareness</li>
                    <li>• 2Q synthesis reflections</li>
                  </ul>
                </div>

                <div>
                  <p className="mb-4 text-sm uppercase tracking-[0.18em] text-amber-100/70">
                    Expanded Recognition Tools
                  </p>

                  <p className="text-base leading-8 text-zinc-400">
                    Mirror provides optional deeper reflective synthesis
                    across user-generated reflections, emotional contradictions,
                    behavioural repetition, and recurring relational patterns over time.
                  </p>
                </div>

                <div className="rounded-2xl border border-white/10 bg-black/20 p-6">
                  <p className="text-sm leading-7 text-zinc-400">
                    Resonance is strongly recommended before progressing
                    into Compass, Harmonize, or The Current.
                  </p>
                </div>

                <div className="flex flex-wrap gap-4 pt-2">
                  <Link
                    href="/oremea/enter"
                    className="rounded-full border border-white/10 px-5 py-2 text-sm text-zinc-300 transition hover:border-amber-200/30 hover:text-amber-100"
                  >
                    Resonance — R520
                  </Link>

                  <Link
                    href="/oremea/enter"
                    className="rounded-full border border-amber-200/20 bg-amber-100/[0.05] px-5 py-2 text-sm text-amber-100 transition hover:border-amber-100/50 hover:bg-amber-100/[0.08]"
                  >
                    Resonance + Mirror — R1240
                  </Link>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}