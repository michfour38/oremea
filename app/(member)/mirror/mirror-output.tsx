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
  const [questions, setQuestions] = useState<string[]>([]);
  const [answerOne, setAnswerOne] = useState("");
  const [answerTwo, setAnswerTwo] = useState("");
  const [answersSaved, setAnswersSaved] = useState(false);
  const [answersSaving, setAnswersSaving] = useState(false);
  const [answersError, setAnswersError] = useState(false);
  const [questionsLoading, setQuestionsLoading] = useState(false);
  const [questionsError, setQuestionsError] = useState(false);
  const [isGeneratingMirror, setIsGeneratingMirror] = useState(false);

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

        if (Array.isArray(data?.answers) && data.answers.length === 2) {
          setAnswerOne(typeof data.answers[0] === "string" ? data.answers[0] : "");
          setAnswerTwo(typeof data.answers[1] === "string" ? data.answers[1] : "");
        }

        setAnswersSaved(data?.answered === true);
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

      if (Array.isArray(data?.answers) && data.answers.length === 2) {
        setAnswerOne(typeof data.answers[0] === "string" ? data.answers[0] : "");
        setAnswerTwo(typeof data.answers[1] === "string" ? data.answers[1] : "");
      }

      setAnswersSaved(data?.answered === true);
    } catch (error) {
      console.error("Questions generation failed:", error);
      setQuestionsError(true);
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

      if (!res.ok) throw new Error("2Q answers could not be saved");

      const data = await res.json();
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
      <section className="space-y-5 rounded-3xl border border-[#C8A96A]/30 bg-black/55 px-6 py-6 shadow-[0_18px_70px_rgba(0,0,0,0.22)] backdrop-blur-[3px]">
        <div className="space-y-2">
          <p className="text-xs font-medium uppercase tracking-[0.25em] text-[#C8A96A]">
            Today&apos;s 2Q
          </p>
          <p className="text-sm leading-7 text-zinc-400">
            Two questions drawn directly from what you reflected today.
          </p>
        </div>

        {questions.length === 2 ? (
          <div className="space-y-6">
            <div className="space-y-3">
              <p className="text-sm leading-7 text-zinc-200">{questions[0]}</p>
              <textarea
                value={answerOne}
                onChange={(event) => {
                  setAnswerOne(event.target.value);
                  setAnswersSaved(false);
                }}
                rows={4}
                placeholder="Stay with this question..."
                className="w-full resize-none rounded-2xl border border-zinc-700 bg-black/70 px-4 py-3 text-sm leading-7 text-zinc-100 placeholder:text-zinc-500 focus:border-[#C8A96A]/65 focus:outline-none focus:ring-1 focus:ring-[#C8A96A]/35"
              />
            </div>

            <div className="space-y-3">
              <p className="text-sm leading-7 text-zinc-200">{questions[1]}</p>
              <textarea
                value={answerTwo}
                onChange={(event) => {
                  setAnswerTwo(event.target.value);
                  setAnswersSaved(false);
                }}
                rows={4}
                placeholder="Stay with this question..."
                className="w-full resize-none rounded-2xl border border-zinc-700 bg-black/70 px-4 py-3 text-sm leading-7 text-zinc-100 placeholder:text-zinc-500 focus:border-[#C8A96A]/65 focus:outline-none focus:ring-1 focus:ring-[#C8A96A]/35"
              />
            </div>

            <div className="flex flex-wrap items-center justify-end gap-3 pt-1">
              <button
                type="button"
                onClick={() => void saveAnswers()}
                disabled={answersSaving || !answerOne.trim() || !answerTwo.trim()}
                className="inline-flex min-w-[110px] items-center justify-center rounded-xl border border-[#C8A96A]/55 bg-[#C8A96A]/15 px-4 py-2 text-sm text-[#C8A96A] transition hover:bg-[#C8A96A]/20 disabled:cursor-not-allowed disabled:opacity-45"
              >
                {answersSaving ? <LoadingDots /> : answersSaved ? "Saved" : "Save 2Q"}
              </button>
            </div>
          </div>
        ) : (
          <button
            type="button"
            onClick={() => void generateQuestions()}
            disabled={questionsLoading}
            className="inline-flex min-w-[180px] items-center justify-center rounded-xl border border-[#C8A96A]/55 bg-[#C8A96A]/15 px-4 py-2 text-sm text-[#C8A96A] transition hover:bg-[#C8A96A]/20 disabled:cursor-not-allowed disabled:opacity-45"
          >
            {questionsLoading ? <LoadingDots /> : "Generate today's 2Q"}
          </button>
        )}

        {questionsError ? (
          <p className="text-xs text-red-300">
            The questions could not be generated. Please generate them again.
          </p>
        ) : null}

        {answersError ? (
          <p className="text-xs text-red-300">
            Your 2Q could not be saved. Please save it again.
          </p>
        ) : null}

        {answersSaved && !isWeekClose ? (
          <form action={continueResonanceDayAction} className="flex justify-end pt-2">
            <input type="hidden" name="weekNumber" value={weekNumber} />
            <input type="hidden" name="dayNumber" value={dayNumber} />
            <ContinueDayButton />
          </form>
        ) : null}
      </section>

      {answersSaved && isWeekClose ? (
        <section className="space-y-5 rounded-3xl border border-[#C8A96A]/30 bg-black/55 px-6 py-6 shadow-[0_18px_70px_rgba(0,0,0,0.22)] backdrop-blur-[3px]">
          <div className="space-y-2">
            <p className="text-xs font-medium uppercase tracking-[0.25em] text-[#C8A96A]">
              Weekly Mirror
            </p>
            <p className="text-sm leading-7 text-zinc-400">
              Your Mirror reflects the Resonance journey you have completed so far.
            </p>
          </div>

          {!mirror ? (
            !isGeneratingMirror ? (
              <button
                type="button"
                onClick={() => setIsGeneratingMirror(true)}
                className="inline-flex min-w-[150px] items-center justify-center rounded-xl border border-[#C8A96A]/55 bg-[#C8A96A]/15 px-4 py-2 text-sm text-[#C8A96A] transition hover:bg-[#C8A96A]/20"
              >
                Open my Mirror
              </button>
            ) : (
              <div className="rounded-2xl border border-zinc-800 bg-black/55 px-4 py-4">
                <p className="text-sm text-zinc-300">Opening your Mirror...</p>
                <div className="mt-4 text-[#C8A96A]">
                  <LoadingDots />
                </div>
              </div>
            )
          ) : (
            <>
              <div className="space-y-4 rounded-2xl border border-zinc-800 bg-black/45 px-5 py-5">
                {cleanMirrorOutput(mirror.output)
                  .split("\n\n")
                  .filter(Boolean)
                  .map((paragraph, index) => (
                    <p
                      key={index}
                      className="whitespace-pre-wrap text-sm leading-7 text-zinc-300"
                    >
                      {paragraph}
                    </p>
                  ))}
              </div>

              <form
                action={completeResonanceWeekAction}
                className="flex justify-end border-t border-zinc-800 pt-5"
              >
                <input type="hidden" name="weekNumber" value={weekNumber} />
                <button
                  type="submit"
                  className="min-w-[150px] rounded-xl border border-[#C8A96A]/55 bg-[#C8A96A]/15 px-5 py-3 text-sm text-[#C8A96A] transition hover:bg-[#C8A96A]/20"
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
