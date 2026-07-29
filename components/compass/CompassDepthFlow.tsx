"use client";

import { useEffect, useMemo, useState } from "react";

import {
  buildAdaptiveRecursiveQuestion,
  getRememberedAdaptiveRecursiveQuestion,
  rememberAdaptiveRecursiveQuestion,
  type CompassAreaResponse,
  type CompassGoalArea,
  type CompassRecursiveLayer,
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
  const layerNumber = Math.min(recursiveLayers.length + 1, 7);
  const firstAnswer = useMemo(
    () =>
      areaResponses.find((response) => response.area === selectedArea)?.answer ?? "",
    [areaResponses, selectedArea],
  );
  const previousAnswer = recursiveLayers[recursiveLayers.length - 1]?.answer ?? "";
  const carriedAnswer = previousAnswer || firstAnswer;

  const [currentQuestion, setCurrentQuestion] = useState("");
  const [isQuestionLoading, setIsQuestionLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    async function loadQuestion() {
      const remembered = getRememberedAdaptiveRecursiveQuestion({
        layer: layerNumber,
        sourceAnswer: carriedAnswer,
      });

      if (remembered) {
        setCurrentQuestion(remembered);
        setIsQuestionLoading(false);
        return;
      }

      if (!selectedArea) {
        setCurrentQuestion(
          buildAdaptiveRecursiveQuestion({
            layer: layerNumber,
            selectedAreaLabel,
            previousAnswer,
            firstAnswer,
          }),
        );
        setIsQuestionLoading(false);
        return;
      }

      setCurrentQuestion("");
      setIsQuestionLoading(true);

      try {
        const response = await fetch("/api/compass/descent-question", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            layer: layerNumber,
            selectedArea,
            areaResponses,
            recursiveLayers,
          }),
        });

        const data = await response.json();

        if (cancelled) return;

        const generatedQuestion =
          response.ok && data?.ok && typeof data.question === "string"
            ? data.question.trim()
            : "";

        const question =
          generatedQuestion ||
          buildAdaptiveRecursiveQuestion({
            layer: layerNumber,
            selectedAreaLabel,
            previousAnswer,
            firstAnswer,
          });

        rememberAdaptiveRecursiveQuestion({
          layer: layerNumber,
          sourceAnswer: carriedAnswer,
          question,
        });

        setCurrentQuestion(question);
      } catch (error) {
        if (cancelled) return;

        console.error("Compass Descent question failed:", error);

        const fallback = buildAdaptiveRecursiveQuestion({
          layer: layerNumber,
          selectedAreaLabel,
          previousAnswer,
          firstAnswer,
        });

        rememberAdaptiveRecursiveQuestion({
          layer: layerNumber,
          sourceAnswer: carriedAnswer,
          question: fallback,
        });

        setCurrentQuestion(fallback);
      } finally {
        if (!cancelled) setIsQuestionLoading(false);
      }
    }

    void loadQuestion();

    return () => {
      cancelled = true;
    };
  }, [
    areaResponses,
    carriedAnswer,
    firstAnswer,
    layerNumber,
    previousAnswer,
    recursiveLayers,
    selectedArea,
    selectedAreaLabel,
  ]);

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
