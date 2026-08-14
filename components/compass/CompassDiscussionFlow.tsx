"use client";

import { useEffect, useMemo, useState } from "react";

import type { CompassDiscussionMessage } from "@/src/lib/compass/session";
import type {
  CompassEndingState,
  CompassMapItem,
} from "@/src/lib/compass/ending/ending-types";

import { CompassCard } from "./CompassCard";

const BODY_TEXT = "text-zinc-400";

const AREA_LABELS: Record<string, string> = {
  relationships: "Relationships",
  income: "Income",
  health: "Health",
  spirituality: "Spirituality",
  investments: "Investments",
  network: "Network",
  knowledge: "Knowledge",
  lifestyle: "Lifestyle",
};

type EndingResponse = {
  state: CompassEndingState | null;
  boundaryMessage?: string | null;
  error?: string;
};

type LocalEndingQuestion = {
  afterMessageCount: number;
  content: string;
};

type FinalizationStage =
  | "idle"
  | "resolution"
  | "execution"
  | "confirm"
  | "saved";

function ThinkingDots() {
  const delays = ["0ms", "180ms", "360ms"];

  return (
    <span className="inline-flex h-7 items-center gap-2" aria-hidden="true">
      {delays.map((delay) => (
        <span
          key={delay}
          className="h-3 w-3 animate-bounce rounded-full bg-[#d8b15f] motion-reduce:animate-pulse"
          style={{ animationDelay: delay, animationDuration: "900ms" }}
        />
      ))}
    </span>
  );
}

function MapThinkingIndicator() {
  return (
    <div
      className="flex items-center rounded-2xl border border-zinc-800 p-5 text-sm text-zinc-300"
      aria-live="polite"
    >
      <span>Holding the pieces together</span>
      <span className="ml-3">
        <ThinkingDots />
      </span>
    </div>
  );
}

function DiscussionThinkingIndicator() {
  return (
    <div
      className="flex min-h-10 items-center"
      role="status"
      aria-live="polite"
      aria-label="Compass is working"
    >
      <ThinkingDots />
    </div>
  );
}

export function CompassDiscussionFlow({
  discussionMessages,
  discussionInput,
  onDiscussionInputChange,
  onSend,
}: {
  discussionMessages: CompassDiscussionMessage[];
  discussionInput: string;
  onDiscussionInputChange: (value: string) => void;
  onSend: () => void;
  onReady: (movementInstruction?: string) => void;
  onAppendCompassMessage?: (content: string) => void;
}) {
  const [view, setView] = useState<"discussion" | "map">("discussion");
  const [endingState, setEndingState] = useState<CompassEndingState | null>(null);
  const [boundaryMessage, setBoundaryMessage] = useState<string | null>(null);
  const [endingBusy, setEndingBusy] = useState(false);
  const [endingError, setEndingError] = useState("");
  const [localEndingQuestions, setLocalEndingQuestions] = useState<
    LocalEndingQuestion[]
  >([]);
  const [finalizationStage, setFinalizationStage] =
    useState<FinalizationStage>("idle");
  const [resolutionDraft, setResolutionDraft] = useState("");
  const [finalDraft, setFinalDraft] = useState("");
  const [finishingDiscussion, setFinishingDiscussion] = useState(false);
  const [finishDiscussionError, setFinishDiscussionError] = useState("");

  const currentMovement = useMemo(() => {
    if (!endingState?.currentMovementId) return null;
    return (
      endingState.movements.find(
        (movement) => movement.id === endingState.currentMovementId,
      ) ?? null
    );
  }, [endingState]);

  const activeMapItems = useMemo(
    () =>
      endingState?.mapItems.filter(
        (item) => item.status === "active" || item.status === "waiting",
      ) ?? [],
    [endingState],
  );

  const displayMessages = useMemo(() => {
    const output: Array<CompassDiscussionMessage & { localKey?: string }> = [];

    for (let index = 0; index <= discussionMessages.length; index += 1) {
      localEndingQuestions
        .filter((question) => question.afterMessageCount === index)
        .forEach((question, questionIndex) => {
          output.push({
            role: "compass",
            content: question.content,
            localKey: `ending-${index}-${questionIndex}-${question.content}`,
          });
        });

      if (index < discussionMessages.length) {
        output.push(discussionMessages[index]);
      }
    }

    return output;
  }, [discussionMessages, localEndingQuestions]);

  useEffect(() => {
    void loadEnding();
  }, []);

  useEffect(() => {
    const latest = discussionMessages[discussionMessages.length - 1];
    if (!latest || latest.content === "...") return;
    void loadEnding();
  }, [discussionMessages]);

  useEffect(() => {
    const storedResolution = endingState?.resolutionCandidate?.trim();
    if (storedResolution && endingState?.resolutionConfirmed) {
      setResolutionDraft(storedResolution);
    }
  }, [
    endingState?.resolutionCandidate,
    endingState?.resolutionConfirmed,
  ]);

  useEffect(() => {
    function handleMapReordered(event: Event) {
      const state = (
        event as CustomEvent<CompassEndingState | null>
      ).detail;

      if (!state) return;

      setEndingState(state);
      setBoundaryMessage(null);
      setEndingError("");
      setView("map");
    }

    window.addEventListener(
      "compass-map-reordered",
      handleMapReordered,
    );

    return () => {
      window.removeEventListener(
        "compass-map-reordered",
        handleMapReordered,
      );
    };
  }, []);

  async function loadEnding() {
    try {
      const response = await fetch("/api/compass/ending", {
        method: "GET",
        cache: "no-store",
      });

      if (!response.ok) return;
      const data = (await response.json()) as EndingResponse;
      setEndingState(data.state ?? null);
      setBoundaryMessage(data.boundaryMessage ?? null);
    } catch {
      // Discussion remains usable even if the Map cannot load.
    }
  }

  async function runEndingAction(
    action: string,
    extra: Record<string, unknown> = {},
  ): Promise<CompassEndingState | null> {
    setEndingBusy(true);
    setEndingError("");

    try {
      const currentDiscussion = discussionMessages.filter(
        (message) => message.content.trim() && message.content !== "...",
      );
      const response = await fetch("/api/compass/ending", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          action,
          discussionMessages: currentDiscussion,
          ...extra,
        }),
      });

      const data = (await response.json().catch(() => null)) as
        | EndingResponse
        | null;

      if (!response.ok) {
        setEndingError(
          data?.error ??
            "Compass could not build the Map from this discussion yet.",
        );
        return null;
      }

      setEndingError("");
      setEndingState(data?.state ?? null);
      setBoundaryMessage(data?.boundaryMessage ?? null);
      window.dispatchEvent(new Event("compass-map-changed"));
      return data?.state ?? null;
    } catch {
      setEndingError("Compass could not update the Map yet.");
      return null;
    } finally {
      setEndingBusy(false);
    }
  }

  function appendEndingQuestion(state: CompassEndingState) {
    const question = state.followUpQuestion?.trim();
    if (!question) return;

    const latest = discussionMessages[discussionMessages.length - 1];
    if (latest?.role === "compass" && latest.content.trim() === question) return;

    setLocalEndingQuestions((current) => {
      if (current.some((item) => item.content === question)) return current;
      return [
        ...current,
        {
          afterMessageCount: discussionMessages.length,
          content: question,
        },
      ];
    });
  }

  async function openMap() {
    if (endingBusy) return;

    setView("map");

    const needsRefresh =
      !endingState ||
      endingState.mapItems.length === 0 ||
      endingState.discussionCount !== discussionMessages.length;

    if (needsRefresh && !boundaryMessage) {
      await runEndingAction("refresh_map");
    }
  }

  async function prepareResolution() {
    const state = await runEndingAction("prepare_resolution");

    if (!state) return;

    if (state.scopeCategory !== "in_scope") {
      setView("discussion");
      return;
    }

    if (state.resolutionCandidate) {
      setResolutionDraft(state.resolutionCandidate);
      setFinalizationStage("resolution");
      return;
    }

    appendEndingQuestion(state);
    setView("discussion");
  }

  async function confirmResolution() {
    const resolutionText = resolutionDraft.trim();
    if (!resolutionText || endingBusy) return;

    const confirmedState = await runEndingAction("confirm_resolution", {
      resolutionText,
    });
    if (!confirmedState?.resolutionConfirmed) return;

    setResolutionDraft(resolutionText);

    const movementState = await runEndingAction("make_workable");
    if (!movementState) return;

    const movement = movementState.movements.find(
      (item) => item.id === movementState.currentMovementId,
    );

    if (!movement) {
      appendEndingQuestion(movementState);
      setFinalizationStage("idle");
      setView("discussion");
      return;
    }

    setFinalDraft(movement.instruction);
    setFinalizationStage("execution");
  }

  function continueResolutionDiscussion(question: string) {
    setLocalEndingQuestions((current) => [
      ...current,
      {
        afterMessageCount: discussionMessages.length,
        content: question,
      },
    ]);
    setFinalizationStage("idle");
    setView("discussion");
  }

  async function completeMapItem(item: CompassMapItem) {
    await runEndingAction("complete_item", { itemId: item.id });
  }

  async function releaseMapItem(item: CompassMapItem) {
    await runEndingAction("release_item", { itemId: item.id });
  }

  async function editMapItem(item: CompassMapItem) {
    const next = window.prompt("Edit this Map item", item.content)?.trim();
    if (!next || next === item.content) return;
    await runEndingAction("edit_item", { itemId: item.id, content: next });
  }

  async function completeMovement() {
    const state = await runEndingAction("complete_movement");
    if (!state) return;
    appendEndingQuestion(state);
    setView("discussion");
  }

  async function movementFeedback(
    feedback: "easier" | "blocked" | "wrong",
  ) {
    const state = await runEndingAction("movement_feedback", { feedback });
    if (!state) return;
    appendEndingQuestion(state);
    setView("discussion");
  }

  function beginFinalization(movementInstruction: string) {
    setFinalDraft(movementInstruction);
    setEndingError("");
    setFinalizationStage("execution");
  }

  function confirmFinalDraft() {
    if (!finalDraft.trim()) return;
    setFinalDraft(finalDraft.trim());
    setFinalizationStage("confirm");
  }

  async function finishDiscussion() {
    if (finishingDiscussion) return;

    setFinishingDiscussion(true);
    setFinishDiscussionError("");

    try {
      const response = await fetch("/api/compass/session", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          phase: "discussion",
          discussionMessages,
        }),
      });

      if (!response.ok) {
        setFinishDiscussionError(
          "Compass could not finish this discussion yet.",
        );
        return;
      }

      window.location.assign("https://www.oremea.com");
    } catch {
      setFinishDiscussionError(
        "Compass could not finish this discussion yet.",
      );
    } finally {
      setFinishingDiscussion(false);
    }
  }

  async function finishCompass() {
    const movementInstruction = finalDraft.trim();
    if (!movementInstruction) return;

    setEndingBusy(true);
    setEndingError("");

    try {
      const response = await fetch("/api/compass/session", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          phase: "complete",
          discussionMessages,
          finalStep: movementInstruction,
        }),
      });

      if (!response.ok) {
        setEndingError("Compass could not close this run yet.");
        return;
      }

      setFinalizationStage("saved");
    } catch {
      setEndingError("Compass could not close this run yet.");
    } finally {
      setEndingBusy(false);
    }
  }

  function jumpToDiscussion(item: CompassMapItem) {
    if (item.sourceMessageIndex == null) return;
    setView("discussion");

    window.setTimeout(() => {
      document
        .getElementById(`compass-discussion-${item.sourceMessageIndex}`)
        ?.scrollIntoView({ behavior: "smooth", block: "center" });
    }, 50);
  }

  const startingAreaLabel = endingState?.selectedArea
    ? AREA_LABELS[endingState.selectedArea] ?? endingState.selectedArea
    : null;

  const discussionBlocked = Boolean(
    boundaryMessage && endingState?.scopeCategory !== "in_scope",
  );

  const canMakeWorkable = Boolean(
    !discussionBlocked &&
      endingState?.movementReady &&
      !discussionInput.trim() &&
      !endingBusy,
  );

  if (finalizationStage === "resolution") {
    return (
      <CompassCard
        title="What has been resolved?"
        description="Compass is reflecting the conclusion it heard. Correct the wording until it says what you have actually decided, accepted, released, deferred, or deliberately left open."
      >
        <textarea
          value={resolutionDraft}
          onChange={(event) => setResolutionDraft(event.target.value)}
          rows={7}
          className="compass-textarea"
        />

        <button
          type="button"
          onClick={() => void confirmResolution()}
          disabled={!resolutionDraft.trim() || endingBusy}
          className="primary-button disabled:cursor-wait disabled:opacity-60"
        >
          {endingBusy ? "Saving resolution..." : "Yes, this is the resolution"}
        </button>

        <button
          type="button"
          onClick={() =>
            continueResolutionDiscussion("What is missing from that resolution?")
          }
          disabled={endingBusy}
          className="secondary-button disabled:opacity-60"
        >
          Something is missing
        </button>

        <button
          type="button"
          onClick={() =>
            continueResolutionDiscussion("What would state the resolution accurately?")
          }
          disabled={endingBusy}
          className="secondary-button disabled:opacity-60"
        >
          That isn&apos;t what I mean
        </button>

        <button
          type="button"
          onClick={() => continueResolutionDiscussion("What still needs resolving?")}
          disabled={endingBusy}
          className="secondary-button disabled:opacity-60"
        >
          Continue the discussion
        </button>

        {endingError ? (
          <p className="text-sm leading-6 text-amber-200/80">{endingError}</p>
        ) : null}
      </CompassCard>
    );
  }

  if (finalizationStage === "execution") {
    return (
      <CompassExecutionCheck
        resolutionText={resolutionDraft}
        executionFeeling={finalDraft}
        onExecutionFeelingChange={setFinalDraft}
        onFinalize={confirmFinalDraft}
      />
    );
  }

  if (finalizationStage === "confirm") {
    return (
      <CompassCard
        title="Choose this movement?"
        description="The resolution is agreed. Confirm the exact movement that follows from it."
      >
        <div className="rounded-[1.5rem] border border-zinc-800 bg-[#121212] p-5">
          <p className="text-xs uppercase tracking-[0.18em] text-[#d8b15f]">
            Resolved
          </p>
          <p className="mt-3 whitespace-pre-line text-sm leading-7 text-zinc-300">
            {resolutionDraft}
          </p>
        </div>

        <div className="rounded-[1.5rem] border border-[#3A3224] bg-[#17130D] p-5 text-sm leading-relaxed whitespace-pre-line text-zinc-300">
          {finalDraft}
        </div>

        <button
          type="button"
          onClick={() => void finishCompass()}
          disabled={endingBusy}
          className="primary-button disabled:cursor-wait disabled:opacity-60"
        >
          {endingBusy ? "Saving movement..." : "Choose and save this movement"}
        </button>

        <button
          type="button"
          onClick={() => setFinalizationStage("execution")}
          disabled={endingBusy}
          className="secondary-button disabled:opacity-60"
        >
          Edit movement
        </button>

        {endingError ? (
          <p className="text-sm leading-6 text-amber-200/80">{endingError}</p>
        ) : null}
      </CompassCard>
    );
  }

  if (finalizationStage === "saved") {
    return (
      <CompassCard
        title="Compass is complete"
        description="The resolution and chosen movement are saved."
      >
        <section className="rounded-[1.5rem] border border-zinc-800 bg-[#121212] p-5">
          <p className="text-xs uppercase tracking-[0.18em] text-[#d8b15f]">
            Resolution saved
          </p>
          <p className="mt-3 whitespace-pre-line text-sm leading-7 text-zinc-300">
            {resolutionDraft}
          </p>
        </section>

        <section className="rounded-[1.5rem] border border-[#3A3224] bg-[#17130D] p-5">
          <p className="text-xs uppercase tracking-[0.18em] text-[#d8b15f]">
            Movement saved
          </p>
          <p className="mt-3 whitespace-pre-line text-sm leading-7 text-zinc-300">
            {finalDraft}
          </p>
        </section>

        <button
          type="button"
          onClick={() => window.location.assign("https://www.oremea.com")}
          className="primary-button"
        >
          Return to Oremea
        </button>
      </CompassCard>
    );
  }

  return (
    <CompassCard
      title={view === "discussion" ? "Discussion" : "Map"}
      description={
        view === "discussion"
          ? "Stay with what has become visible. Compass will hold what you have already named while you clarify what has your attention now."
          : "Compass is holding the goals, dependencies, decisions, and other things already asking for your attention. You only need to carry the movement in front of you."
      }
    >
      <div
        role="tablist"
        aria-label="Compass workspace"
        className="grid grid-cols-2 rounded-full border border-zinc-800 bg-[#101010] p-1"
      >
        <button
          type="button"
          role="tab"
          aria-selected={view === "discussion"}
          onClick={() => setView("discussion")}
          className={`rounded-full px-4 py-2 text-sm transition ${
            view === "discussion"
              ? "bg-[#21190F] text-[#E7C98B]"
              : "text-zinc-500 hover:text-zinc-300"
          }`}
        >
          Discussion
        </button>
        <button
          type="button"
          role="tab"
          aria-selected={view === "map"}
          onClick={() => void openMap()}
          className={`rounded-full px-4 py-2 text-sm transition ${
            view === "map"
              ? "bg-[#21190F] text-[#E7C98B]"
              : "text-zinc-500 hover:text-zinc-300"
          }`}
        >
          Map{activeMapItems.length > 0 ? ` · ${activeMapItems.length}` : ""}
        </button>
      </div>

      {boundaryMessage ? (
        <div className="rounded-[1.4rem] border border-[#6B4035] bg-[#1A1110] p-5 text-sm leading-relaxed text-zinc-200">
          {boundaryMessage}
        </div>
      ) : null}

      {view === "discussion" ? (
        <>
          <div className="space-y-4">
            {displayMessages.map((message, index) => (
              <div
                id={`compass-discussion-${index}`}
                key={message.localKey ?? `${message.role}-${index}`}
                className={`rounded-[1.4rem] p-5 text-sm leading-relaxed ${
                  message.role === "compass"
                    ? "bg-[#12100D]"
                    : "bg-[#121212] text-zinc-100"
                }`}
              >
                {message.role === "compass" && message.content === "..." ? (
                  <DiscussionThinkingIndicator />
                ) : (
                  <p
                    className={`whitespace-pre-line ${
                      message.role === "compass" ? BODY_TEXT : "text-zinc-100"
                    }`}
                  >
                    {message.content}
                  </p>
                )}
              </div>
            ))}
          </div>

          {!discussionBlocked ? (
            <>
              <textarea
                value={discussionInput}
                onChange={(event) => onDiscussionInputChange(event.target.value)}
                placeholder="Reply naturally. Add context, disagree, correct Compass, or explain what actually happens."
                rows={7}
                className="compass-textarea mt-5"
              />

              <button onClick={onSend} className="primary-button">
                Continue discussion
              </button>

              <button
                type="button"
                onClick={() => void finishDiscussion()}
                disabled={finishingDiscussion}
                className="secondary-button disabled:cursor-wait disabled:opacity-60"
              >
                {finishingDiscussion
                  ? "Saving discussion..."
                  : "Pause, save, and return to Oremea"}
              </button>

              {finishDiscussionError ? (
                <p className="text-sm leading-6 text-amber-200/80">
                  {finishDiscussionError}
                </p>
              ) : null}

              {canMakeWorkable ? (
                <button
                  type="button"
                  onClick={() => void prepareResolution()}
                  className="secondary-button"
                >
                  Reach a resolution
                </button>
              ) : null}
            </>
          ) : null}
        </>
      ) : (
        <div className="space-y-5">
          {startingAreaLabel ? (
            <p className="text-xs uppercase tracking-[0.18em] text-zinc-500">
              Started in · {startingAreaLabel}
            </p>
          ) : null}

          {endingState?.reframe ? (
            <section className="rounded-[1.5rem] border border-[#3A3224] bg-[#17130D] p-5">
              <p className="text-xs uppercase tracking-[0.18em] text-[#d8b15f]">
                A simpler way to hold it
              </p>
              <p className="mt-3 whitespace-pre-line text-sm leading-7 text-zinc-300">
                {endingState.reframe}
              </p>
            </section>
          ) : null}

          {currentMovement ? (
            <section className="rounded-[1.7rem] border border-[#d8b15f]/60 bg-[#1B150D] p-6">
              <p className="text-xs uppercase tracking-[0.22em] text-[#d8b15f]">
                Right now
              </p>
              <p className="mt-3 text-xl font-medium leading-8 text-zinc-100">
                {currentMovement.instruction}
              </p>
              {currentMovement.reason ? (
                <p className="mt-3 text-sm leading-7 text-zinc-400">
                  {currentMovement.reason}
                </p>
              ) : null}

              <button
                type="button"
                onClick={() =>
                  endingState?.resolutionConfirmed
                    ? beginFinalization(currentMovement.instruction)
                    : void prepareResolution()
                }
                disabled={endingBusy}
                className="primary-button disabled:cursor-wait disabled:opacity-60"
              >
                {endingState?.resolutionConfirmed
                  ? "Use this as my next movement"
                  : "Reach a resolution first"}
              </button>
              <button
                type="button"
                onClick={() => void completeMovement()}
                disabled={endingBusy}
                className="secondary-button disabled:cursor-wait disabled:opacity-60"
              >
                I already did this
              </button>
              <button
                type="button"
                onClick={() => void movementFeedback("easier")}
                disabled={endingBusy}
                className="secondary-button disabled:cursor-wait disabled:opacity-60"
              >
                Make it easier
              </button>
              <button
                type="button"
                onClick={() => void movementFeedback("blocked")}
                disabled={endingBusy}
                className="secondary-button disabled:cursor-wait disabled:opacity-60"
              >
                Something&apos;s in the way
              </button>
              <button
                type="button"
                onClick={() => void movementFeedback("wrong")}
                disabled={endingBusy}
                className="secondary-button disabled:cursor-wait disabled:opacity-60"
              >
                That&apos;s not it
              </button>
            </section>
          ) : canMakeWorkable ? (
            <button
              type="button"
              onClick={() => void prepareResolution()}
              className="primary-button"
            >
              Reach a resolution
            </button>
          ) : null}

          <section>
            <div className="flex items-end justify-between gap-4">
              <div>
                <p className="text-xs uppercase tracking-[0.18em] text-[#d8b15f]">
                  What&apos;s asking for attention
                </p>
                <p className="mt-2 text-sm leading-6 text-zinc-500">
                  Completed items leave this active view and stay in your archive.
                </p>
              </div>
              <span className="text-xs text-zinc-600">{activeMapItems.length}</span>
            </div>

            <div className="mt-4 space-y-3">
              {endingBusy && activeMapItems.length === 0 ? (
                <MapThinkingIndicator />
              ) : null}

              {!endingBusy &&
              activeMapItems.length === 0 &&
              !boundaryMessage &&
              !endingError ? (
                <div className="rounded-2xl border border-zinc-800 p-5 text-sm leading-6 text-zinc-500">
                  {canMakeWorkable
                    ? "The current discussion is ready to turn into movement when you are."
                    : "Keep talking in Discussion. The Map will build from what you have already said as the current picture becomes clearer."}
                </div>
              ) : null}

              {activeMapItems.map((item) => (
                <div
                  key={item.id}
                  data-compass-map-id={item.id}
                  className="flex gap-3 rounded-2xl border border-zinc-800 bg-[#121212] p-4"
                >
                  <button
                    type="button"
                    aria-label={`Complete ${item.content}`}
                    onClick={() => void completeMapItem(item)}
                    disabled={endingBusy}
                    className="mt-0.5 h-5 w-5 shrink-0 rounded border border-zinc-600 transition hover:border-[#d8b15f] disabled:opacity-50"
                  />

                  <div className="min-w-0 flex-1">
                    <p className="text-sm leading-6 text-zinc-200">{item.content}</p>
                    <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-2 text-xs text-zinc-600">
                      {item.area ? <span>{AREA_LABELS[item.area] ?? item.area}</span> : null}
                      {item.status === "waiting" ? <span>Waiting</span> : null}
                      {item.sourceMessageIndex != null ? (
                        <button
                          type="button"
                          onClick={() => jumpToDiscussion(item)}
                          className="text-zinc-500 underline underline-offset-4 transition hover:text-[#d8b15f]"
                        >
                          From discussion
                        </button>
                      ) : null}
                      <button
                        type="button"
                        onClick={() => void editMapItem(item)}
                        className="text-zinc-600 transition hover:text-zinc-300"
                      >
                        Edit
                      </button>
                      <button
                        type="button"
                        onClick={() => void releaseMapItem(item)}
                        className="text-zinc-600 transition hover:text-zinc-300"
                      >
                        Release
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </section>
        </div>
      )}

      {endingError ? (
        <div
          className="rounded-[1.4rem] border border-[#5A4A2E] bg-[#17130D] p-5"
          aria-live="polite"
        >
          <p className="text-sm leading-6 text-amber-200/80">
            {endingError}
          </p>

          {view === "map" ? (
            <button
              type="button"
              onClick={() => void openMap()}
              disabled={endingBusy}
              className="secondary-button disabled:cursor-wait disabled:opacity-60"
            >
              Try building the Map again
            </button>
          ) : null}
        </div>
      ) : null}
    </CompassCard>
  );
}

export function CompassExecutionCheck({
  resolutionText,
  executionFeeling,
  onExecutionFeelingChange,
  onFinalize,
}: {
  resolutionText?: string | null;
  executionFeeling: string;
  onExecutionFeelingChange: (value: string) => void;
  onFinalize: () => void;
}) {
  return (
    <CompassCard
      title={
        resolutionText
          ? "What movement follows from this resolution?"
          : "Will this actually happen?"
      }
      description={
        resolutionText
          ? "Make the movement clear enough to recognise when it is complete."
          : "Before Compass closes, make the action small enough, clear enough, and honest enough to complete."
      }
    >
      {resolutionText ? (
        <div className="rounded-[1.5rem] border border-zinc-800 bg-[#121212] p-5">
          <p className="text-xs uppercase tracking-[0.18em] text-[#d8b15f]">
            Confirmed resolution
          </p>
          <p className="mt-3 whitespace-pre-line text-sm leading-7 text-zinc-300">
            {resolutionText}
          </p>
        </div>
      ) : null}
      <textarea
        value={executionFeeling}
        onChange={(event) => onExecutionFeelingChange(event.target.value)}
        placeholder="Write the exact action you are willing to complete next. If the action still feels too large, vague, exposed, dependent on others, or unlikely to happen, reduce it until it becomes real."
        rows={7}
        className="compass-textarea"
      />

      <button onClick={onFinalize} className="primary-button">
        Review this movement
      </button>
    </CompassCard>
  );
}

export function CompassComplete({
  finalStep,
  resonanceReflection,
  resonanceCtaHref,
  resonanceCtaLabel,
  onComplete,
}: {
  finalStep: string;
  resonanceReflection: string | null;
  resonanceCtaHref: string | null;
  resonanceCtaLabel: string | null;
  onComplete: () => boolean | Promise<boolean>;
}) {
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState("");

  return (
    <CompassCard
      title="Your next movement"
      description="One real movement you can carry from here."
    >
      <div className="rounded-[1.5rem] border border-[#3A3224] bg-[#17130D] p-5 text-sm leading-relaxed whitespace-pre-line text-zinc-300">
        {finalStep}
      </div>

      <button
        onClick={async () => {
          if (saving) return;
          setSaving(true);
          setSaveError("");

          const saved = await onComplete();
          if (saved) {
            window.location.href = "https://www.oremea.com";
            return;
          }

          setSaveError(
            "Compass needs a confirmed resolution and movement before it can close.",
          );
          setSaving(false);
        }}
        disabled={saving}
        className="primary-button disabled:cursor-wait disabled:opacity-60"
      >
        {saving ? "Saving Compass..." : "Complete Compass"}
      </button>

      {saveError ? (
        <p className="text-sm leading-6 text-amber-200/80">{saveError}</p>
      ) : null}

      {resonanceReflection && (
        <div className="rounded-[1.5rem] border border-zinc-800 bg-[#121212] p-5">
          <p className={`whitespace-pre-line text-sm leading-relaxed ${BODY_TEXT}`}>
            {resonanceReflection}
          </p>

          <a
            href={resonanceCtaHref ?? "https://www.oremea.com/?open=resonance"}
            className="primary-button inline-flex items-center justify-center"
          >
            {resonanceCtaLabel ?? "Explore Resonance"}
          </a>
        </div>
      )}
    </CompassCard>
  );
}
