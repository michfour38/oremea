import Link from "next/link";
import type { CompareMode } from "@/app/compare/page";

type CompareResonanceProps = {
  mode: CompareMode;
};

export function CompareResonance({ mode }: CompareResonanceProps) {
  return (
    <section className="border-b border-white/5">
      <div className="mx-auto max-w-6xl px-5 py-24">
        <div className="grid gap-14 md:grid-cols-[0.95fr_1.05fr]">
          <div>
            <p className="mb-5 text-xs uppercase tracking-[0.28em] text-[#e7c98b]">
              Relational Reflection
            </p>

            <h2 className="text-4xl font-light leading-tight text-zinc-100">
              Resonance
            </h2>

            <p className="mt-6 text-lg leading-8 text-zinc-200">
              Relational awareness and self-observation.
            </p>
          </div>

          <div className="rounded-3xl border border-[#e7c98b]/25 bg-[#e7c98b]/[0.03] p-10">
            {mode === "experience" ? (
              <div className="space-y-8">
                <div className="rounded-3xl border border-white/10 bg-zinc-950/80 p-8">
                  <p className="font-serif text-2xl leading-relaxed text-zinc-100 md:text-3xl">
                    Like finally slowing down enough to notice what keeps
                    repeating.
                  </p>

                  <p className="mt-8 font-serif text-xl leading-relaxed text-zinc-200">
                    Like seeing your own patterns without being shamed for them.
                  </p>

                  <p className="mt-8 font-serif text-xl leading-relaxed text-zinc-200">
                    Like someone held up a mirror gently — and didn’t look away.
                  </p>

                  <p className="mt-8 font-serif text-xl leading-relaxed text-zinc-200">
                    Like becoming more honest with yourself over time.
                  </p>

                  <p className="mt-8 font-serif text-xl leading-relaxed text-zinc-200">
                    Like finally recognising the difference between attraction,
                    attachment, clarity, and repetition.
                  </p>
                  <p className="mt-3 text-sm leading-7 text-zinc-200">
                    Buy the visits first; choose each room when you are ready.
                  </p>

                  <div className="mt-4 flex flex-wrap gap-4">
                    <Link
                      href="/resonance/enter"
                      className="rounded-full border border-[#e7c98b]/35 bg-[#e7c98b]/[0.05] px-5 py-2 text-sm text-[#e7c98b] transition hover:border-[#e7c98b]/70 hover:bg-[#e7c98b]/10"
                    >
                      Explore Resonance visits
                    </Link>
                  </div>
                </div>
              </div>
            ) : (
              <div className="space-y-8">
                <div>
                  <p className="mb-4 text-sm uppercase tracking-[0.18em] text-[#e7c98b]">
                    Focus
                  </p>

                  <p className="text-base leading-8 text-zinc-100">
                    Resonance is a private seven-stage room with one teacher and one
                    relational territory. Guided reflections and Mirrors stay inside
                    the participant&apos;s own material rather than turning the room
                    into advice, diagnosis, or a theory about the person.
                  </p>
                </div>

                <div>
                  <p className="mb-4 text-sm uppercase tracking-[0.18em] text-[#e7c98b]">
                    Includes
                  </p>

                  <ul className="grid gap-3 text-base leading-7 text-zinc-200 md:grid-cols-2">
                    <li>• one seven-stage thematic room per visit</li>
                    <li>• guided reflection stages at your own pace</li>
                    <li>• Mirrors across the room</li>
                    <li>• two questions at each stage</li>
                    <li>• a final Closing Mirror</li>
                    <li>• the completed visit in your archive</li>
                  </ul>
                </div>

                <div>
                  <p className="mb-4 text-sm uppercase tracking-[0.18em] text-[#e7c98b]">
                    Mirrors
                  </p>

                  <p className="text-base leading-8 text-zinc-200">
                    Mirrors reflect what is becoming visible across each stage&apos;s
                    responses. The Closing Mirror reads across the full seven-stage
                    visit and reflects what persisted, changed, or became newly visible.
                  </p>
                </div>

                <div className="rounded-2xl border border-white/10 bg-black/20 p-6">
                  <p className="text-sm leading-7 text-zinc-200">
                    Visits are purchased as capacity, not as preselected rooms. Each
                    room stands on its own, no room is a prerequisite for another Oremea product,
                    and unused visits remain available until the participant chooses
                    what to enter next.
                  </p>
                </div>

                <div className="flex flex-wrap gap-4 pt-2">
                  <Link
                    href="/resonance/enter"
                    className="rounded-full border border-[#e7c98b]/35 bg-[#e7c98b]/[0.05] px-5 py-2 text-sm text-[#e7c98b] transition hover:border-[#e7c98b]/70 hover:bg-[#e7c98b]/10"
                  >
                    Explore Resonance visits
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
