import type { WitnessMeaningPanelModel } from "@/src/lib/harmonize/witness-meaning-panel-model";

type WitnessMeaningPanelProps = {
  model: WitnessMeaningPanelModel;
};

function percent(value: number) {
  return `${Math.round(value * 100)}%`;
}

export function WitnessMeaningPanel({ model }: WitnessMeaningPanelProps) {
  if (!model.strongestAnchor) {
    return (
      <section className="rounded-2xl border border-zinc-800 bg-zinc-950/70 p-5">
        <p className="text-sm text-zinc-400">
          Meaning has not stabilized yet. Keep witnessing what happened.
        </p>
      </section>
    );
  }

  return (
    <section className="space-y-4 rounded-2xl border border-amber-300/20 bg-[#17130c] p-5">
      <div>
        <p className="text-xs uppercase tracking-[0.2em] text-amber-200/70">
          Strongest meaning signal
        </p>

        <h3 className="mt-2 text-xl font-semibold text-amber-100">
          {model.strongestAnchor.label}
        </h3>

        <p className="mt-1 text-sm text-zinc-400">
          {model.strongestAnchor.type} · strength{" "}
          {percent(model.strongestAnchor.strength)} · confidence{" "}
          {percent(model.strongestAnchor.confidence)}
        </p>
      </div>

      {model.strongestAnchor.behavioralMarkers.length > 0 && (
        <div>
          <p className="text-sm font-medium text-zinc-200">
            What this seems to mean behaviorally
          </p>

          <ul className="mt-2 space-y-2">
            {model.strongestAnchor.behavioralMarkers.map((marker) => (
              <li key={marker} className="text-sm text-zinc-400">
                {marker}
              </li>
            ))}
          </ul>
        </div>
      )}

      {model.strongestAnchor.evidence.length > 0 && (
        <div>
          <p className="text-sm font-medium text-zinc-200">
            Evidence from the witness trail
          </p>

          <ul className="mt-2 space-y-2">
            {model.strongestAnchor.evidence.map((item) => (
              <li key={item} className="text-sm text-zinc-400">
                “{item}”
              </li>
            ))}
          </ul>
        </div>
      )}

      {model.readyForSharedSpace && (
        <div className="rounded-xl border border-emerald-300/20 bg-emerald-950/20 p-4">
          <p className="text-sm text-emerald-100">
            Enough has been named to enter shared space without everything
            needing to be exposed.
          </p>
        </div>
      )}
    </section>
  );
}