"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

import type { ResonancePromptDTO } from "@/src/lib/resonance/getCurrentDayContent";
import {
  formatResonanceSaveError,
  saveResonanceReflection,
} from "./save-reflection-client";

interface PromptCardProps {
  prompt: ResonancePromptDTO;
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

export default function PromptCard({ prompt }: PromptCardProps) {
  const router = useRouter();
  const [showEdit, setShowEdit] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState("");

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

      setShowEdit(false);
      router.refresh();
    } catch (error) {
      console.error("Resonance reflection save request failed:", error);
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

  if (!prompt.isCompleted) {
    return (
      <div className="res-border res-panel space-y-5 rounded-3xl border px-6 py-6 shadow-[0_18px_70px_rgba(0,0,0,0.24)] backdrop-blur-[3px]">
        <p className="res-text-primary text-base leading-7">{prompt.content}</p>

        <form action={handleSubmit} className="space-y-4">
          <input type="hidden" name="promptId" value={prompt.id} />

          <textarea
            data-resonance-input="true"
            name="response"
            placeholder="Write what feels true for you..."
            rows={4}
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

          <div className="flex justify-end pt-1">
            <button
              type="submit"
              disabled={isSubmitting}
              className="res-action-soft inline-flex min-w-[94px] items-center justify-center rounded-xl border px-4 py-2 text-sm transition disabled:cursor-not-allowed disabled:opacity-45"
            >
              {isSubmitting ? <LoadingDots /> : "Reflect"}
            </button>
          </div>
        </form>
      </div>
    );
  }

  return (
    <div className="res-accent-border res-panel space-y-5 rounded-3xl border px-6 py-6 shadow-[0_18px_70px_rgba(0,0,0,0.22)] backdrop-blur-[3px]">
      <p className="res-text-primary text-base leading-7">{prompt.content}</p>

      {showEdit ? (
        <form action={handleSubmit} className="space-y-4">
          <input type="hidden" name="promptId" value={prompt.id} />

          <textarea
            data-resonance-input="true"
            name="response"
            defaultValue={prompt.response ?? ""}
            rows={4}
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

          <div className="flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={() => {
                setShowEdit(false);
                setSubmitError("");
              }}
              className="res-text-secondary res-accent-hover text-sm underline underline-offset-4 transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="res-action-soft inline-flex min-w-[100px] items-center justify-center rounded-xl border px-4 py-2 text-sm transition disabled:cursor-not-allowed disabled:opacity-45"
            >
              {isSubmitting ? <LoadingDots /> : "Save edit"}
            </button>
          </div>
        </form>
      ) : (
        <>
          <div className="res-border res-panel rounded-2xl border px-4 py-4">
            <p className="res-text-primary whitespace-pre-wrap text-sm leading-7">
              {prompt.response}
            </p>
          </div>

          <div className="flex justify-end">
            {prompt.canEdit ? (
              <button
                type="button"
                onClick={() => {
                  setSubmitError("");
                  setShowEdit(true);
                }}
                className="res-action inline-flex rounded-xl border px-4 py-2 text-sm transition"
              >
                Edit reflection
              </button>
            ) : (
              <div className="res-accent res-accent-border rounded-full border px-3 py-1 text-xs uppercase tracking-[0.18em]">
                Completed
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}
