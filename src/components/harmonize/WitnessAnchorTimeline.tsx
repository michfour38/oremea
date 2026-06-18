import type { WitnessAnchorTimelineItem } from "@/src/lib/harmonize/witness-anchor-timeline"

type WitnessAnchorTimelineProps = {
  timeline: WitnessAnchorTimelineItem[]
}

function percent(value: number) {
  return `${Math.round(value * 100)}%`
}

export function WitnessAnchorTimeline({
  timeline,
}: WitnessAnchorTimelineProps) {
  if (timeline.length === 0) {
    return null
  }

  return (
    <section className="rounded-2xl border border-white/10 bg-black/25 p-5">
      <p className="text-xs uppercase tracking-[0.25em] text-[#c6a96b]">
        How meaning evolved
      </p>

      <div className="mt-6 space-y-6">
        {timeline.map((item, index) => (
          <div key={item.id} className="relative pl-6">
            {index < timeline.length - 1 ? (
              <div className="absolute left-[7px] top-8 h-full w-px bg-[#c6a96b]/20" />
            ) : null}

            <div className="absolute left-0 top-2 h-4 w-4 rounded-full border border-[#c6a96b]/40 bg-[#17130c]" />

            <div>
              <h4 className="text-lg font-medium text-[#f4f1ea]">
                {item.label}
              </h4>

              <p className="mt-1 text-xs text-[#8f8778]">
                {item.type} · strength {percent(item.strength)} · confidence{" "}
                {percent(item.confidence)}
              </p>

              {item.evidence.length > 0 ? (
                <div className="mt-3 space-y-2">
                  {item.evidence.map((evidence) => (
                    <p
                      key={evidence}
                      className="text-sm leading-6 text-[#d8d2c6]"
                    >
                      “{evidence}”
                    </p>
                  ))}
                </div>
              ) : null}
            </div>
          </div>
        ))}
      </div>
    </section>
  )
}