import {
  buildAdaptiveRecursiveQuestion,
  type CompassAreaResponse,
  type CompassGoalArea,
  type CompassRecursiveLayer,
} from "@/src/lib/compass/session";

import { CompassCard } from "./CompassCard";

const BODY_TEXT = "text-zinc-400";

const AREA_LABELS: Record<CompassGoalArea, string> = {
  relationships: "Relationships",
  income: "Income",
  health: "Health",
  spirituality: "Spirituality",
  investments: "Investments",
  network: "Network",
  knowledge: "Knowledge",
  lifestyle: "Lifestyle",
};

export function CompassDepthIntro({
  selectedAreaLabel,
  onBegin,
}: {
  selectedAreaLabel: string;
  onBegin: () => void;
}) {
  return (
    <CompassCard
      title="The Descent"
      description={`You have chosen ${selectedAreaLabel}. Now Compass begins identifying what matters most beneath the surface of that choice.`}
    >
      <p className={`text-sm leading-relaxed ${BODY_TEXT}`}>
        Over the next seven layers, Compass will approach this goal from several
        different angles.
      </p>

      <p className={`text-sm leading-relaxed ${BODY_TEXT}`}>
        Some questions may feel similar at first. This is intentional.
      </p>

      <p className={`text-sm leading-relaxed ${BODY_TEXT}`}>
        Each layer is designed to reveal something different: what matters, what
        gives the goal its weight, what becomes possible, what you are unwilling
        to live without, and the deeper reality your choices are pointing toward.
      </p>

      <p className={`text-sm leading-relaxed ${BODY_TEXT}`}>
        The purpose of The Descent is movement.
      </p>

      <button onClick={onBegin} className="primary-button">
        Begin The Descent
      </button>
    </CompassCard>
  );
}

export function CompassDepthFlow({
  selectedArea,
  selectedAreaLabel,
  areaResponses,
  recursiveLayers,
  recursiveAnswer,
  onAnswerChange,
  onSubmitAnswer,
}: {
  selectedArea: CompassGoalArea | null;
  selectedAreaLabel: string;
  areaResponses: CompassAreaResponse[];
  recursiveLayers: CompassRecursiveLayer[];
  recursiveAnswer: string;
  onAnswerChange: (value: string) => void;
  onSubmitAnswer: () => void;
}) {
  const firstAnswer =
    areaResponses.find((response) => response.area === selectedArea)?.answer ?? "";
  const previousAnswer = recursiveLayers[recursiveLayers.length - 1]?.answer ?? "";
  const carriedAnswer = previousAnswer || firstAnswer;

  return (
    <CompassCard
      eyebrow={`The Descent · Layer ${Math.min(recursiveLayers.length + 1, 7)} of 7`}
      title={buildAdaptiveRecursiveQuestion({
        layer: recursiveLayers.length + 1,
        selectedAreaLabel,
        previousAnswer,
        firstAnswer,
      })}
      description={
        recursiveLayers.length === 0
          ? `The Descent will follow the deeper thread beneath your focus on ${selectedAreaLabel.toLowerCase()}.`
          : ""
      }
    >
      {carriedAnswer ? (
        <div className="rounded-[1.3rem] border border-zinc-800 bg-[#141414] p-5">
          <p className="text-xs uppercase tracking-[0.2em] text-zinc-500">
            You said
          </p>
          <p className="mt-3 whitespace-pre-line text-sm leading-7 text-zinc-300 sm:text-base">
            {carriedAnswer}
          </p>
        </div>
      ) : null}

      <p className="text-sm leading-7 text-zinc-400">
        Compass carries your previous answer forward while each question looks at
        the same goal from another angle.
      </p>

      <textarea
        value={recursiveAnswer}
        onChange={(event) => onAnswerChange(event.target.value)}
        placeholder="Answer with as much specific reality as you can. What exists today, what needs attention, and what would create meaningful movement?"
        rows={7}
        className="compass-textarea"
      />

      <button onClick={onSubmitAnswer} className="primary-button">
        Continue
      </button>
    </CompassCard>
  );
}
