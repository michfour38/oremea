import {
  COMPASS_AREA_QUESTIONS,
  type CompassAreaResponse,
  type CompassGoalArea,
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

export function CompassPriorityFlow({
  title,
  description,
  areaResponses,
  reviewLabel,
  onContinue,
  onChooseArea,
  showAreaChoices = false,
}: {
  title: string;
  description: string;
  areaResponses: CompassAreaResponse[];
  reviewLabel: string;
  onContinue?: () => void;
  onChooseArea?: (area: CompassGoalArea) => void;
  showAreaChoices?: boolean;
}) {
  return (
    <CompassCard title={title} description={description}>
      <details className="rounded-2xl border border-zinc-800 bg-[#131313] p-4">
        <summary className={`cursor-pointer text-sm ${BODY_TEXT}`}>
          {reviewLabel}
        </summary>

        <div className="mt-4 space-y-4">
          {areaResponses.map((response) => (
            <div
              key={response.area}
              className="rounded-xl border border-zinc-800 p-4"
            >
              <p className="text-sm font-medium text-[#d8b15f]">
                {AREA_LABELS[response.area]}
              </p>

              <p className={`mt-2 whitespace-pre-line text-sm ${BODY_TEXT}`}>
                {response.answer}
              </p>
            </div>
          ))}
        </div>
      </details>

      {showAreaChoices && onChooseArea ? (
        <div className="grid gap-3 sm:grid-cols-2">
          {COMPASS_AREA_QUESTIONS.map((item) => (
            <button
              key={item.area}
              onClick={() => onChooseArea(item.area)}
              className="selection-button"
            >
              {item.title}
            </button>
          ))}
        </div>
      ) : null}

      {onContinue ? (
        <button onClick={onContinue} className="primary-button">
          Continue
        </button>
      ) : null}
    </CompassCard>
  );
}