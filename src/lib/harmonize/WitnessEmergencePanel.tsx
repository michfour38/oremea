import type { WitnessMeaningPanelModel } from "@/src/lib/harmonize/witness-meaning-panel-model"
import {
  buildAnchorEmergenceSentence,
  buildAnchorFollowSentence,
} from "@/src/lib/harmonize/witness-anchor-language"

type WitnessEmergencePanelProps = {
  model: WitnessMeaningPanelModel
}

function percent(value: number) {
  return `${Math.round(value * 100)}%`
}

function sourceLabel(source?: string) {
  return source === "pattern" ? "Multiple entries" : "Single entry"
}

function sourceDescription(source?: string) {
  return source === "pattern"
    ? "The witness noticed this emerging across the conversation."
    : "The witness noticed this inside the current strongest entry."
}

export function WitnessEmergencePanel({ model }: WitnessEmergencePanelProps) {
  const displayAnchor = model.activeAnchor ?? model.strongestAnchor

  if (!displayAnchor) {
    return (
      <section className="rounded-2xl border border-white/10 bg-black/25 p-5">
        <p className="text-xs uppercase tracking-[0.25em] text-[#c6a96b]">
          What is becoming clearer
        </p>

        <p className="mt-3 text-sm leading-6 text-[#bfb8aa]">
          Nothing has stabilized yet. Keep naming what happened. The witness
          will follow the strongest signal.
        </p>
      </section>
    )
  }

  return (
    <section className="rounded-2xl border border-[#c6a96b]/25 bg-[#17130c]/80 p-5">
      <p className="text-xs uppercase tracking-[0.25em] text-[#c6a96b]">
        What is becoming clearer
      </p>

      <h3 className="mt-3 text-2xl font-semibold text-[#f4f1ea]">
        {displayAnchor.label}
      </h3>

      <p className="mt-2 text-sm leading-6 text-[#bfb8aa]">
        {buildAnchorEmergenceSentence({
          anchor: displayAnchor.label,
          type: displayAnchor.type as any,
        })}
      </p>

      <p className="mt-2 text-sm leading-6 text-[#bfb8aa]">
        {buildAnchorFollowSentence({
          anchor: displayAnchor.label,
          type: displayAnchor.type as any,
        })}
      </p>

      <div className="mt-5 grid gap-3 md:grid-cols-3">
        <div className="rounded-xl border border-white/10 bg-black/20 p-3">
          <p className="text-[10px] uppercase tracking-[0.2em] text-[#8f8778]">
            Observed In
          </p>

          <p className="mt-2 text-sm text-[#f4f1ea]">
            {sourceLabel(displayAnchor.source)}
          </p>
        </div>

        <div className="rounded-xl border border-white/10 bg-black/20 p-3">
          <p className="text-[10px] uppercase tracking-[0.2em] text-[#8f8778]">
            Strength
          </p>

          <p className="mt-2 text-sm text-[#f4f1ea]">
            {percent(displayAnchor.strength)}
          </p>
        </div>

        <div className="rounded-xl border border-white/10 bg-black/20 p-3">
          <p className="text-[10px] uppercase tracking-[0.2em] text-[#8f8778]">
            Confidence
          </p>

          <p className="mt-2 text-sm text-[#f4f1ea]">
            {percent(displayAnchor.confidence)}
          </p>
        </div>
      </div>

      <p className="mt-3 text-xs leading-5 text-[#8f8778]">
        {sourceDescription(displayAnchor.source)}
      </p>

      {model.nextQuestion ? (
        <div className="mt-5 rounded-2xl border border-white/10 bg-black/25 p-4">
          <p className="text-xs uppercase tracking-[0.2em] text-[#8f8778]">
            The witness is following
          </p>

          <p className="mt-3 text-sm leading-6 text-[#f4f1ea]">
            {model.nextQuestion}
          </p>
        </div>
      ) : null}

      {displayAnchor.behavioralMarkers.length > 0 ? (
        <div className="mt-5">
          <p className="text-sm font-medium text-[#f4f1ea]">
            In behavior, this may look like
          </p>

          <ul className="mt-3 space-y-2">
            {displayAnchor.behavioralMarkers.map((marker) => (
              <li key={marker} className="text-sm leading-6 text-[#d8d2c6]">
                {marker}
              </li>
            ))}
          </ul>
        </div>
      ) : null}

      {displayAnchor.evidence.length > 0 ? (
        <div className="mt-5">
          <p className="text-sm font-medium text-[#f4f1ea]">
            The witness noticed
          </p>

          <ul className="mt-3 space-y-2">
            {displayAnchor.evidence.map((item) => (
              <li key={item} className="text-sm leading-6 text-[#d8d2c6]">
                “{item}”
              </li>
            ))}
          </ul>
        </div>
      ) : null}

      {model.readyForSharedSpace ? (
        <div className="mt-5 rounded-2xl border border-[#c6a96b]/25 bg-[#c6a96b]/10 p-4">
          <p className="text-sm leading-6 text-[#f4f1ea]">
            Enough has become clear to enter shared space without exposing
            everything.
          </p>
        </div>
      ) : null}
    </section>
  )
}