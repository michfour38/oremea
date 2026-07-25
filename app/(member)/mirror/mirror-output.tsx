"use client";

import { useEffect, useState } from "react";

import { MirrorResponseDTO } from "./mirror.service";
import {
  completeResonanceWeekAction,
  continueResonanceDayAction,
} from "../resonance/actions";
import ContinueDayButton from "../resonance/continue-day-button";

interface MirrorOutputProps {
  weekNumber: number;
  dayNumber: number;
  mirror: Omit<MirrorResponseDTO, "inputSnapshot"> | null;
  reflectionsCompleted: boolean;
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

function cleanMirrorOutput(text: string) {
  return text
    .replace(/\*\*The mirror shows:\*\*/gi, "")
    .replace(/The mirror shows:/gi, "")
    .replace(/\*\*Two questions:\*\*/gi, "")
    .replace(/Two questions:/gi, "")
    .trim();
}

export default function MirrorOutput({
  weekNumber,
  dayNumber,
  mirror,
  reflectionsCompleted,
}: MirrorOutputProps) {
  const [questions, setQuestions] = useState<string[]>([]);
  const [questionsLoading, setQuestionsLoading] = useState(false);
  const [questionsError, setQuestionsError] = useState(false);
  const [isGeneratingMirror, setIsGeneratingMirror] = useState(false);
  const [feedbackState, setFeedbackState] = useState<
    "idle" | "saving" | "saved" | "error"
  >("idle");
  const [selectedFeedback, setSelectedFeedback] = useState<
    "yes" | "not_quite" | null
  >(null);
  const [note, setNote] = useState("");

  const isWeekClose = dayNumber === 7;

  useEffect(() => {
    if (!reflectionsCompleted || questions.length > 0) return;

    async function loadSavedQuestions() {
      try {
        const res = await fetch(
          `/api/mirror/questions?weekNumber=${weekNumber}&dayNumber=${dayNumber}`,
          { method: "GET" },
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

    void loadSavedQuestions();
  }, [dayNumber, questions.length, reflectionsCompleted, weekNumber]);

  useEffect(() => {
    if (!isGeneratingMirror) return;

    const timer = window.setTimeout(() => {
      window.location.href = `/api/mirror/generate?weekNumber=${weekNumber}&dayNumber=7`;
    }, 350);

    return () => window.clearTimeout(timer);
  }, [isGeneratingMirror, weekNumber]);

  async function generateQuestions() {
    if (questionsLoading || questions.length > 0) return;

    setQuestionsLoading(true);
    setQuestionsError(false);

    try {
      const res = await fetch(
        `/api/mirror/questions?weekNumber=${weekNumber}&dayNumber=${dayNumber}`,
        { method: "POST" },
      );

      if (!res.ok) throw new Error("Questions request failed");

      const data = await res.json();
      if (!Array.isArray(data?.questions) || data.questions.length !== 2) {
        throw new Error("Questions response was invalid");
      }

      setQuestions(data.questions);
    } catch (error) {
      console.error("Questions generation failed:", error);
      setQuestionsError(true);
    } finally {
      setQuestionsLoading(false);
    }
  }

  async function submitFeedback(
    feedback: "yes" | "not_quite",
    customNote = "",
  ) {
    if (feedbackState === "saving") return;

    setFeedbackState("saving");
    setSelectedFeedback(feedback);

    try {
      const res = await fetch("/api/mirror/feedback", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          weekNumber,
          dayNumber: 7,
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

  if (!reflectionsCompleted) return null;

  return (
    <div className="space-y-6">
      <section className="space-y-5 rounded-3xl border border-[#6d5b2b]/35 bg-[#17130d] px-6 py-6">
        <div className="space-y-2">
          <p className="text-xs font-medium uppercase tracking-[0.25em] text-[#b6a36a]">
            Today&apos;s 2Q
          </p>
          <p className="text-sm leading-7 text-[#ddd1ad]">
            Two questions drawn directly from what you reflected today.
          </p>
        </div>

        {questions.length === 2 ? (
          <div className="space-y-4 text-sm leading-7 text-[#efe4c6]">
            <p>{questions[0]}</p>
            <p>{questions[1]}</p>
          </div>
        ) : (
          <button
            type="button"
            onClick={generateQuestions}
            disabled={questionsLoading}
            className="inline-flex min-w-[180px] items-center justify-center rounded-xl border border-[#8a7331]/50 bg-[#2a2210] px-4 py-2 text-sm text-[#f3e7bf] transition-colors hover:bg-[#352b15] disabled:cursor-not-allowed disabled:opacity-60"
          >
            {questionsLoading ? <LoadingDots /> : "Generate today's 2Q"}
          </button>
        )}

        {questionsError ? (
          <p className="text-xs text-red-400">Couldn&apos;t generate questions. Try again.</p>
        ) : null}

        {questions.length === 2 && !isWeekClose ? (
          <form action={continueResonanceDayAction} className="flex justify-end pt-2">
            <input type="hidden" name="weekNumber" value={weekNumber} />
            <input type="hidden" name="dayNumber" value={dayNumber} />
            <ContinueDayButton />
          </form>
        ) : null}
      </section>

      {questions.length === 2 && isWeekClose ? (
        <section className="space-y-5 rounded-3xl border border-[#6d5b2b]/35 bg-[#15120c] px-6 py-6">
          <div className="space-y-2">
            <p className="text-xs font-medium uppercase tracking-[0.25em] text-[#b6a36a]">
              Weekly Mirror
            </p>
            <p className="text-sm leading-7 text-[#ddd1ad]">
              Your Mirror reflects the Resonance journey you have completed so far.
            </p>
          </div>

          {!mirror ? (
            !isGeneratingMirror ? (
              <button
                type="button"
                onClick={() => setIsGeneratingMirror(true)}
                className="inline-flex min-w-[150px] items-center justify-center rounded-xl border border-[#8a7331]/50 bg-[#2a2210] px-4 py-2 text-sm text-[#f3e7bf] transition-colors hover:bg-[#352b15]"
              >
                Open my Mirror
              </button>
            ) : (
              <div className="rounded-2xl border border-[#6d5b2b]/30 bg-[#211b10] px-4 py-4">
                <p className="text-sm text-[#f1e7c8]">Opening your Mirror...</p>
                <div className="mt-4">
                  <LoadingDots />
                </div>
              </div>
            )
          ) : (
            <>
              <div className="space-y-4">
                {cleanMirrorOutput(mirror.output)
                  .split("\n\n")
                  .filter(Boolean)
                  .map((paragraph, index) => (
                    <p
                      key={index}
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
                    onClick={() => void submitFeedback("yes")}
                    disabled={feedbackState === "saving" || feedbackState === "saved"}
                    className="rounded-lg border border-zinc-700 px-3 py-1.5 text-xs text-zinc-300 transition-colors hover:border-zinc-500 disabled:opacity-50"
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
                    className="rounded-lg border border-zinc-700 px-3 py-1.5 text-xs text-zinc-300 transition-colors hover:border-zinc-500 disabled:opacity-50"
                  >
                    Not quite
                  </button>
                </div>

                {selectedFeedback === "not_quite" && feedbackState !== "saved" ? (
                  <div className="space-y-3">
                    <textarea
                      value={note}
                      onChange={(event) => setNote(event.target.value)}
                      rows={3}
                      placeholder="What felt off?"
                      className="w-full resize-none rounded-2xl border border-zinc-800 bg-zinc-950 px-4 py-3 text-sm leading-7 text-zinc-200 placeholder:text-zinc-500 focus:outline-none focus:ring-1 focus:ring-zinc-700"
                    />
                    <div className="flex justify-end">
                      <button
                        type="button"
                        onClick={() => void submitFeedback("not_quite", note)}
                        disabled={feedbackState === "saving"}
                        className="text-xs text-zinc-400 transition-colors hover:text-zinc-200"
                      >
                        Send feedback
                      </button>
                    </div>
                  </div>
                ) : null}

                {feedbackState === "saved" ? (
                  <p className="text-xs text-zinc-500">Thanks. That helps refine the Mirror.</p>
                ) : null}

                {feedbackState === "error" ? (
                  <p className="text-xs text-red-400">Couldn&apos;t save feedback. Try again.</p>
                ) : null}
              </div>

              <form action={completeResonanceWeekAction} className="flex justify-end border-t border-zinc-800 pt-5">
                <input type="hidden" name="weekNumber" value={weekNumber} />
                <button
                  type="submit"
                  className="min-w-[150px] rounded-xl border border-[#c8a96a]/60 px-5 py-3 text-sm text-[#f1dfb4] transition hover:bg-[#c8a96a]/10"
                >
                  Complete week
                </button>
              </form>
            </>
          )}
        </section>
      ) : null}
    </div>
  );
}
