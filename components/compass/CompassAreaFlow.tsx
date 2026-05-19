import {
  COMPASS_AREA_QUESTIONS,
  type CompassAreaResponse,
} from "@/src/lib/compass/session";

import { CompassCard } from "./CompassCard";

type CompassAreaFlowProps = {
  areaIndex: number;
  answer: string;
  areaResponses: CompassAreaResponse[];
  onAnswerChange: (value: string) => void;
  onSubmitAnswer: () => void;
};

const BODY_TEXT = "text-zinc-400";

export function CompassAreaFlow({
  areaIndex,
  answer,
  areaResponses,
  onAnswerChange,
  onSubmitAnswer,
}: CompassAreaFlowProps) {
  const currentArea = COMPASS_AREA_QUESTIONS[areaIndex];

  if (!currentArea) {
    return null;
  }

  return (
    <CompassCard
      eyebrow={`${areaIndex + 1} of ${COMPASS_AREA_QUESTIONS.length}`}
      title={currentArea.title}
      description={currentArea.question}
    >
      <textarea
        value={answer}
        onChange={(event) => onAnswerChange(event.target.value)}
        placeholder={currentArea.placeholder}
        rows={7}
        className="compass-textarea"
      />

      <p className={`text-xs leading-relaxed ${BODY_TEXT}`}>
        Your answers do not need to match the examples above. Those are only
        there to help if you feel stuck. The more you open up, the more
        direction you might find.
      </p>

      <button onClick={onSubmitAnswer} className="primary-button">
        Continue
      </button>
    </CompassCard>
  );
}