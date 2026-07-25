"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

import { DayPromptDTO } from "./resonance.service";
import { submitPromptAction } from "./actions";

interface MirrorCardProps {
  prompt: DayPromptDTO;
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
    <span className="inline-flex items-center gap-1">
      <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-current [animation-delay:-0.2s]" />
      <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-current [animation-delay:-0.1s]" />
      <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-current" />
    </span>
  );
}

function getProgressStyles(ratio: number) {
  if (ratio <= 0.15) {
    return {
      outer:
        "border-zinc-700 bg-gradient-to-br from-zinc-900 via-zinc-950 to-zinc-950 shadow-[0_0_0_1px_rgba(161,161,170,0.08)]",
      inner: "border-zinc-700 bg-black/35 text-zinc-100",
      ring: "focus:ring-zinc-600",
      saveButton:
        "border border-zinc-700 bg-zinc-800 text-zinc-100 hover:bg-zinc-700",
    };
  }

  if (ratio <= 0.6) {
    return {
      outer:
        "border-zinc-600 bg-gradient-to-br from-zinc-900 via-zinc-950 to-green-400/[0.06] shadow-[0_0_0_1px_rgba(34,197,94,0.08)]",
      inner: "border-green-400/15 bg-black/35 text-zinc-100",
      ring: "focus:ring-green-400/15",
      saveButton:
        "border border-green-400/18 bg-green-400/10 text-green-200 hover:bg-green-400/14",
    };
  }

  if (ratio <= 0.85) {
    return {
      outer:
        "border-green-400/22 bg-gradient-to-br from-zinc-900 via-green-400/[0.07] to-zinc-950 shadow-[0_0_0_1px_rgba(34,197,94,0.10)]",
      inner: "border-green-400/18 bg-black/35 text-zinc-100",
      ring: "focus:ring-green-400/18",
      saveButton:
        "border border-green-400/20 bg-green-400/12 text-green-200 hover:bg-green-400/16",
    };
  }

  return {
    outer:
      "border-amber-300/35 bg-gradient-to-br from-amber-400/[0.08] via-amber-400/[0.03] to-zinc-900 shadow-[0_0_0_1px_rgba(198,168,91,0.10)]",
    inner: "border-amber-400/20 bg-black/35 text-zinc-100",
    ring: "focus:ring-amber-400/20",
    saveButton:
      "border border-amber-300/30 bg-amber-400/20 text-amber-100 hover:bg-amber-400/20",
  };
}

export default function MirrorCard({
  prompt,
  progressRatio,
}: MirrorCardProps) {
  const [saved, setSaved] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [text, setText] = useState(prompt.response ?? "");
  const router = useRouter();

  const styles = getProgressStyles(progressRatio);
  const copy = getStageCopy(getReflectionStage(progressRatio));

  function handleSubmit(formData: FormData) {
    if (isSubmitting) return;

    setIsSubmitting(true);

    window.setTimeout(async () => {
      await submitPromptAction(formData);
      setSaved(true);
      router.refresh();
    }, 350);
  }

  if (prompt.isCompleted && prompt.response) {
    return (
      <div
        className={`space-y-5 rounded-3xl border px-6 py-6 transition-colors duration-500 ${styles.outer}`}
      >
        <div className="space-y-1">
          <p className="text-xs font-medium uppercase tracking-[0.25em] text-zinc-500">
            Deeper reflection
          </p>
          <p className="text-xs text-zinc-500">{copy.helper}</p>
        </div>

        <p className="whitespace-pre-wrap text-base leading-8 text-zinc-300">
          {prompt.content}
        </p>

        <div
          className={`rounded-2xl border px-5 py-4 transition-colors duration-500 ${styles.inner}`}
        >
          <p className="whitespace-pre-wrap text-base leading-8">
            {prompt.response}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div
      className={`space-y-5 rounded-3xl border px-6 py-6 transition-colors duration-500 ${styles.outer}`}
    >
      <div className="space-y-1">
        <p className="text-xs font-medium uppercase tracking-[0.25em] text-zinc-500">
          Deeper reflection
        </p>
        <p className="text-xs text-zinc-500">{copy.helper}</p>
      </div>

      <p className="whitespace-pre-wrap text-base leading-8 text-zinc-300">
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
          }}
          placeholder={copy.placeholder}
          rows={6}
          className={`w-full resize-none rounded-2xl border px-4 py-3 text-sm leading-7 text-zinc-200 placeholder:text-zinc-500 focus:outline-none focus:ring-1 transition-colors duration-500 ${styles.inner} ${styles.ring}`}
        />

        <div className="flex items-center gap-3">
          <button
            type="submit"
            disabled={!text.trim() || isSubmitting}
            className={`rounded-xl px-4 py-2 text-sm transition-colors duration-300 disabled:cursor-not-allowed disabled:opacity-30 ${styles.saveButton}`}
          >
            {isSubmitting ? <LoadingDots /> : saved ? "Saved" : "Save reflection"}
          </button>
        </div>
      </form>
    </div>
  );
}
