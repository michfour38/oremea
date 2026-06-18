import type { WitnessMeaningPanelModel } from "@/src/lib/harmonize/witness-meaning-panel-model"

type WitnessEmergencePanelProps = {
  model: WitnessMeaningPanelModel
}

function percent(value: number) {
  return `${Math.round(value * 100)}%`
}

export function WitnessEmergencePanel({
  model,
}: WitnessEmergencePanelProps) {
  if (!model.strongestAnchor) {
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
        {model.strongestAnchor.label}
      </h3>

      <p className="mt-2 text-sm leading-6 text-[#bfb8aa]">
        This appears to be a {model.strongestAnchor.type} anchor. The witness is
        not deciding what is true. It is noticing what currently carries the
        most signal.
      </p>

      <p className="mt-3 text-xs text-[#8f8778]">
        Signal strength {percent(model.strongestAnchor.strength)} · confidence{" "}
        {percent(model.strongestAnchor.confidence)}
      </p>

      {model.strongestAnchor.behavioralMarkers.length > 0 ? (
        <div className="mt-5">
          <p className="text-sm font-medium text-[#f4f1ea]">
            In behavior, this may look like
          </p>

          <ul className="mt-3 space-y-2">
            {model.strongestAnchor.behavioralMarkers.map((marker) => (
              <li key={marker} className="text-sm leading-6 text-[#d8d2c6]">
                {marker}
              </li>
            ))}
          </ul>
        </div>
      ) : null}

      {model.strongestAnchor.evidence.length > 0 ? (
        <div className="mt-5">
          <p className="text-sm font-medium text-[#f4f1ea]">
            The witness noticed
          </p>

          <ul className="mt-3 space-y-2">
            {model.strongestAnchor.evidence.map((item) => (
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