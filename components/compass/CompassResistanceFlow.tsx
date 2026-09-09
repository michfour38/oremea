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
  onContinue,
}: {
  reflection: string;
  areaResponses: CompassAreaResponse[];
  selectedArea: CompassGoalArea | null;
  recursiveLayers: CompassRecursiveLayer[];
  onContinue: (savedMirror: string) => void;
}) {
  const [savedCoreMirror, setSavedCoreMirror] = useState<string | null>(null);

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
      }
    }

    void loadOrGenerateCoreMirror();

    return () => {
      cancelled = true;
    };
  }, [areaResponses, recursiveLayers, selectedArea]);

  const fallbackReflection = reflection.trim();
  const displayedReflection =
    savedCoreMirror || fallbackReflection || MIRROR_UNAVAILABLE;
  const mirrorAvailable = Boolean(savedCoreMirror || fallbackReflection);

  function continueWithSavedMirror() {
    const acceptedMirror = savedCoreMirror || fallbackReflection;
    if (!acceptedMirror) return;
    onContinue(acceptedMirror);
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
        onClick={continueWithSavedMirror}
        disabled={!mirrorAvailable}
        className="primary-button disabled:opacity-60"
      >
        Continue to Discussion
      </button>
    </CompassCard>
  );
}
