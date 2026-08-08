"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

import type { ResonancePromptDTO } from "@/src/lib/resonance/getCurrentDayContent";
import { submitPromptAction } from "./actions";

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
      helper: "A private space to stay a little longer with what is here.",
      placeholder: "Write what feels true for you...",
    };
  }

  if (stage === "middle") {
    return {
      helper: "A private space to notice what is becoming clearer.",
      placeholder: "What feels clearer for you here?",
    };
  }

  return {
    helper: "A private space for what has begun to take shape.",
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

    setIsSubmitting(true);
    setSubmitError("");

    try {
      const result = await submitPromptAction(formData);

      if (!result?.ok) {
        setSubmitError(result?.error ?? "This reflection could not be saved.");
        return;
      }

      setSaved(true);
      router.refresh();
    } catch (error) {
      console.error("Resonance deeper reflection save failed:", error);
      setSubmitError(
        "This reflection could not be saved. Please submit it again.",
      );
    } finally {
      setIsSubmitting(false);
    }
  }

  if (prompt.isCompleted && prompt.response) {
    return (
      <div className="space-y-5 rounded-3xl border border-[#C8A96A]/30 bg-black/50 px-6 py-6 shadow-[0_18px_70px_rgba(0,0,0,0.22)] backdrop-blur-[3px]">
        <div className="space-y-1">
          <p className="text-xs font-medium uppercase tracking-[0.25em] text-[#C8A96A]">
            Deeper reflection
          </p>
          <p className="text-xs leading-6 text-zinc-400">{copy.helper}</p>
        </div>

        <p className="whitespace-pre-wrap text-base leading-8 text-zinc-200">
          {prompt.content}
        </p>

        <div className="rounded-2xl border border-zinc-800 bg-black/55 px-5 py-4">
          <p className="whitespace-pre-wrap text-base leading-8 text-zinc-300">
            {prompt.response}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-5 rounded-3xl border border-[#C8A96A]/30 bg-black/50 px-6 py-6 shadow-[0_18px_70px_rgba(0,0,0,0.22)] backdrop-blur-[3px]">
      <div className="space-y-1">
        <p className="text-xs font-medium uppercase tracking-[0.25em] text-[#C8A96A]">
          Deeper reflection
        </p>
        <p className="text-xs leading-6 text-zinc-400">{copy.helper}</p>
      </div>

      <p className="whitespace-pre-wrap text-base leading-8 text-zinc-200">
        {prompt.content}
      </p>

      <form action={handleSubmit} className="space-y-4">
        <input type="hidden" name="promptId" value={prompt.id} />

        <textarea
          name="response"
          value={text}
          onChange={(event) => {
            setText(event.target.value);
            if (saved) setSaved(false);
            if (submitError) setSubmitError("");
          }}
          placeholder={copy.placeholder}
          rows={6}
          className="w-full resize-none rounded-2xl border border-zinc-700 bg-black/70 px-4 py-3 text-sm leading-7 text-zinc-100 placeholder:text-zinc-500 focus:border-[#C8A96A]/65 focus:outline-none focus:ring-1 focus:ring-[#C8A96A]/35"
        />

        {submitError ? (
          <div
            aria-live="polite"
            className="rounded-2xl border border-red-400/25 bg-red-950/20 px-4 py-3"
          >
            <p className="text-sm leading-6 text-red-300">{submitError}</p>
          </div>
        ) : null}

        <div className="flex justify-end">
          <button
            type="submit"
            disabled={!text.trim() || isSubmitting}
            className="inline-flex min-w-[130px] items-center justify-center rounded-xl border border-[#C8A96A]/55 bg-[#C8A96A]/15 px-4 py-2 text-sm text-[#C8A96A] transition hover:bg-[#C8A96A]/20 disabled:cursor-not-allowed disabled:opacity-40"
          >
            {isSubmitting ? <LoadingDots /> : saved ? "Saved" : "Save reflection"}
          </button>
        </div>
      </form>
    </div>
  );
}
