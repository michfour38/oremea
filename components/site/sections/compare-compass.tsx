import Link from "next/link";
import type { CompareMode } from "@/app/compare/page";

type CompareCompassProps = {
  mode: CompareMode;
};

export function CompareCompass({ mode }: CompareCompassProps) {
  return (
    <section className="border-b border-white/5 bg-zinc-950/60">
      <div className="mx-auto max-w-6xl px-5 py-24">
        <div className="grid gap-14 md:grid-cols-[0.95fr_1.05fr]">
          <div>
            <p className="mb-5 text-xs uppercase tracking-[0.28em] text-amber-200/70">
              Direction & Execution
            </p>

            <h2 className="text-4xl font-light leading-tight text-zinc-100">
              Compass
            </h2>

            <p className="mt-6 text-lg leading-8 text-zinc-400">
              Turn self-awareness into one executable next step.
            </p>
          </div>

          <div className="rounded-3xl border border-white/10 bg-white/[0.02] p-10">
            {mode === "experience" ? (
              <div className="space-y-8">
                <div className="rounded-3xl border border-[#2A2418] bg-[#11100D] p-8">
                  <p className="font-serif text-2xl leading-relaxed text-[#EAEAEA] md:text-3xl">
  Like finally knowing what to do next.
</p>

<p className="mt-8 font-serif text-xl leading-relaxed text-[#BFBFBF]">
  Like several competing priorities collapsing into one clear direction.
</p>

<p className="mt-8 font-serif text-xl leading-relaxed text-[#BFBFBF]">
  Like seeing why a goal matters before deciding how to pursue it.
</p>

<p className="mt-8 font-serif text-xl leading-relaxed text-[#BFBFBF]">
  Like understanding what keeps interrupting movement.
</p>

<p className="mt-8 font-serif text-xl leading-relaxed text-[#BFBFBF]">
  Like making an agreement with yourself you can actually keep.
</p>

                  <div className="mt-10 flex flex-wrap gap-4">
                    <Link
                      href="/compass"
                      className="rounded-full border border-amber-200/20 bg-amber-100/[0.05] px-5 py-2 text-sm text-amber-100 transition hover:border-amber-100/50 hover:bg-amber-100/[0.08]"
                    >
                      Compass — R520
                    </Link>
                  </div>
                </div>
              </div>
            ) : (
              <div className="space-y-8">
                <div>
                  <p className="mb-4 text-sm uppercase tracking-[0.18em] text-zinc-500">
                    Focus
                  </p>

                  <p className="text-base leading-8 text-zinc-300">
  Compass is a structured goal-setting, decision-making,
  and execution process.

  It helps transform awareness into movement by identifying
  what matters most, what keeps interrupting progress,
  and what next step can realistically be taken.

  Rather than generating more possibilities, Compass narrows
  attention toward one executable direction and helps build
  confidence through action.
</p>
                </div>

                <div>
                  <p className="mb-4 text-sm uppercase tracking-[0.18em] text-zinc-500">
                    Designed For
                  </p>

                  <ul className="grid gap-3 text-base leading-7 text-zinc-400 md:grid-cols-2">
                    <li>• personal goalsetting</li>
                    <li>• couples alignment</li>
                    <li>• family direction systems</li>
                    <li>• shared execution structures</li>
                  </ul>
                </div>

                <div>
                  <p className="mb-4 text-sm uppercase tracking-[0.18em] text-zinc-500">
                    Includes
                  </p>

                  <ul className="grid gap-3 text-base leading-7 text-zinc-400 md:grid-cols-2">
                    <li>• structured goal exploration</li>
<li>• priority clarification</li>
<li>• interruption identification</li>
<li>• layered self-inquiry</li>
<li>• guided discussion</li>
<li>• executable next-step creation</li>
                  </ul>
                </div>

                <div className="rounded-2xl border border-white/10 bg-black/20 p-6">
                  <p className="text-sm leading-7 text-zinc-400">
  Most people do not struggle because they lack goals.

  They struggle because movement becomes interrupted.

  Compass helps reveal what matters most, what creates resistance,
  and what action can realistically be sustained.

  Confidence is built through kept agreements with yourself.

  Compass helps you begin there.
</p>
                </div>

                <div className="flex flex-wrap gap-4 pt-2">
                  <Link
                    href="/compass"
                    className="rounded-full border border-amber-200/20 bg-amber-100/[0.05] px-5 py-2 text-sm text-amber-100 transition hover:border-amber-100/50 hover:bg-amber-100/[0.08]"
                  >
                    Compass — R520
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