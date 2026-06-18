import type { WitnessEmergenceSummary } from "@/src/lib/harmonize/witness-emergence-engine"

type WitnessEmergenceSummaryProps = {
  emergence: WitnessEmergenceSummary
}

export function WitnessEmergenceSummary({
  emergence,
}: WitnessEmergenceSummaryProps) {
  return (
    <section className="rounded-2xl border border-[#c6a96b]/20 bg-[#17130c]/70 p-5">
      <p className="text-xs uppercase tracking-[0.25em] text-[#c6a96b]">
        What is emerging
      </p>

      <p className="mt-4 text-sm leading-7 text-[#d8d2c6]">
        {emergence.summary}
      </p>

      <div className="mt-6 grid gap-4 md:grid-cols-3">
        <div className="rounded-xl border border-white/10 bg-black/20 p-4">
          <p className="text-xs uppercase tracking-[0.2em] text-[#8f8778]">
            Began Around
          </p>

          <p className="mt-2 text-base text-[#f4f1ea]">
            {emergence.beganAround ?? "Still forming"}
          </p>
        </div>

        <div className="rounded-xl border border-white/10 bg-black/20 p-4">
          <p className="text-xs uppercase tracking-[0.2em] text-[#8f8778]">
            Moving Toward
          </p>

          <p className="mt-2 text-base text-[#f4f1ea]">
            {emergence.movingToward ?? "Still forming"}
          </p>
        </div>

        <div className="rounded-xl border border-white/10 bg-black/20 p-4">
          <p className="text-xs uppercase tracking-[0.2em] text-[#8f8778]">
            Beneath That
          </p>

          <p className="mt-2 text-base text-[#f4f1ea]">
            {emergence.beneathThat ?? "Not visible yet"}
          </p>
        </div>
      </div>
    </section>
  )
}