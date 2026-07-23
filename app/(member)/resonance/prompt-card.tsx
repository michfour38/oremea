"use client";

import { DayPromptDTO, PromptThreadDTO } from "./resonance.service";
import {
  submitPromptAction,
  toggleWitnessAction,
  toggleResonatedAction,
} from "./actions";
import AnalyzeBox from "./analyze-box";
import { useEffect, useRef, useState } from "react";

interface DiscoverReadinessSignal {
  eligible: boolean;
  score: number;
  reasons: string[];
  reflectionsCount: number;
}

interface PromptCardProps {
  prompt: DayPromptDTO;
  index: number;
  thread?: PromptThreadDTO | null;
  progressRatio?: number;
  discoverReadinessSignal?: DiscoverReadinessSignal | null;
  currentPathway?: "discover" | "relate" | null;
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

export default function PromptCard({
  prompt,
  index,
  thread,
  discoverReadinessSignal = null,
  currentPathway = null,
}: PromptCardProps) {
  const [showEditPrivate, setShowEditPrivate] = useState(false);
  const [showEditShared, setShowEditShared] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const incompleteCardRef = useRef<HTMLDivElement>(null);

  const pathway =
    currentPathway ??
    (prompt.isShared || Boolean(thread) ? "relate" : "discover");

  const isSharedDefault = pathway === "relate";

  const shouldShowOpenToOthersTrigger =
    pathway === "discover" &&
    prompt.isCompleted &&
    !prompt.isShared &&
    prompt.type === "thread_prompt" &&
    Boolean(prompt.response?.trim()) &&
    Boolean(discoverReadinessSignal?.eligible);

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
      <div className="space-y-3 rounded-3xl border border-zinc-800 bg-black/40 backdrop-blur-[2px] px-6 py-6 opacity-75">
        <p className="select-none text-sm leading-7 text-zinc-500 blur-[2px]">
          {prompt.content}
        </p>

        <p className="text-xs leading-6 text-zinc-500">
          You’ll begin to see more once you’ve completed the reflection before
          this one.
        </p>
      </div>
    );
  }

  if (!prompt.isCompleted) {
    return (
      <div
        ref={incompleteCardRef}
        className="space-y-5 rounded-3xl border border-zinc-700/80 bg-black/45 backdrop-blur-[2px] px-6 py-6"
      >
        <div className="space-y-3">
          <p className="text-base leading-7 text-zinc-200">{prompt.content}</p>
        </div>

        <form action={handleSubmit} className="space-y-4">
          <input type="hidden" name="promptId" value={prompt.id} />
          <input
            type="hidden"
            name="isShared"
            value={isSharedDefault ? "true" : "false"}
          />

          <textarea
            name="response"
            placeholder="Write what feels true for you..."
            rows={4}
            className="w-full resize-none rounded-2xl border border-zinc-800 bg-black/60 backdrop-blur-[1px] px-4 py-3 text-sm leading-7 text-zinc-200 placeholder:text-zinc-500 focus:outline-none focus:ring-1 focus:ring-zinc-700"
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

  if (pathway === "discover") {
    return (
      <div className="space-y-5 rounded-3xl border border-amber-400/35 bg-gradient-to-br from-amber-400/[0.08] via-amber-400/[0.03] to-black/60 px-6 py-6 shadow-[0_0_0_1px_rgba(251,191,36,0.04)]">
        <div className="space-y-3">
          <p className="text-base leading-7 text-zinc-200">{prompt.content}</p>
        </div>

        <div className="rounded-2xl border border-amber-400/20 bg-black/40 backdrop-blur-[1px] px-4 py-4">
          <p className="whitespace-pre-wrap text-sm leading-7 text-zinc-300">
            {prompt.response}
          </p>
        </div>

        {shouldShowOpenToOthersTrigger ? (
          <div className="space-y-3 rounded-2xl border border-amber-300/20 bg-amber-400/[0.06] px-4 py-4">
            <p className="text-sm leading-6 text-zinc-300">
              Something within you may be ready to be witnessed.
            </p>

            <div className="flex justify-end">
              <form action={handleSubmit}>
                <input type="hidden" name="promptId" value={prompt.id} />
                <input type="hidden" name="response" value={prompt.response ?? ""} />
                <input type="hidden" name="isShared" value="true" />
                <input
                  type="hidden"
                  name="pathwayTransition"
                  value="discover_to_relate"
                />

                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="min-w-[130px] rounded-xl border border-amber-300/25 bg-amber-400/15 px-4 py-2 text-sm text-amber-100 transition-colors hover:bg-amber-400/22 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {isSubmitting ? (
                    <LoadingDots />
                  ) : prompt.isShared ? (
                    "Now seen"
                  ) : (
                    "Let yourself be seen"
                  )}
                </button>
              </form>
            </div>
          </div>
        ) : null}

        {prompt.canEdit ? (
          showEditPrivate ? (
            <form
              action={handleSubmit}
              onSubmit={() => setShowEditPrivate(false)}
              className="space-y-4"
            >
              <input type="hidden" name="promptId" value={prompt.id} />
              <input
                type="hidden"
                name="isShared"
                value={prompt.isShared ? "true" : "false"}
              />

              <div className="space-y-3 rounded-2xl border border-zinc-800 bg-black/40 backdrop-blur-[1px]/70 px-4 py-4">
                <textarea
                  name="response"
                  defaultValue={prompt.response ?? ""}
                  rows={4}
                  className="w-full resize-none rounded-2xl border border-zinc-800 bg-zinc-950 px-4 py-3 text-sm leading-7 text-zinc-200 placeholder:text-zinc-500 focus:outline-none focus:ring-1 focus:ring-zinc-700"
                />

                <div className="flex items-center justify-end gap-3">
                  <button
                    type="button"
                    onClick={() => setShowEditPrivate(false)}
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
              </div>
            </form>
          ) : (
            <div className="flex justify-end">
              <button
                type="button"
                onClick={() => setShowEditPrivate(true)}
                className="rounded-xl border border-amber-400/20 bg-amber-400/20 px-4 py-2 text-sm text-amber-100 transition-colors hover:bg-amber-400/25"
              >
                Edit reflection
              </button>
            </div>
          )
        ) : (
          <div className="flex justify-end">
            <div className="rounded-xl border border-amber-400/20 bg-amber-400/20 px-4 py-2 text-sm text-amber-100">
              Completed
            </div>
          </div>
        )}
      </div>
    );
  }

  const myResponseText = thread?.myResponse.response ?? prompt.response ?? "";

  return (
    <div className="space-y-6 rounded-3xl border border-amber-400/35 bg-gradient-to-br from-amber-400/[0.08] via-amber-400/[0.03] to-zinc-900 px-6 py-6 shadow-[0_0_0_1px_rgba(251,191,36,0.04)]">
      <div className="space-y-3">
        <p className="text-base leading-7 text-zinc-200">{prompt.content}</p>
      </div>

      <div className="rounded-2xl border border-amber-400/20 bg-black/35 px-4 py-4">
        <p className="whitespace-pre-wrap text-sm leading-7 text-zinc-300">
          {myResponseText}
        </p>
      </div>

      {prompt.canEdit &&
        (showEditShared ? (
          <form
            action={handleSubmit}
            onSubmit={() => setShowEditShared(false)}
            className="space-y-4"
          >
            <input type="hidden" name="promptId" value={prompt.id} />
            <input
              type="hidden"
              name="isShared"
              value={prompt.isShared ? "true" : "false"}
            />

            <div className="space-y-3 rounded-2xl border border-zinc-800 bg-zinc-950/70 px-4 py-4">
              <textarea
                name="response"
                defaultValue={myResponseText}
                rows={4}
                className="w-full resize-none rounded-2xl border border-zinc-800 bg-zinc-950 px-4 py-3 text-sm leading-7 text-zinc-200 placeholder:text-zinc-500 focus:outline-none focus:ring-1 focus:ring-zinc-700"
              />
              <div className="flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setShowEditShared(false)}
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
            </div>
          </form>
        ) : (
          <div className="flex justify-end">
            <button
              type="button"
              onClick={() => setShowEditShared(true)}
              className="rounded-xl border border-amber-400/20 bg-amber-400/20 px-4 py-2 text-sm text-amber-100 transition-colors hover:bg-amber-400/25"
            >
              Edit reflection
            </button>
          </div>
        ))}

      <div className="border-t border-zinc-800/80 pt-5">
        {thread && thread.groupResponses.length > 0 ? (
          <div className="space-y-5">
            <div className="space-y-1">
              <p className="text-[11px] uppercase tracking-[0.18em] text-zinc-500">
                Others
              </p>
              <p className="text-xs leading-6 text-zinc-500">
                Stay with what reaches you. Use reactions for acknowledgment and
                Analyze for depth.
              </p>
            </div>

            <div className="space-y-5">
              {thread.groupResponses.map((r) => (
                <div key={r.completionId} className="space-y-3">
                  <div className="rounded-2xl border border-zinc-800 bg-zinc-950 px-4 py-4">
                    <p className="whitespace-pre-wrap text-sm leading-7 text-zinc-300">
                      {r.response}
                    </p>
                  </div>

                  <div className="flex flex-wrap items-center gap-3 pl-1 text-xs">
                    <form action={toggleWitnessAction}>
                      <input
                        type="hidden"
                        name="completionId"
                        value={r.completionId}
                      />
                      <button
                        type="submit"
                        className={`rounded-full border px-3 py-1.5 transition-colors ${
                          r.reactions.myWitness
                            ? "border-amber-400/30 bg-amber-400/10 text-amber-200"
                            : "border-zinc-800 bg-transparent text-zinc-500 hover:border-zinc-700 hover:text-zinc-300"
                        }`}
                      >
                        Seen {r.reactions.witnessCount}
                      </button>
                    </form>

                    <form action={toggleResonatedAction}>
                      <input
                        type="hidden"
                        name="completionId"
                        value={r.completionId}
                      />
                      <button
                        type="submit"
                        className={`rounded-full border px-3 py-1.5 transition-colors ${
                          r.reactions.myResonated
                            ? "border-amber-400/30 bg-amber-400/10 text-amber-200"
                            : "border-zinc-800 bg-transparent text-zinc-500 hover:border-zinc-700 hover:text-zinc-300"
                        }`}
                      >
                        Felt {r.reactions.resonatedCount}
                      </button>
                    </form>

                    <AnalyzeBox
                      completionId={r.completionId}
                      analysisId={r.analysisSummary.myAnalysis?.id ?? null}
                      existingAnalysis={r.analysisSummary.myAnalysis?.content ?? null}
                      status={r.analysisSummary.myAnalysis?.status ?? null}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
        ) : (
          <div className="rounded-2xl border border-dashed border-zinc-700 bg-zinc-900/40 px-4 py-4">
            <p className="text-sm text-zinc-400">This space is opening.</p>
            <p className="mt-2 text-sm leading-6 text-zinc-500">
              Other reflections will begin to appear here as more people move
              through today’s prompt.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}