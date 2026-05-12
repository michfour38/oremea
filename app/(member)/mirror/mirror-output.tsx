"use client";

import { useEffect, useState } from "react";
import { MirrorResponseDTO } from "./mirror.service";
import { continueJourneyDayAction } from "../journey/actions";
import ContinueDayButton from "../journey/continue-day-button";

interface MirrorOutputProps {
  weekNumber: number;
  dayNumber: number;
  liteMirrorEligible: boolean;
  fullMirrorEligible: boolean;
  liteMirrorUnlocked: boolean;
  fullMirrorUnlocked: boolean;
  mirror: Omit<MirrorResponseDTO, "inputSnapshot"> | null;
  mirrorExerciseCompleted: boolean;
}

export default function MirrorOutput({
  weekNumber,
  dayNumber,
  fullMirrorUnlocked,
  mirror,
  mirrorExerciseCompleted,
}: MirrorOutputProps) {
  const [isGenerating, setIsGenerating] = useState(false);
  const [feedbackState, setFeedbackState] = useState<
    "idle" | "saving" | "saved" | "error"
  >("idle");
  const [selectedFeedback, setSelectedFeedback] = useState<
    "yes" | "not_quite" | null
  >(null);
  const [note, setNote] = useState("");
  const [questions, setQuestions] = useState<string[]>([]);
  const [questionsLoading, setQuestionsLoading] = useState(false);
  const [questionsError, setQuestionsError] = useState(false);

useEffect(() => {
  if (fullMirrorUnlocked || questions.length > 0) return;

  async function loadSavedQuestions() {
    try {
      const res = await fetch(
        `/api/mirror/questions?weekNumber=${weekNumber}&dayNumber=${dayNumber}`,
        { method: "GET" }
      );

      if (!res.ok) return;

      const data = await res.json();

      if (Array.isArray(data?.questions) && data.questions.length === 2) {
        setQuestions(data.questions);
      }
    } catch (error) {
      console.error("Saved 2Q load failed:", error);
    }
  }

  loadSavedQuestions();
}, [fullMirrorUnlocked, questions.length, weekNumber, dayNumber]);

  useEffect(() => {
    if (!isGenerating) return;

    const timer = setTimeout(() => {
      window.location.href = `/api/mirror/generate?weekNumber=${weekNumber}&dayNumber=${dayNumber}&tier=full`;
    }, 350);

    return () => clearTimeout(timer);
  }, [isGenerating, weekNumber, dayNumber]);

useEffect(() => {
  if (typeof window === "undefined") return;

  const params = new URLSearchParams(window.location.search);
  const shouldGenerate = params.get("mirror") === "generate";

  if (shouldGenerate && fullMirrorUnlocked && !mirror && !isGenerating) {
    setIsGenerating(true);
  }
}, [fullMirrorUnlocked, mirror, isGenerating]);

useEffect(() => {
  if (typeof window === "undefined") return;

  const params = new URLSearchParams(window.location.search);

  const shouldGenerate = params.get("mirror") === "generate";

  if (
    shouldGenerate &&
    fullMirrorUnlocked &&
    !mirror &&
    !isGenerating
  ) {
    setIsGenerating(true);
  }
}, [fullMirrorUnlocked, mirror, isGenerating]);

  function startGenerate() {
    setIsGenerating(true);
  }

  async function generateQuestions() {
    if (questionsLoading || questions.length > 0) return;

    setQuestionsLoading(true);
    setQuestionsError(false);

    try {
      const res = await fetch(
        `/api/mirror/questions?weekNumber=${weekNumber}&dayNumber=${dayNumber}`,
        { method: "POST" }
      );

      if (!res.ok) throw new Error("Questions request failed");

      const data = await res.json();

      if (Array.isArray(data?.questions)) {
        setQuestions(data.questions);
      } else {
        throw new Error("Questions response was invalid");
      }
    } catch (error) {
      console.error("Questions generation failed:", error);
      setQuestionsError(true);
    } finally {
      setQuestionsLoading(false);
    }
  }

  async function submitFeedback(feedback: "yes" | "not_quite", customNote = "") {
    if (feedbackState === "saving") return;

    setFeedbackState("saving");
    setSelectedFeedback(feedback);

    try {
      const res = await fetch("/api/mirror/feedback", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          weekNumber,
          dayNumber,
          feedback,
          note: feedback === "not_quite" ? customNote : "",
        }),
      });

      if (!res.ok) throw new Error("Feedback request failed");

      setFeedbackState("saved");
    } catch (error) {
      console.error("Mirror feedback failed:", error);
      setFeedbackState("error");
    }
  }

  if (!mirrorExerciseCompleted) return null;

  if (!fullMirrorUnlocked) {
    return (
      <div className="space-y-5 rounded-3xl border border-[#6d5b2b]/35 bg-[#17130d] px-6 py-6">
        <div className="space-y-3">
          <p className="text-xs font-medium uppercase tracking-[0.25em] text-[#b6a36a]">
            Reflection Questions
          </p>

          {questions.length > 0 ? (
            <div className="space-y-3 text-sm leading-7 text-[#efe4c6]">
              {questions.map((question, index) => (
                <p key={index}>{question}</p>
              ))}
            </div>
          ) : (
            <>
              <p className="text-sm leading-7 text-[#ddd1ad]">
                When you’re ready, generate your two guiding questions for
                today.
              </p>

              <button
                type="button"
                onClick={generateQuestions}
                disabled={questionsLoading}
                className="inline-block rounded-xl border border-[#8a7331]/50 bg-[#2a2210] px-4 py-2 text-sm text-[#f3e7bf] transition-colors hover:bg-[#352b15] disabled:cursor-not-allowed disabled:opacity-60"
              >
                {questionsLoading
                  ? "Preparing your questions..."
                  : "Generate my 2 guiding questions"}
              </button>
            </>
          )}

          {questionsError ? (
            <p className="text-xs text-red-400">
              Couldn’t generate questions. Try again.
            </p>
          ) : null}
        </div>

        {questions.length > 0 ? (
          <>
            <p className="text-xs text-zinc-500">
              These are drawn directly from what you’ve reflected today.
            </p>

            <div className="rounded-2xl border border-[#6d5b2b]/35 bg-black/25 p-5">
              <div className="space-y-4">
                <p className="text-[11px] uppercase tracking-[0.22em] text-[#c8a96a]">
                  Mirror possibility
                </p>

                <div className="relative overflow-hidden rounded-2xl border border-[#6d5b2b]/25 bg-black/30 p-5">
                  <div className="pointer-events-none select-none space-y-3 blur-[4px]">
                    <p className="text-sm leading-7 text-[#efe4c6]">
                      There is a deeper pattern forming across the way you are
                      describing closeness, protection, and what becomes
                      difficult to name.
                    </p>

                    <p className="text-sm leading-7 text-[#efe4c6]">
                      The Mirror would look across your reflections to track
                      repetition, contradiction, emotional movement, and
                      relational meaning over time.
                    </p>

                    <p className="text-sm leading-7 text-[#efe4c6]">
                      This is where your answers begin to become a map, not just
                      separate moments.
                    </p>

                  </div>

                  <div className="absolute inset-0 bg-gradient-to-b from-transparent via-[#17130d]/65 to-[#17130d]" />
<a
  href={`https://paystack.shop/pay/3utxqlehqj?email=${encodeURIComponent(window.location.href)}`}
  className="absolute left-1/2 top-1/2 z-10 inline-flex -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-xl border border-[#8b6b2f]/70 bg-[#241b10]/95 px-5 py-3 text-sm text-[#f1dfb4] shadow-[0_0_30px_rgba(0,0,0,0.45)] transition hover:bg-[#2f2314]"
>
  Unlock Mirror — R720
</a>
                </div>

                <div className="space-y-3">
                  
                  <p className="text-sm leading-7 text-zinc-300">
                    Your 2 questions point to the next layer. Mirror follows the
                    deeper continuity across your reflections and reveals the
                    pattern forming over time.
                  </p>

                </div>
              </div>
            </div>

            <form
              action={continueJourneyDayAction}
              className="mt-5 flex justify-end"
            >
              <input type="hidden" name="weekNumber" value={weekNumber} />
              <input type="hidden" name="dayNumber" value={dayNumber} />

              <ContinueDayButton />
            </form>
          </>
        ) : null}
      </div>
    );
  }

  if (fullMirrorUnlocked && !mirror) {
    return (
      <div className="space-y-5 rounded-3xl border border-[#6d5b2b]/35 bg-[#15120c] px-6 py-6">
        <div className="space-y-1">
          <p className="text-xs font-medium uppercase tracking-[0.25em] text-[#b6a36a]">
            Full Mirror
          </p>
        </div>

        {!isGenerating ? (
          <>
            <p className="text-sm leading-7 text-[#f1e7c8]">
              Your reflection has finished processing.
            </p>

            <button
              type="button"
              onClick={startGenerate}
              className="inline-block rounded-xl border border-[#8a7331]/50 bg-[#2a2210] px-4 py-2 text-sm text-[#f3e7bf] transition-colors hover:bg-[#352b15]"
            >
              Enter
            </button>
          </>
        ) : (
          <div className="rounded-2xl border border-[#6d5b2b]/30 bg-[#211b10] px-4 py-4">
            <p className="text-sm text-[#f1e7c8]">Opening your Mirror...</p>

            <div className="mt-4 flex items-center gap-2">
              <span className="h-2 w-2 animate-pulse rounded-full bg-[#f0ddb0]" />
              <span className="h-2 w-2 animate-pulse rounded-full bg-[#d9c089] [animation-delay:150ms]" />
              <span className="h-2 w-2 animate-pulse rounded-full bg-[#b9974f] [animation-delay:300ms]" />
            </div>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-6 rounded-3xl border border-[#6d5b2b]/35 bg-[#15120c] px-6 py-6">
      <div className="space-y-1">
        <p className="text-xs font-medium uppercase tracking-[0.25em] text-[#b6a36a]">
          Full Mirror
        </p>
        <p className="text-xs text-[#9f9474]">
          Week {weekNumber} · Day {dayNumber}
        </p>
      </div>

      <div className="space-y-4">
        {mirror?.output
          .replace(/\*\*The mirror shows:\*\*/gi, "")
          .replace(/The mirror shows:/gi, "")
          .replace(/\*\*Two questions:\*\*/gi, "")
          .replace(/Two questions:/gi, "")
          .trim()
          .split("\n\n")
          .map((paragraph, i) => (
            <p
              key={i}
              className="whitespace-pre-wrap text-sm leading-7 text-[#efe4c6]"
            >
              {paragraph}
            </p>
          ))}
      </div>

      <div className="space-y-3 border-t border-zinc-800 pt-4">
        <p className="text-xs text-zinc-500">Did this feel accurate?</p>

        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => submitFeedback("yes")}
            disabled={feedbackState === "saving" || feedbackState === "saved"}
            className={`rounded-lg border px-3 py-1.5 text-xs transition-colors ${
              selectedFeedback === "yes"
                ? "border-[#8a7331]/60 bg-[#2a2210] text-[#f3e7bf]"
                : "border-zinc-700 text-zinc-300 hover:border-zinc-500"
            }`}
          >
            Yes
          </button>

          <button
            type="button"
            onClick={() => {
              setSelectedFeedback("not_quite");
              setFeedbackState("idle");
            }}
            disabled={feedbackState === "saving" || feedbackState === "saved"}
            className={`rounded-lg border px-3 py-1.5 text-xs transition-colors ${
              selectedFeedback === "not_quite"
                ? "border-[#8a7331]/60 bg-[#2a2210] text-[#f3e7bf]"
                : "border-zinc-700 text-zinc-300 hover:border-zinc-500"
            }`}
          >
            Not quite
          </button>
        </div>

        {selectedFeedback === "not_quite" && feedbackState !== "saved" ? (
          <div className="space-y-3">
            <textarea
              value={note}
              onChange={(e) => setNote(e.target.value)}
              rows={3}
              placeholder="What felt off?"
              className="w-full resize-none rounded-2xl border border-zinc-800 bg-zinc-950 px-4 py-3 text-sm leading-7 text-zinc-200 placeholder:text-zinc-500 focus:outline-none focus:ring-1 focus:ring-zinc-700"
            />

            <div className="flex justify-end">
              <button
                type="button"
                onClick={() => submitFeedback("not_quite", note)}
                disabled={feedbackState === "saving"}
                className="text-xs text-zinc-400 transition-colors hover:text-zinc-200"
              >
                Send feedback
              </button>
            </div>
          </div>
        ) : null}

        {feedbackState === "saved" ? (
          <p className="text-xs text-zinc-500">
            Thanks. That helps refine the Mirror.
          </p>
        ) : null}

        {feedbackState === "error" ? (
          <p className="text-xs text-red-400">
            Couldn’t save feedback. Try again.
          </p>
        ) : null}
      </div>
    </div>
  );
}