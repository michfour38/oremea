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
  liteMirrorEligible,
  fullMirrorEligible,
  liteMirrorUnlocked,
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

  const activeTier = fullMirrorUnlocked ? "full" : "lite";
  const hasUnlockedMirror = liteMirrorUnlocked || fullMirrorUnlocked;
  const isResonance = !hasUnlockedMirror;

  useEffect(() => {
    if (!isGenerating) return;

    const timer = setTimeout(() => {
      window.location.href = `/api/mirror/generate?weekNumber=${weekNumber}&dayNumber=${dayNumber}&tier=${activeTier}`;
    }, 350);

    return () => clearTimeout(timer);
  }, [isGenerating, weekNumber, dayNumber, activeTier]);

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
        {
          method: "POST",
        }
      );

      if (!res.ok) {
        throw new Error("Questions request failed");
      }

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

      if (!res.ok) {
        throw new Error("Feedback request failed");
      }

      setFeedbackState("saved");
    } catch (error) {
      console.error("Mirror feedback failed:", error);
      setFeedbackState("error");
    }
  }

  if (!mirrorExerciseCompleted) {
    return null;
  }

  if (!hasUnlockedMirror && !mirror) {
    return (
      <div className="rounded-3xl border border-zinc-800 bg-zinc-950 px-6 py-5 space-y-4">
        <p className="text-xs font-medium uppercase tracking-[0.25em] text-zinc-500">
          {isResonance ? "Reflection Questions" : "Mirror"}
        </p>

        {questions.length > 0 ? (
          <div className="space-y-3 text-sm leading-7 text-zinc-300">
            {questions.map((question, index) => (
              <p key={index}>{question}</p>
            ))}
          </div>
        ) : (
          <>
            <p className="text-sm leading-7 text-zinc-400">
              When you’re ready, generate your two guiding questions for today.
            </p>

            <button
              type="button"
              onClick={generateQuestions}
              disabled={questionsLoading}
              className="inline-block rounded-xl border border-zinc-700 bg-zinc-900 px-4 py-2 text-sm text-zinc-200 transition-colors hover:bg-zinc-800 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {questionsLoading
                ? "Preparing your questions..."
                : "Generate my 2 guiding questions"}
            </button>
          </>
        )}

        {questionsError && (
          <p className="text-xs text-red-400">
            Couldn’t generate questions. Try again.
          </p>
        )}

        {questions.length > 0 && (
  <>
    <p className="text-xs text-zinc-500">
      These are drawn directly from what you’ve reflected today.
    </p>

    <form action={continueJourneyDayAction} className="mt-5 flex justify-end">
      <input type="hidden" name="weekNumber" value={weekNumber} />
      <input type="hidden" name="dayNumber" value={dayNumber} />

      <ContinueDayButton />
    </form>
  </>
)}
      </div>
    );
  }

  if (fullMirrorEligible && !fullMirrorUnlocked) {
  return (
    <div className="rounded-3xl border border-[#6d5b2b]/35 bg-[#17130d] px-6 py-6 space-y-5">
      <div className="space-y-2">
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
              Generate your two guiding questions for today.
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

        {questionsError && (
          <p className="text-xs text-red-400">
            Couldn’t generate questions. Try again.
          </p>
        )}
      </div>

      {questions.length > 0 && (
        <>
          <div className="rounded-2xl border border-[#6d5b2b]/35 bg-black/25 p-5">
            <div className="space-y-4">
              <p className="text-[11px] uppercase tracking-[0.22em] text-[#c8a96a]">
                Mirror preview
              </p>

              <div className="relative overflow-hidden rounded-2xl border border-[#6d5b2b]/25 bg-black/30 p-5">
                <div className="pointer-events-none select-none space-y-3 blur-[3px]">
                  <p className="text-sm leading-7 text-[#efe4c6]">
                    There is a deeper pattern forming across the way you are
                    describing closeness, protection, and what becomes difficult
                    to name.
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

                <div className="absolute inset-0 bg-gradient-to-b from-transparent via-[#17130d]/55 to-[#17130d]" />
              </div>

              <div className="space-y-3">
                <h3 className="text-lg text-[#f4e7c2]">
                  Unlock the full Mirror
                </h3>

                <p className="text-sm leading-7 text-zinc-300">
                  Your 2 questions point to the next layer. Mirror follows the
                  deeper continuity across your reflections and reveals the
                  pattern forming over time.
                </p>

                <a
                  href={`/mirror/unlock?weekNumber=${weekNumber}&dayNumber=${dayNumber}&tier=full`}
                  className="inline-flex items-center justify-center rounded-xl border border-[#8b6b2f]/60 bg-[#241b10] px-5 py-3 text-sm text-[#f1dfb4] transition hover:bg-[#2f2314]"
                >
                  Unlock Mirror — R720
                </a>
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
      )}
    </div>
  );
}

  if (liteMirrorEligible && !liteMirrorUnlocked) {
    return (
      <div className="rounded-3xl border border-[#7a6426]/40 bg-[#17130a] px-6 py-6 space-y-4">
        <div className="space-y-1">
          <p className="text-xs font-medium uppercase tracking-[0.25em] text-[#b6a36a]">
            Lite Mirror
          </p>
          <p className="text-sm text-[#f1e7c8]">An insight is ready.</p>
          <p className="text-sm leading-7 text-[#ddd1ad]">
            Because of your participation, your first Mirror synthesis has begun
            to take shape.
          </p>
          <p className="text-xs text-[#aa9d79]">
            Your Mirror remains available here until you choose to unlock it.
          </p>
        </div>

        <a
          href={`/mirror/unlock?weekNumber=${weekNumber}&dayNumber=${dayNumber}&tier=lite`}
          className="inline-block rounded-xl border border-[#8a7331]/50 bg-[#2a2210] px-4 py-2 text-sm text-[#f3e7bf] transition-colors hover:bg-[#352b15]"
        >
          Unlock Lite Mirror
        </a>
      </div>
    );
  }

  if (hasUnlockedMirror && !mirror) {
    return (
      <div className="rounded-3xl border border-[#6d5b2b]/35 bg-[#15120c] px-6 py-6 space-y-5">
        <div className="space-y-1">
          <p className="text-xs font-medium uppercase tracking-[0.25em] text-[#b6a36a]">
            {activeTier === "full" ? "Full Mirror" : "Lite Mirror"}
          </p>
        </div>

        {!isGenerating ? (
          <>
            <p className="text-sm leading-7 text-[#f1e7c8]">
              {activeTier === "full"
                ? "Your Full Mirror is ready to open."
                : "Your Lite Mirror is ready to open."}
            </p>

            <button
              type="button"
              onClick={startGenerate}
              className="inline-block rounded-xl border border-[#8a7331]/50 bg-[#2a2210] px-4 py-2 text-sm text-[#f3e7bf] transition-colors hover:bg-[#352b15]"
            >
              {activeTier === "full"
                ? "See what the Full Mirror sees"
                : "See what the Lite Mirror sees"}
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
    <div className="rounded-3xl border border-[#6d5b2b]/35 bg-[#15120c] px-6 py-6 space-y-6">
      <div className="space-y-1">
        <p className="text-xs font-medium uppercase tracking-[0.25em] text-[#b6a36a]">
          {activeTier === "full" ? "Full Mirror" : "Lite Mirror"}
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

      <div className="border-t border-zinc-800 pt-4 space-y-3">
        <p className="text-xs text-zinc-500">Did this feel accurate?</p>

        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => submitFeedback("yes")}
            disabled={feedbackState === "saving" || feedbackState === "saved"}
            className={`px-3 py-1.5 rounded-lg border text-xs transition-colors ${
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
            className={`px-3 py-1.5 rounded-lg border text-xs transition-colors ${
              selectedFeedback === "not_quite"
                ? "border-[#8a7331]/60 bg-[#2a2210] text-[#f3e7bf]"
                : "border-zinc-700 text-zinc-300 hover:border-zinc-500"
            }`}
          >
            Not quite
          </button>
        </div>

        {selectedFeedback === "not_quite" && feedbackState !== "saved" && (
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
                className="text-xs text-zinc-400 hover:text-zinc-200 transition-colors"
              >
                Send feedback
              </button>
            </div>
          </div>
        )}

        {feedbackState === "saved" && (
          <p className="text-xs text-zinc-500">
            Thanks. That helps refine the Mirror.
          </p>
        )}

        {feedbackState === "error" && (
          <p className="text-xs text-red-400">
            Couldn’t save feedback. Try again.
          </p>
        )}
      </div>
    </div>
  );
}