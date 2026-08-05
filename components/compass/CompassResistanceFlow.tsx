"use client";

import { useEffect, useState } from "react";

import type {
  CompassAreaResponse,
  CompassGoalArea,
  CompassRecursiveLayer,
} from "@/src/lib/compass/session";

import { CompassCard } from "./CompassCard";

const BODY_TEXT = "text-zinc-400";
const MIRROR_UNAVAILABLE =
  "Compass could not complete this reflection yet. Return to the final Descent answer and try again.";

export function CompassCoreReflection({
  reflection,
  areaResponses,
  selectedArea,
  recursiveLayers,
  extraReflection,
  onExtraReflectionChange,
  onContinue,
}: {
  reflection: string;
  areaResponses: CompassAreaResponse[];
  selectedArea: CompassGoalArea | null;
  recursiveLayers: CompassRecursiveLayer[];
  extraReflection: string;
  onExtraReflectionChange: (value: string) => void;
  onContinue: () => void;
}) {
  const [savedCoreMirror, setSavedCoreMirror] = useState<string | null>(null);
  const [mirrorChecked, setMirrorChecked] = useState(false);
  const [continuing, setContinuing] = useState(false);
  const [continueError, setContinueError] = useState("");

  useEffect(() => {
    let cancelled = false;

    async function loadOrGenerateCoreMirror() {
      try {
        const savedResponse = await fetch("/api/compass/mirror?stage=core", {
          method: "GET",
          cache: "no-store",
        });
        const savedData = savedResponse.ok ? await savedResponse.json() : null;
        const savedOutput =
          typeof savedData?.output === "string" && savedData.output.trim()
            ? savedData.output.trim()
            : "";

        if (savedOutput) {
          if (!cancelled) setSavedCoreMirror(savedOutput);
          return;
        }

        const generatedResponse = await fetch("/api/compass/mirror", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            areaResponses,
            selectedArea,
            recursiveLayers,
            mirrorStage: "core",
          }),
        });
        const generatedData = generatedResponse.ok
          ? await generatedResponse.json()
          : null;
        const generatedOutput =
          typeof generatedData?.output === "string" && generatedData.output.trim()
            ? generatedData.output.trim()
            : "";

        if (!cancelled) {
          setSavedCoreMirror(generatedOutput || null);
        }
      } catch (error) {
        console.error("Compass Core Mirror regeneration failed:", error);
      } finally {
        if (!cancelled) setMirrorChecked(true);
      }
    }

    void loadOrGenerateCoreMirror();

    return () => {
      cancelled = true;
    };
  }, [areaResponses, recursiveLayers, selectedArea]);

  const displayedReflection =
    savedCoreMirror ?? (mirrorChecked ? MIRROR_UNAVAILABLE : reflection);
  const mirrorAvailable = Boolean(savedCoreMirror);

  if (!mirrorChecked && !savedCoreMirror) {
    return (
      <CompassCard title="" description="">
        <p className="font-serif text-3xl leading-tight text-[#d8b15f] sm:text-4xl">
          Reading your response...
        </p>
      </CompassCard>
    );
  }

  async function continueWithSavedMirror() {
    if (!savedCoreMirror || continuing) return;

    if (savedCoreMirror === reflection) {
      onContinue();
      return;
    }

    setContinuing(true);
    setContinueError("");

    try {
      const response = await fetch("/api/compass/session", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          phase: "discussion",
          discussionMessages: [
            {
              role: "compass",
              content: savedCoreMirror,
            },
          ],
        }),
      });

      if (!response.ok) {
        setContinueError("Compass could not continue with the saved reflection yet.");
        return;
      }

      window.location.reload();
    } catch {
      setContinueError("Compass could not continue with the saved reflection yet.");
    } finally {
      setContinuing(false);
    }
  }

  return (
    <CompassCard title="Core Reflection" description={displayedReflection}>
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

      <button
        type="button"
        onClick={() => void continueWithSavedMirror()}
        disabled={!mirrorAvailable || continuing}
        className="primary-button disabled:cursor-wait disabled:opacity-60"
      >
        {continuing ? "Continuing..." : "Continue"}
      </button>

      {continueError ? (
        <p className="text-sm leading-6 text-amber-200/80">{continueError}</p>
      ) : null}
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
      description={`What usually interrupts, delays, or prevents movement toward ${selectedAreaLabel.toLowerCase()}?`}
    >
      <textarea
        value={resistanceAnswer}
        onChange={(event) => onResistanceChange(event.target.value)}
        placeholder="Describe what most often gets in the way. Be specific about what actually happens."
        rows={8}
        className="compass-textarea"
      />

      <button onClick={onSubmitResistance} className="primary-button">
        Continue
      </button>
    </CompassCard>
  );
}
