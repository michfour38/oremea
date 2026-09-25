"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

import type { ResonancePromptDTO } from "@/src/lib/resonance/getCurrentDayContent";
import {
  formatResonanceSaveError,
  saveResonanceReflection,
} from "./save-reflection-client";

interface MirrorCardProps {
  prompt: ResonancePromptDTO;
  progressRatio: number;
}

type ReflectionStage = "early" | "middle" | "late";

function getReflectionStage(ratio: number): ReflectionStage {
  if (ratio <= 0.15) return "early";
  if (ratio <= 0.85) return "middle";
  return "late";
}

function getStageCopy(stage: ReflectionStage) {
  if (stage === "early") {
    return {
      placeholder: "Write what feels true for you...",
    };
  }

  if (stage === "middle") {
    return {
      placeholder: "What feels clearer for you here?",
    };
  }

  return {
    placeholder: "What feels true now that did not feel clear before?",
  };
}

function LoadingDots() {
  return (
    <span className="inline-flex items-center gap-1" aria-label="Saving reflection">
      <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-current [animation-delay:-0.2s]" />
      <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-current [animation-delay:-0.1s]" />
      <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-current" />
    </span>
  );
}

export default function MirrorCard({
  prompt,
  progressRatio,
}: MirrorCardProps) {
  const [saved, setSaved] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState("");
  const [text, setText] = useState(prompt.response ?? "");
  const router = useRouter();

  const copy = getStageCopy(getReflectionStage(progressRatio));

  async function handleSubmit(formData: FormData) {
    if (isSubmitting) return;

    const promptId = String(formData.get("promptId") ?? "");
    const response = String(formData.get("response") ?? "").trim();

    if (!response) {
      setSubmitError("Write a reflection before continuing.");
      return;
    }

    setIsSubmitting(true);
    setSubmitError("");

    try {
      const result = await saveResonanceReflection({ promptId, response });

      if (!result.ok) {
        setSubmitError(formatResonanceSaveError(result));
        return;
      }

      setSaved(true);
      router.refresh();
    } catch (error) {
      console.error("Resonance deeper reflection save request failed:", error);
      setSubmitError(
        "The save request could not reach Resonance. [CLIENT_NETWORK]",
      );
    } finally {
      setIsSubmitting(false);
    }
  }

  if (!prompt.isUnlocked) {
    return (
      <div className="res-border res-panel-soft rounded-3xl border px-6 py-6 opacity-65 backdrop-blur-[2px]">
        <p className="res-text-disabled select-none text-sm leading-7 blur-[2px]">
          {prompt.content}
        </p>
      </div>
    );
  }

  if (prompt.isCompleted && prompt.response) {
    return (
      <div className="res-accent-border res-panel space-y-5 rounded-3xl border px-6 py-6 shadow-[0_18px_70px_rgba(0,0,0,0.22)] backdrop-blur-[3px]">
        <div className="space-y-1">
          <p className="res-accent text-xs font-medium uppercase tracking-[0.25em]">
            Deeper reflection
          </p>
        </div>

        <p className="res-text-primary whitespace-pre-wrap text-base leading-8">
          {prompt.content}
        </p>

        <div className="res-border res-panel rounded-2xl border px-5 py-4">
          <p className="res-text-primary whitespace-pre-wrap text-base leading-8">
            {prompt.response}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="res-accent-border res-panel space-y-5 rounded-3xl border px-6 py-6 shadow-[0_18px_70px_rgba(0,0,0,0.22)] backdrop-blur-[3px]">
      <div className="space-y-1">
        <p className="res-accent text-xs font-medium uppercase tracking-[0.25em]">
          Deeper reflection
        </p>
      </div>

      <p className="res-text-primary whitespace-pre-wrap text-base leading-8">
        {prompt.content}
      </p>

      <form action={handleSubmit} className="space-y-4">
        <input type="hidden" name="promptId" value={prompt.id} />

        <textarea
          data-resonance-input="true"
          name="response"
          value={text}
          onChange={(event) => {
            setText(event.target.value);
            if (saved) setSaved(false);
            if (submitError) setSubmitError("");
          }}
          placeholder={copy.placeholder}
          rows={6}
          className="res-field w-full resize-none rounded-2xl border px-4 py-3 text-sm leading-7"
        />

        {submitError ? (
          <div
            aria-live="polite"
            className="res-error-panel rounded-2xl border px-4 py-3"
          >
            <p className="text-sm leading-6">{submitError}</p>
          </div>
        ) : null}

        <div className="flex justify-end">
          <button
            type="submit"
            disabled={!text.trim() || isSubmitting}
            className="res-action-soft inline-flex min-w-[130px] items-center justify-center rounded-xl border px-4 py-2 text-sm transition disabled:cursor-not-allowed disabled:opacity-40"
          >
            {isSubmitting ? <LoadingDots /> : saved ? "Saved" : "Save reflection"}
          </button>
        </div>
      </form>
    </div>
  );
}
