"use client";

import { useEffect, useState } from "react";

import {
  completeResonanceWeekAction,
  continueResonanceDayAction,
} from "../resonance/actions";
import ContinueDayButton from "../resonance/continue-day-button";

type MirrorDisplay = {
  id: string;
  userId: string;
  weekNumber: number;
  dayNumber: number;
  tier: "full";
  output: string;
  createdAt: string;
};

interface MirrorOutputProps {
  weekNumber: number;
  dayNumber: number;
  mirror: MirrorDisplay | null;
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
  const [dailyMirror, setDailyMirror] = useState("");
  const [questions, setQuestions] = useState<string[]>([]);
  const [answerOne, setAnswerOne] = useState("");
  const [answerTwo, setAnswerTwo] = useState("");
  const [answersSaved, setAnswersSaved] = useState(false);
  const [answersSaving, setAnswersSaving] = useState(false);
  const [answersError, setAnswersError] = useState(false);
  const [questionsLoading, setQuestionsLoading] = useState(false);
  const [questionsError, setQuestionsError] = useState<string | null>(null);
  const [isGeneratingMirror, setIsGeneratingMirror] = useState(false);

  const isVisitClose = dayNumber === 7;

  useEffect(() => {
    if (!reflectionsCompleted || dailyMirror) return;

    async function loadSavedMirror() {
      try {
        const res = await fetch(
          `/api/mirror/questions?weekNumber=${weekNumber}&dayNumber=${dayNumber}`,
          { method: "GET" },
        );

        const data = await res.json().catch(() => null);

        if (!res.ok) {
          setQuestionsError(
            typeof data?.error === "string"
              ? data.error
              : "Today's Mirror could not be loaded. Please try again.",
          );
          return;
        }

        const reflection =
          typeof data?.dailyMirror === "string" ? data.dailyMirror.trim() : "";

        if (!reflection) {
          setDailyMirror("");
          setQuestions([]);
          setAnswerOne("");
          setAnswerTwo("");
          setAnswersSaved(false);
          return;
        }

        setDailyMirror(reflection);

        if (Array.isArray(data?.questions) && data.questions.length === 2) {
          setQuestions(data.questions);
          setQuestionsError(null);
        }

        if (Array.isArray(data?.answers) && data.answers.length === 2) {
          setAnswerOne(typeof data.answers[0] === "string" ? data.answers[0] : "");
          setAnswerTwo(typeof data.answers[1] === "string" ? data.answers[1] : "");
        }

        setAnswersSaved(data?.answered === true);
      } catch (error) {
        console.error("Saved Daily Mirror load failed:", error);
        setQuestionsError("Today's Mirror could not be loaded. Please try again.");
      }
    }

    void loadSavedMirror();
  }, [dailyMirror, dayNumber, reflectionsCompleted, weekNumber]);

  useEffect(() => {
    if (!isGeneratingMirror) return;

    const timer = window.setTimeout(() => {
      window.location.href = `/api/mirror/generate?weekNumber=${weekNumber}&dayNumber=7`;
    }, 350);

    return () => window.clearTimeout(timer);
  }, [isGeneratingMirror, weekNumber]);

  async function generateDailyMirror() {
    if (questionsLoading || dailyMirror) return;

    setQuestionsLoading(true);
    setQuestionsError(null);

    try {
      const res = await fetch(
        `/api/mirror/questions?weekNumber=${weekNumber}&dayNumber=${dayNumber}`,
        { method: "POST" },
      );

      const data = await res.json().catch(() => null);

      if (!res.ok) {
        throw new Error(
          typeof data?.error === "string"
            ? data.error
            : "Today's Mirror could not be generated.",
        );
      }

      const reflection =
        typeof data?.dailyMirror === "string" ? data.dailyMirror.trim() : "";

      if (!reflection) {
        throw new Error("Today's Mirror returned without its reflection.");
      }

      if (!Array.isArray(data?.questions) || data.questions.length !== 2) {
        throw new Error("Today's Mirror returned without both 2Q questions.");
      }

      setDailyMirror(reflection);
      setQuestions(data.questions);
      setQuestionsError(null);
      setAnswerOne("");
      setAnswerTwo("");
      setAnswersSaved(false);
    } catch (error) {
      console.error("Daily Mirror generation failed:", error);
      setQuestionsError(
        error instanceof Error && error.message
          ? error.message
          : "Today's Mirror could not be generated. Please try again.",
      );
    } finally {
      setQuestionsLoading(false);
    }
  }

  async function saveAnswers() {
    if (answersSaving || !answerOne.trim() || !answerTwo.trim()) return;

    setAnswersSaving(true);
    setAnswersError(false);

    try {
      const res = await fetch("/api/mirror/questions", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          weekNumber,
          dayNumber,
          answerOne,
          answerTwo,
        }),
      });

      const data = await res.json().catch(() => null);

      if (!res.ok) {
        throw new Error(
          typeof data?.error === "string"
            ? data.error
            : "Your 2Q could not be saved.",
        );
      }

      if (!Array.isArray(data?.answers) || data.answers.length !== 2) {
        throw new Error("2Q answer response was invalid");
      }

      setAnswerOne(data.answers[0]);
      setAnswerTwo(data.answers[1]);
      setAnswersSaved(data?.answered === true);
    } catch (error) {
      console.error("2Q answer save failed:", error);
      setAnswersError(true);
    } finally {
      setAnswersSaving(false);
    }
  }

  if (!reflectionsCompleted) return null;

  return (
    <div className="space-y-6">
      <section className="res-accent-border res-panel space-y-6 rounded-3xl border px-6 py-6 shadow-[0_18px_70px_rgba(0,0,0,0.22)] backdrop-blur-[3px]">
        <div className="space-y-2">
          <p className="res-accent text-xs font-medium uppercase tracking-[0.25em]">
            Today&apos;s Mirror
          </p>
          <p className="res-text-secondary text-sm leading-7">
            A reflection across what became visible today, followed by two questions to stay with.
          </p>
        </div>

        {dailyMirror && questions.length === 2 ? (
          <div className="space-y-8">
            <div className="res-border res-panel-soft space-y-5 rounded-2xl border px-5 py-5">
              {cleanMirrorOutput(dailyMirror)
                .split(/\n\s*\n/)
                .filter(Boolean)
                .map((paragraph, index) => (
                  <p
                    key={index}
                    className="res-text-primary whitespace-pre-wrap text-base leading-8"
                  >
                    {paragraph}
                  </p>
                ))}
            </div>

            <div className="res-accent-border space-y-6 border-t pt-6">
              <div className="space-y-3">
                <p className="res-text text-base leading-8">{questions[0]}</p>
                <textarea
                  data-resonance-input="true"
                  value={answerOne}
                  onChange={(event) => {
                    setAnswerOne(event.target.value);
                    setAnswersSaved(false);
                  }}
                  rows={4}
                  placeholder="Stay with this question..."
                  className="res-field w-full resize-none rounded-2xl border px-4 py-3 text-sm leading-7"
                />
              </div>

              <div className="space-y-3">
                <p className="res-text text-base leading-8">{questions[1]}</p>
                <textarea
                  data-resonance-input="true"
                  value={answerTwo}
                  onChange={(event) => {
                    setAnswerTwo(event.target.value);
                    setAnswersSaved(false);
                  }}
                  rows={4}
                  placeholder="Stay with this question..."
                  className="res-field w-full resize-none rounded-2xl border px-4 py-3 text-sm leading-7"
                />
              </div>

              <div className="flex flex-wrap items-center justify-end gap-3 pt-1">
                <button
                  type="button"
                  onClick={() => void saveAnswers()}
                  disabled={answersSaving || !answerOne.trim() || !answerTwo.trim()}
                  className="res-action-soft inline-flex min-w-[110px] items-center justify-center rounded-xl border px-4 py-2 text-sm transition disabled:cursor-not-allowed disabled:opacity-45"
                >
                  {answersSaving ? <LoadingDots /> : answersSaved ? "Saved" : "Save"}
                </button>
              </div>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            {questionsError ? (
              <div
                role="alert"
                aria-live="polite"
                className="res-error-panel min-h-[112px] w-full rounded-2xl border px-4 py-3 text-sm leading-7"
              >
                {questionsError}
              </div>
            ) : null}

            <div className="flex justify-end">
              <button
                type="button"
                onClick={() => void generateDailyMirror()}
                disabled={questionsLoading}
                className="res-action-soft inline-flex min-w-[180px] items-center justify-center rounded-xl border px-4 py-2 text-sm transition disabled:cursor-not-allowed disabled:opacity-45"
              >
                {questionsLoading ? (
                  <LoadingDots />
                ) : questionsError ? (
                  "Try today's Mirror again"
                ) : (
                  "Open today's Mirror"
                )}
              </button>
            </div>
          </div>
        )}

        {answersError ? (
          <p className="res-danger text-xs">
            Your 2Q could not be saved. Please save it again.
          </p>
        ) : null}

        {answersSaved && !isVisitClose ? (
          <form action={continueResonanceDayAction} className="flex justify-end pt-2">
            <input type="hidden" name="weekNumber" value={weekNumber} />
            <input type="hidden" name="dayNumber" value={dayNumber} />
            <ContinueDayButton />
          </form>
        ) : null}
      </section>

      {answersSaved && isVisitClose ? (
        <section className="res-accent-border res-panel space-y-5 rounded-3xl border px-6 py-6 shadow-[0_18px_70px_rgba(0,0,0,0.22)] backdrop-blur-[3px]">
          <div className="space-y-2">
            <p className="res-accent text-xs font-medium uppercase tracking-[0.25em]">
              Closing Mirror
            </p>
            <p className="res-text-secondary text-sm leading-7">
              Your Mirror reflects this seven-day Resonance visit.
            </p>
          </div>

          {!mirror ? (
            !isGeneratingMirror ? (
              <button
                type="button"
                onClick={() => setIsGeneratingMirror(true)}
                className="res-action-soft inline-flex min-w-[150px] items-center justify-center rounded-xl border px-4 py-2 text-sm transition"
              >
                Open my Mirror
              </button>
            ) : (
              <div className="res-border res-panel rounded-2xl border px-4 py-4">
                <p className="res-text-primary text-sm">Opening your Mirror...</p>
                <div className="res-accent mt-4">
                  <LoadingDots />
                </div>
              </div>
            )
          ) : (
            <>
              <div className="res-border res-panel-soft space-y-4 rounded-2xl border px-5 py-5">
                {cleanMirrorOutput(mirror.output)
                  .split("\n\n")
                  .filter(Boolean)
                  .map((paragraph, index) => (
                    <p
                      key={index}
                      className="res-text-primary whitespace-pre-wrap text-sm leading-7"
                    >
                      {paragraph}
                    </p>
                  ))}
              </div>

              <form
                action={completeResonanceWeekAction}
                className="res-divider flex justify-end border-t pt-5"
              >
                <input type="hidden" name="weekNumber" value={weekNumber} />
                <button
                  type="submit"
                  className="res-action-soft min-w-[150px] rounded-xl border px-5 py-3 text-sm transition"
                >
                  Complete visit
                </button>
              </form>
            </>
          )}
        </section>
      ) : null}
    </div>
  );
}
