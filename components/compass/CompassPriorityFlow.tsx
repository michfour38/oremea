"use client";

import { useEffect, useState } from "react";

import {
  COMPASS_AREA_QUESTIONS,
  type CompassAreaResponse,
  type CompassGoalArea,
} from "@/src/lib/compass/session";

import { CompassCard } from "./CompassCard";

const BODY_TEXT = "text-zinc-400";
const MIRROR_UNAVAILABLE =
  "Compass could not complete this reflection yet. Return to your answers and try again.";

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
  const isAreaMirror = !showAreaChoices && title === "What stands out";
  const [savedAreaMirror, setSavedAreaMirror] = useState<string | null>(null);
  const [mirrorChecked, setMirrorChecked] = useState(!isAreaMirror);

  useEffect(() => {
    if (!isAreaMirror) return;

    let cancelled = false;

    fetch("/api/compass/mirror?stage=area", {
      method: "GET",
      cache: "no-store",
    })
      .then((response) => (response.ok ? response.json() : null))
      .then((data) => {
        if (cancelled) return;
        setSavedAreaMirror(
          typeof data?.output === "string" && data.output.trim()
            ? data.output.trim()
            : null,
        );
      })
      .catch(() => {})
      .finally(() => {
        if (!cancelled) setMirrorChecked(true);
      });

    return () => {
      cancelled = true;
    };
  }, [isAreaMirror]);

  const displayTitle = showAreaChoices ? "Where do you want to begin?" : title;
  const displayDescription = showAreaChoices
    ? "You have named several things that matter. Choose the area you want Compass to follow more deeply."
    : isAreaMirror
      ? savedAreaMirror ?? (mirrorChecked ? MIRROR_UNAVAILABLE : "Restoring your reflection...")
      : description;

  return (
    <CompassCard title={displayTitle} description={displayDescription}>
      <details className="rounded-2xl border border-zinc-800 bg-[#131313] p-4">
        <summary className={`cursor-pointer text-sm ${BODY_TEXT}`}>
          {reviewLabel}
        </summary>

        <div className="mt-4 space-y-4">
          {areaResponses.map((response) => (
            <div
              key={response.area}
              className="rounded-xl border border-zinc-800 bg-[#101010] p-4"
            >
              <p className="text-sm font-medium text-[#d8b15f]">
                {AREA_LABELS[response.area]}
              </p>

              <p className={`mt-2 whitespace-pre-line text-sm leading-7 ${BODY_TEXT}`}>
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
