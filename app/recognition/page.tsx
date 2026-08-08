"use client";

import { useEffect, useMemo, useRef, useState } from "react";

import {
  RECOGNITION_QUESTIONS,
  type RecognitionQuestion,
} from "@/src/lib/recognition/recognition.questions";

type Question = RecognitionQuestion;

const LOADING_LINES = [
  "Reading what you wrote",
  "Finding the thread",
  "Preparing your reflection",
];

const DRAFT_KEY = "oremea-recognition-draft";

type Panel =
  | {
      type: "statement";
      title: string;
      body?: string;
    }
  | {
      type: "capture";
    }
  | {
      type: "question";
      question: Question;
    }
  | {
      type: "generate";
    };

const QUESTIONS: Question[] = RECOGNITION_QUESTIONS;

export default function RecognitionPage() {
  const [creatorRef, setCreatorRef] = useState("");
  const [firstName, setFirstName] = useState("");
  const [email, setEmail] = useState("");
  const [panelIndex, setPanelIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [isGenerating, setIsGenerating] = useState(false);
  const [recognitionOutput, setRecognitionOutput] = useState("");
  const [hasUsedRefineOnce, setHasUsedRefineOnce] = useState(false);
  const [lastSessionId, setLastSessionId] = useState("");
  const [error, setError] = useState("");
  const [usedBackPanels, setUsedBackPanels] = useState<number[]>([]);
  const [loadingIndex, setLoadingIndex] = useState(0);
  const answerRef = useRef<HTMLTextAreaElement | null>(null);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const fresh = params.get("fresh") === "1";

    if (fresh) {
      window.localStorage.removeItem(DRAFT_KEY);
      setPanelIndex(0);
      setAnswers({});
      setError("");
      return;
    }

    const ref = params.get("ref")?.trim().toLowerCase() || "";
    if (ref) setCreatorRef(ref);

    const saved = window.localStorage.getItem(DRAFT_KEY);
    if (!saved) return;

    try {
      const draft = JSON.parse(saved);

      if (draft.firstName) setFirstName(draft.firstName);
      if (draft.email) setEmail(draft.email);
      if (draft.answers) setAnswers(draft.answers);
      if (
        typeof draft.panelIndex === "number" &&
        draft.firstName &&
        draft.email &&
        String(draft.email).includes("@")
      ) {
        setPanelIndex(draft.panelIndex);
      }
    } catch {
      window.localStorage.removeItem(DRAFT_KEY);
    }
  }, []);

  useEffect(() => {
    window.localStorage.setItem(
      DRAFT_KEY,
      JSON.stringify({
        firstName,
        email,
        creatorRef,
        panelIndex,
        answers,
      })
    );
  }, [firstName, email, creatorRef, panelIndex, answers]);

  useEffect(() => {
    if (!isGenerating) return;

    const interval = window.setInterval(() => {
      setLoadingIndex((current) => (current + 1) % LOADING_LINES.length);
    }, 2200);

    return () => window.clearInterval(interval);
  }, [isGenerating]);

  const panels = useMemo<Panel[]>(() => {
    const questions = QUESTIONS;

    return [
      {
        type: "statement",
        title: "Begin with what is here",
        body:
          "Recognition listens for what is already present in your own words\nBring whatever has your attention",
      },
      { type: "capture" },
      ...questions.slice(0, 4).map((question) => ({
        type: "question" as const,
        question,
      })),
      {
        type: "statement",
        title: "Keep following what becomes clearer",
        body:
          "Your own words are beginning to create the picture\nStay with what has your attention",
      },
      ...questions.slice(4, 10).map((question) => ({
        type: "question" as const,
        question,
      })),
      {
        type: "statement",
        title: "Notice what is becoming more distinct",
        body:
          "Some parts may feel clearer now\nLet the next answers sharpen what is already visible",
      },
      ...questions.slice(10).map((question) => ({
        type: "question" as const,
        question,
      })),
      {
        type: "statement",
        title: "Recognition begins where something becomes visible",
      },
      {
        type: "statement",
        title: "What you can see now gives Recognition something real to work with",
      },
      { type: "generate" },
    ];
  }, []);

  const currentPanel = panels[panelIndex];

  useEffect(() => {
    if (currentPanel.type !== "question") return;

    const frame = window.requestAnimationFrame(() => {
      answerRef.current?.focus();
    });

    return () => window.cancelAnimationFrame(frame);
  }, [panelIndex, currentPanel.type]);

  const currentQuestionIndex =
    currentPanel.type === "question"
      ? QUESTIONS.findIndex(
          (question) => question.key === currentPanel.question.key
        )
      : -1;

  const previousAnswers =
    currentQuestionIndex > 0
      ? QUESTIONS.slice(0, currentQuestionIndex)
          .map((question) => ({
            question,
            answer: answers[question.key]?.trim() ?? "",
          }))
          .filter((item) => item.answer.length > 0)
      : [];

  const progress = Math.round(((panelIndex + 1) / panels.length) * 100);

  const canContinue =
    currentPanel.type === "statement" ||
    currentPanel.type === "generate" ||
    (currentPanel.type === "capture"
      ? firstName.trim().length > 0 && email.trim().includes("@")
      : answers[currentPanel.question.key]?.trim().length >= 20);

  function focusCurrentAnswer() {
    window.requestAnimationFrame(() => {
      answerRef.current?.focus();
      answerRef.current?.scrollIntoView({ behavior: "smooth", block: "center" });
    });
  }

  async function nextPanel() {
    if (!canContinue) {
      setError(
        currentPanel.type === "capture"
          ? "Enter your first name and email to continue"
          : "Give this a little more shape before continuing"
      );

      if (currentPanel.type === "question") focusCurrentAnswer();
      return;
    }

    if (currentPanel.type === "capture") {
      try {
        const res = await fetch("/api/recognition/check", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ email }),
        });

        const data = await res.json();

        if (data?.alreadyCompleted) {
          setError(
            "This Recognition reflection has already been completed for this email"
          );
          return;
        }
      } catch (err) {
        console.error(err);
        setError("Could not verify Recognition status");
        return;
      }
    }

    setError("");
    setPanelIndex((value) => Math.min(value + 1, panels.length - 1));
  }

  function previousPanel() {
    if (usedBackPanels.includes(panelIndex)) {
      setError("You’ve already gone back from this point");
      return;
    }

    setError("");
    setUsedBackPanels((current) => [...current, panelIndex]);
    setPanelIndex((value) => Math.max(value - 1, 0));
  }

  function updateAnswer(questionKey: string, value: string) {
    setAnswers((current) => ({
      ...current,
      [questionKey]: value,
    }));

    if (error === "Give this a little more shape before continuing") {
      setError("");
    }
  }

  function refineOnce() {
    if (hasUsedRefineOnce) return;

    setHasUsedRefineOnce(true);
    setRecognitionOutput("");
    setPanelIndex(2);
    setError("");
  }

  async function submitAndGenerate() {
    try {
      setIsGenerating(true);
      setError("");
      setLoadingIndex(0);

      const formattedAnswers = QUESTIONS.map((question) => ({
        questionKey: question.key,
        response: answers[question.key] ?? "",
      }));

      const sessionRes = await fetch("/api/recognition/session", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          firstName,
          email,
          source: creatorRef ? `creator:${creatorRef}` : "recognition-page",
          answers: formattedAnswers,
          refineSessionId: hasUsedRefineOnce ? lastSessionId : null,
        }),
      });

      const sessionData = await sessionRes.json();

      if (!sessionRes.ok || !sessionData?.session?.id) {
        throw new Error(sessionData?.error || "Could not save reflection");
      }

      const generateRes = await fetch("/api/recognition/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          sessionId: sessionData.session.id,
          regenerate: hasUsedRefineOnce,
        }),
      });

      const generateData = await generateRes.json();

      if (!generateRes.ok || !generateData?.output?.output) {
        throw new Error(
          "Your reflection was saved, but your Recognition could not be generated"
        );
      }

      setLastSessionId(sessionData.session.id);
      setRecognitionOutput(generateData.output.output);
      window.localStorage.removeItem(DRAFT_KEY);
    } catch (err) {
      console.error(err);
      setError(
        err instanceof Error ? err.message : "Something went wrong Please try again"
      );
    } finally {
      setIsGenerating(false);
    }
  }

  if (recognitionOutput) {
    return (
      <main className="min-h-screen bg-[#0A0A0A] px-6 py-10 text-[#EAEAEA]">
        <section className="mx-auto max-w-3xl">
          <p className="mb-12 text-center text-xs tracking-[0.45em] text-[#BFBFBF]">
            OREMEA
          </p>

          <h1 className="mb-8 font-serif text-3xl leading-tight md:text-5xl">
            Your Recognition
          </h1>

          <div className="whitespace-pre-wrap rounded-3xl border border-[#4A3D25] bg-[#11100D] p-6 font-serif text-xl leading-relaxed text-[#E2D8C5] md:p-10 md:text-2xl">
            {recognitionOutput}
          </div>

          {!hasUsedRefineOnce ? (
            <div className="mt-10 rounded-3xl border border-[#4A3D25] bg-[#14110B] p-6 md:p-8">
              <p className="font-serif text-2xl text-[#EAEAEA] md:text-3xl">
                You’ve now seen your Recognition
              </p>

              <p className="mt-5 font-serif text-xl leading-relaxed text-[#D8D0C0] md:text-2xl">
                Would you like to answer again with more depth and see what becomes clearer?
              </p>

              <button
                type="button"
                onClick={refineOnce}
                className="mt-8 rounded-full border border-[#D6B97A] bg-[#C6A96B] px-8 py-4 font-serif text-lg tracking-[0.06em] text-[#0A0A0A] shadow-[0_0_28px_rgba(198,169,107,0.18)] transition hover:bg-[#D6B97A]"
              >
                Answer once more
              </button>
            </div>
          ) : null}

          <div className="mt-10 rounded-3xl border border-[#4A3D25] bg-[#14110B] p-6 md:p-8">
            <p className="font-serif text-2xl text-[#EAEAEA] md:text-3xl">
              Something has become more visible
            </p>

            <p className="mt-5 font-serif text-xl leading-relaxed text-[#D8D0C0] md:text-2xl">
              Resonance gives you somewhere to stay with what Recognition revealed
            </p>

            <div className="mt-8 font-serif">
              <p className="text-2xl text-[#C6A96B] md:text-3xl">Resonance</p>
            </div>

            <a
              href="/entry"
              className="mt-8 inline-block rounded-full border border-[#C6A96B]/70 px-6 py-3 font-serif text-lg text-[#C6A96B] transition hover:border-[#D6B97A] hover:text-[#D6B97A]"
            >
              Continue to Resonance
            </a>
          </div>
        </section>
      </main>
    );
  }

  const completedError = error.includes("already been completed");
  const questionError = currentPanel.type === "question" && error && !completedError;

  return (
    <main className="min-h-screen bg-[#0A0A0A] px-6 py-8 text-[#EAEAEA]">
      <section className="mx-auto flex min-h-[calc(100vh-4rem)] max-w-3xl flex-col justify-center">
        <div className="mb-8 text-center">
          <p className="text-xs tracking-[0.45em] text-[#BFBFBF]">OREMEA</p>
        </div>

        <div className="mb-8 h-px bg-[#2A2418]">
          <div className="h-px bg-[#C6A96B]" style={{ width: `${progress}%` }} />
        </div>

        {currentPanel.type === "capture" ? (
          <div className="rounded-3xl border border-[#4A3D25] bg-[#11100D] p-6 md:p-10">
            <h1 className="mb-8 font-serif text-3xl leading-tight md:text-5xl">
              Begin privately
            </h1>

            <div className="grid gap-4 md:grid-cols-2">
              <input
                value={firstName}
                onChange={(event) => setFirstName(event.target.value)}
                placeholder="First name"
                className="rounded-2xl border border-[#5C4A2B] bg-[#0A0A0A] px-5 py-4 font-serif text-lg text-[#EAEAEA] outline-none placeholder:text-[#9A9285] focus:border-[#D6B97A] md:text-xl"
              />

              <input
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                placeholder="Email"
                type="email"
                className="rounded-2xl border border-[#5C4A2B] bg-[#0A0A0A] px-5 py-4 font-serif text-lg text-[#EAEAEA] outline-none placeholder:text-[#9A9285] focus:border-[#D6B97A] md:text-xl"
              />
            </div>
          </div>
        ) : currentPanel.type === "statement" ? (
          <div className="rounded-3xl border border-[#4A3D25] bg-[#11100D] p-6 md:p-10">
            <h1 className="whitespace-pre-wrap font-serif text-4xl leading-[1.05] md:text-6xl">
              {currentPanel.title}
            </h1>

            {currentPanel.body ? (
              <p className="mt-10 whitespace-pre-wrap font-serif text-xl leading-relaxed text-[#D8D0C0] md:text-2xl">
                {currentPanel.body}
              </p>
            ) : null}
          </div>
        ) : currentPanel.type === "question" ? (
          <div className="rounded-3xl border border-[#4A3D25] bg-[#11100D] p-6 md:p-10">
            {previousAnswers.length > 0 ? (
              <div className="mb-10 border-b border-[#4A3D25] pb-10">
                <p className="mb-6 text-xs tracking-[0.25em] text-[#B6A477]">
                  WHAT YOU’VE SAID SO FAR
                </p>

                <div className="space-y-6">
                  {previousAnswers.map(({ question, answer }) => (
                    <div key={question.key}>
                      <p className="font-serif text-base leading-relaxed text-[#B6A477] md:text-lg">
                        {question.text}
                      </p>

                      <p className="mt-2 whitespace-pre-wrap font-serif text-lg leading-relaxed text-[#E2D8C5] md:text-xl">
                        {answer}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            ) : null}

            <p className="mb-8 text-xs tracking-[0.25em] text-[#D6B97A]">
              REFLECTION
            </p>

            <h1 className="font-serif text-3xl leading-tight text-[#F3F0EA] md:text-5xl">
              {currentPanel.question.text}
            </h1>

            {currentPanel.question.support ? (
              <p className="mb-8 mt-5 font-serif text-lg leading-relaxed text-[#C9B98F] md:text-xl">
                {currentPanel.question.support}
              </p>
            ) : (
              <div className="mb-8" />
            )}

            <textarea
              ref={answerRef}
              value={answers[currentPanel.question.key] ?? ""}
              onChange={(event) =>
                updateAnswer(currentPanel.question.key, event.target.value)
              }
              rows={7}
              placeholder="Write honestly  This is private"
              className="w-full resize-none rounded-2xl border border-[#8E7140] bg-[#0C0B08] px-5 py-4 font-serif text-xl leading-relaxed text-[#F3F0EA] outline-none placeholder:text-[#B9B0A2] focus:border-[#D6B97A] focus:ring-1 focus:ring-[#D6B97A]/30 md:text-2xl"
            />

            {questionError ? (
              <p className="mt-4 font-serif text-lg text-red-300">{error}</p>
            ) : null}

            <div className="mt-6 flex items-center justify-between gap-4">
              {panelIndex >= 3 ? (
                <button
                  type="button"
                  disabled={usedBackPanels.includes(panelIndex) || isGenerating}
                  onClick={previousPanel}
                  className="rounded-full border border-[#5C4A2B] px-6 py-3 font-serif text-base text-[#D8D0C0] transition hover:border-[#A88A4A] disabled:cursor-not-allowed disabled:opacity-30"
                >
                  Back
                </button>
              ) : (
                <div />
              )}

              <button
                type="button"
                onClick={nextPanel}
                className={`rounded-full border px-8 py-3 font-serif text-base tracking-[0.06em] transition ${
                  canContinue
                    ? "border-[#D6B97A] bg-[#C6A96B] text-[#0A0A0A] shadow-[0_0_28px_rgba(198,169,107,0.18)] hover:bg-[#D6B97A]"
                    : "border-[#6D552D] bg-[#1A140A] text-[#B59A60] hover:border-[#A88A4A]"
                }`}
              >
                Continue
              </button>
            </div>
          </div>
        ) : (
          <div className="rounded-3xl border border-[#4A3D25] bg-[#11100D] p-6 md:p-10">
            <h1 className="font-serif text-4xl leading-tight md:text-6xl">
              Generate Your Recognition
            </h1>

            <p className="mt-8 font-serif text-xl leading-relaxed text-[#D8D0C0] md:text-2xl">
              Your reflection will be generated from your actual answers — not a category, not a quiz result, not a generic summary
            </p>

            {isGenerating ? (
              <div className="mt-10 rounded-3xl border border-[#4A3D25] bg-[#0A0A0A] p-6">
                <p className="font-serif text-2xl text-[#EAEAEA]">
                  {LOADING_LINES[loadingIndex]}
                </p>
                <p className="mt-4 font-serif text-lg leading-relaxed text-[#D8D0C0]">
                  This is being generated from your actual answers
                </p>
              </div>
            ) : (
              <button
                type="button"
                onClick={submitAndGenerate}
                className="mt-10 rounded-full border border-[#D6B97A] bg-[#C6A96B] px-8 py-4 font-serif text-lg tracking-[0.06em] text-[#0A0A0A] shadow-[0_0_28px_rgba(198,169,107,0.18)] transition hover:bg-[#D6B97A]"
              >
                Generate my Recognition
              </button>
            )}
          </div>
        )}

        {completedError ? (
          <div className="mt-8 rounded-3xl border border-[#4A3D25] bg-[#14110B] p-6 md:p-8">
            <p className="font-serif text-2xl text-[#EAEAEA] md:text-3xl">
              Your Recognition reflection already exists
            </p>

            <p className="mt-5 font-serif text-xl leading-relaxed text-[#D8D0C0] md:text-2xl">
              Please check your inbox for your reflection email, or continue exploring Resonance below
            </p>

            <a
              href="/entry"
              className="mt-8 inline-block rounded-full border border-[#C6A96B]/70 px-6 py-3 font-serif text-lg text-[#C6A96B] transition hover:border-[#D6B97A] hover:text-[#D6B97A]"
            >
              Continue to Resonance
            </a>
          </div>
        ) : error && currentPanel.type !== "question" ? (
          <p className="mt-6 font-serif text-lg text-red-300">{error}</p>
        ) : null}

        {currentPanel.type !== "question" && currentPanel.type !== "generate" ? (
          <div className="mt-8 flex items-center justify-between gap-4">
            {panelIndex >= 3 ? (
              <button
                type="button"
                disabled={usedBackPanels.includes(panelIndex) || isGenerating}
                onClick={previousPanel}
                className="rounded-full border border-[#4A3D25] px-6 py-3 font-serif text-base text-[#D8D0C0] transition hover:border-[#A88A4A] disabled:cursor-not-allowed disabled:opacity-30"
              >
                Back
              </button>
            ) : (
              <div />
            )}

            <button
              type="button"
              onClick={nextPanel}
              className={`rounded-full border px-8 py-3 font-serif text-base tracking-[0.06em] transition ${
                canContinue
                  ? "border-[#D6B97A] bg-[#C6A96B] text-[#0A0A0A] shadow-[0_0_28px_rgba(198,169,107,0.18)] hover:bg-[#D6B97A]"
                  : "border-[#6D552D] bg-[#1A140A] text-[#B59A60] hover:border-[#A88A4A]"
              }`}
            >
              Continue
            </button>
          </div>
        ) : null}
      </section>
    </main>
  );
}
