import type {
  CompassRecursiveLayer,
} from "@/src/lib/compass/session";

import { CompassCard } from "./CompassCard";

const BODY_TEXT = "text-zinc-400";

export function CompassCoreReflection({
  reflection,
  recursiveLayers,
  extraReflection,
  onExtraReflectionChange,
  onContinue,
}: {
  reflection: string;
  recursiveLayers: CompassRecursiveLayer[];
  extraReflection: string;
  onExtraReflectionChange: (value: string) => void;
  onContinue: () => void;
}) {
  return (
    <CompassCard title="Core pattern reflection" description={reflection}>
      <details className="rounded-2xl border border-zinc-800 bg-[#131313] p-4">
        <summary className={`cursor-pointer text-sm ${BODY_TEXT}`}>
          Review your deeper reflections
        </summary>

        <div className="mt-4 space-y-4">
          {recursiveLayers.map((layer) => (
            <div
              key={layer.layer}
              className="rounded-xl border border-zinc-800 p-4"
            >
              <p className="text-sm text-[#d8b15f]">{layer.question}</p>

              <p className={`mt-2 whitespace-pre-line text-sm ${BODY_TEXT}`}>
                {layer.answer}
              </p>
            </div>
          ))}
        </div>
      </details>

      <textarea
        value={extraReflection}
        onChange={(event) => onExtraReflectionChange(event.target.value)}
        placeholder="Would you like to clarify, question, refine, or add anything before continuing?"
        rows={5}
        className="compass-textarea"
      />

      <button onClick={onContinue} className="primary-button">
        Continue
      </button>
    </CompassCard>
  );
}

export function CompassResistanceFlow({
  selectedAreaLabel,
  resistanceAnswer,
  onResistanceChange,
  onSubmitResistance,
}: {
  selectedAreaLabel: string;
  resistanceAnswer: string;
  onResistanceChange: (value: string) => void;
  onSubmitResistance: () => void;
}) {
  return (
    <CompassCard
      title="What tends to get in the way?"
      description={`What usually interrupts, delays, emotionally complicates, or prevents movement toward ${selectedAreaLabel.toLowerCase()}?`}
    >
      <textarea
        value={resistanceAnswer}
        onChange={(event) => onResistanceChange(event.target.value)}
        placeholder="Describe the friction, emotional resistance, avoidance patterns, fears, or recurring interruptions."
        rows={8}
        className="compass-textarea"
      />

      <button onClick={onSubmitResistance} className="primary-button">
        Analyze resistance
      </button>
    </CompassCard>
  );
}