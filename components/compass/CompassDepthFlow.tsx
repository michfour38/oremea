import type {
  CompassAreaResponse,
  CompassGoalArea,
  CompassRecursiveLayer,
} from "@/src/lib/compass/session";

import { CompassCard } from "./CompassCard";

const BODY_TEXT = "text-zinc-300";

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
        Over seven layers, Compass follows one thread deeper and deeper until the
        reason beneath the goal becomes clearer.
      </p>

      <p className={`text-sm leading-relaxed ${BODY_TEXT}`}>
        Each answer becomes the starting point for the next question.
      </p>

      <button onClick={onBegin} className="primary-button">
        Begin The Descent
      </button>
    </CompassCard>
  );
}

export function CompassDepthFlow({
  selectedArea,
  areaResponses,
  recursiveLayers,
  recursiveAnswer,
  currentQuestion,
  isQuestionLoading,
  onAnswerChange,
  onSubmitAnswer,
}: {
  selectedArea: CompassGoalArea | null;
  areaResponses: CompassAreaResponse[];
  recursiveLayers: CompassRecursiveLayer[];
  recursiveAnswer: string;
  currentQuestion: string;
  isQuestionLoading: boolean;
  onAnswerChange: (value: string) => void;
  onSubmitAnswer: () => void;
}) {
  const firstAnswer =
    areaResponses.find((response) => response.area === selectedArea)?.answer ?? "";
  const previousAnswer = recursiveLayers[recursiveLayers.length - 1]?.answer ?? "";
  const carriedAnswer = previousAnswer || firstAnswer;
  const layerNumber = Math.min(recursiveLayers.length + 1, 7);

  return (
    <CompassCard
      eyebrow={`The Descent · Layer ${layerNumber} of 7`}
      title=""
      description=""
    >
      {carriedAnswer ? (
        <div className="rounded-[1.3rem] border border-zinc-700 bg-[#141414] p-5">
          <p className="text-xs uppercase tracking-[0.2em] text-zinc-300">
            You said
          </p>
          <p className="mt-3 whitespace-pre-line text-base leading-7 text-zinc-100 sm:text-lg">
            {carriedAnswer}
          </p>
        </div>
      ) : null}

      <div className="pt-2">
        {isQuestionLoading ? (
          <p className="font-serif text-2xl leading-tight text-zinc-100 sm:text-3xl">
            Following the thread...
          </p>
        ) : (
          <h2 className="font-serif text-3xl leading-tight text-[#d8b15f] sm:text-4xl">
            {currentQuestion}
          </h2>
        )}
      </div>

      <textarea
        value={recursiveAnswer}
        onChange={(event) => onAnswerChange(event.target.value)}
        placeholder="Answer in your own words."
        rows={7}
        disabled={isQuestionLoading || !currentQuestion}
        className="compass-textarea"
      />

      <button
        onClick={onSubmitAnswer}
        disabled={isQuestionLoading || !currentQuestion || !recursiveAnswer.trim()}
        className="primary-button disabled:cursor-not-allowed disabled:opacity-50"
      >
        Continue
      </button>
    </CompassCard>
  );
}
