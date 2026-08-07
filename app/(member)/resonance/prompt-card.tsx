"use client";

import { useEffect, useRef, useState } from "react";

import type { ResonancePromptDTO } from "@/src/lib/resonance/getCurrentDayContent";
import { submitPromptAction } from "./actions";

interface PromptCardProps {
  prompt: ResonancePromptDTO;
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

export default function PromptCard({ prompt }: PromptCardProps) {
  const [showEdit, setShowEdit] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const incompleteCardRef = useRef<HTMLDivElement>(null);

  function handleSubmit(formData: FormData) {
    if (isSubmitting) return;

    setIsSubmitting(true);

    window.setTimeout(() => {
      void submitPromptAction(formData);
    }, 350);
  }

  useEffect(() => {
    if (prompt.isCompleted || !prompt.isUnlocked) return;

    const node = incompleteCardRef.current;
    if (!node) return;

    const timer = window.setTimeout(() => {
      node.scrollIntoView({
        behavior: "smooth",
        block: "center",
      });
    }, 150);

    return () => window.clearTimeout(timer);
  }, [prompt.isCompleted, prompt.isUnlocked, prompt.id]);

  if (!prompt.isUnlocked) {
    return (
      <div className="rounded-3xl border border-zinc-800 bg-black/40 px-6 py-6 opacity-75 backdrop-blur-[2px]">
        <p className="select-none text-sm leading-7 text-zinc-500 blur-[2px]">
          {prompt.content}
        </p>
      </div>
    );
  }

  if (!prompt.isCompleted) {
    return (
      <div
        ref={incompleteCardRef}
        className="space-y-5 rounded-3xl border border-zinc-700/80 bg-black/45 px-6 py-6 backdrop-blur-[2px]"
      >
        <p className="text-base leading-7 text-zinc-200">{prompt.content}</p>

        <form action={handleSubmit} className="space-y-4">
          <input type="hidden" name="promptId" value={prompt.id} />

          <textarea
            name="response"
            placeholder="Write what feels true for you..."
            rows={4}
            className="w-full resize-none rounded-2xl border border-zinc-800 bg-black/60 px-4 py-3 text-sm leading-7 text-zinc-200 placeholder:text-zinc-500 focus:outline-none focus:ring-1 focus:ring-zinc-700"
          />

          <div className="flex justify-end pt-1">
            <button
              type="submit"
              disabled={isSubmitting}
              className="min-w-[82px] rounded-xl bg-zinc-800 px-4 py-2 text-sm text-white transition-colors hover:bg-zinc-700 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {isSubmitting ? <LoadingDots /> : "Reflect"}
            </button>
          </div>
        </form>
      </div>
    );
  }

  return (
    <div className="space-y-5 rounded-3xl border border-amber-400/35 bg-gradient-to-br from-amber-400/[0.08] via-amber-400/[0.03] to-black/60 px-6 py-6 shadow-[0_0_0_1px_rgba(251,191,36,0.04)]">
      <p className="text-base leading-7 text-zinc-200">{prompt.content}</p>

      {showEdit ? (
        <form
          action={handleSubmit}
          onSubmit={() => setShowEdit(false)}
          className="space-y-4"
        >
          <input type="hidden" name="promptId" value={prompt.id} />

          <textarea
            name="response"
            defaultValue={prompt.response ?? ""}
            rows={4}
            className="w-full resize-none rounded-2xl border border-zinc-800 bg-zinc-950 px-4 py-3 text-sm leading-7 text-zinc-200 placeholder:text-zinc-500 focus:outline-none focus:ring-1 focus:ring-zinc-700"
          />

          <div className="flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={() => setShowEdit(false)}
              className="text-sm text-zinc-500 underline underline-offset-4 transition-colors hover:text-zinc-300"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="min-w-[90px] rounded-xl border border-amber-400/20 bg-amber-400/20 px-4 py-2 text-sm text-amber-100 transition-colors hover:bg-amber-400/25 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {isSubmitting ? <LoadingDots /> : "Save edit"}
            </button>
          </div>
        </form>
      ) : (
        <>
          <div className="rounded-2xl border border-amber-400/20 bg-black/40 px-4 py-4 backdrop-blur-[1px]">
            <p className="whitespace-pre-wrap text-sm leading-7 text-zinc-300">
              {prompt.response}
            </p>
          </div>

          <div className="flex justify-end">
            {prompt.canEdit ? (
              <button
                type="button"
                onClick={() => setShowEdit(true)}
                className="rounded-xl border border-amber-400/20 bg-amber-400/20 px-4 py-2 text-sm text-amber-100 transition-colors hover:bg-amber-400/25"
              >
                Edit reflection
              </button>
            ) : (
              <div className="rounded-xl border border-amber-400/20 bg-amber-400/20 px-4 py-2 text-sm text-amber-100">
                Completed
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}
