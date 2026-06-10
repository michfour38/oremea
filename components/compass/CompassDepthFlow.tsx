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
  Each layer is designed to reveal something different:
  what matters,
  what gives the goal its weight,
  what becomes possible,
  what you are unwilling to live without,
  and the deeper reality your choices are pointing toward.
</p>

<p className={`text-sm leading-relaxed ${BODY_TEXT}`}>
  The purpose of The Descent is not understanding for its own sake.

  The purpose is movement.
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
  return (
    <CompassCard
      eyebrow={`The Descent · Layer ${Math.min(recursiveLayers.length + 1, 7)} of 7`}
      title={buildAdaptiveRecursiveQuestion({
        layer: recursiveLayers.length + 1,
        selectedAreaLabel,
        previousAnswer:
          recursiveLayers[recursiveLayers.length - 1]?.answer ?? "",
        firstAnswer:
          areaResponses.find((response) => response.area === selectedArea)
            ?.answer ?? "",
      })}
      description={
  recursiveLayers.length === 0
    ? `The Descent will follow the deeper thread beneath your focus on ${selectedAreaLabel.toLowerCase()}.`
    : ""
}
    >

<div className="mb-4 rounded-[1.2rem] border border-[#d8b15f]/25 bg-[#17130D] p-4 text-sm leading-relaxed text-[#d8b15f]">
  <span className="font-semibold">NB:</span> Compass is using your previous
  answer to shape the next question.

  Some questions may feel similar. This is intentional.

  Compass is following the same topic from different angles to uncover the
  deeper pattern beneath your goal.
</div>

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