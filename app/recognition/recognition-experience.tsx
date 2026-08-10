"use client";

import { useEffect, useMemo, useRef, useState } from "react";

import {
  RECOGNITION_QUESTIONS,
  getRecognitionQuestionText,
  type RecognitionQuestion,
} from "@/src/lib/recognition/recognition.questions";

const LOADING_LINES = [
  "Reading what you wrote",
  "Finding the thread",
  "Preparing your reflection",
];

const DRAFT_KEY = "oremea-recognition-draft";

type Panel =
  | { type: "statement"; title: string; body?: string }
  | { type: "capture" }
  | { type: "question"; question: RecognitionQuestion }
  | { type: "generate" };

type RecognitionDraft = {
  firstName?: string;
  email?: string;
  creatorRef?: string;
  panelIndex?: number;
  answers?: Record<string, string>;
  hasUsedRefineOnce?: boolean;
  lastSessionId?: string;
};

export default function RecognitionExperience() {
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
      return;
    }

    const ref = params.get("ref")?.trim().toLowerCase() || "";
    if (ref) setCreatorRef(ref);

    const saved = window.localStorage.getItem(DRAFT_KEY);
    if (!saved) return;

    try {
      const draft = JSON.parse(saved) as RecognitionDraft;
      if (draft.firstName) setFirstName(draft.firstName);
      if (draft.email) setEmail(draft.email);
      if (draft.creatorRef) setCreatorRef(draft.creatorRef);
      if (draft.answers) setAnswers(draft.answers);
      if (draft.hasUsedRefineOnce) setHasUsedRefineOnce(true);
      if (draft.lastSessionId) setLastSessionId(draft.lastSessionId);
      if (
        typeof draft.panelIndex === "number" &&
        draft.firstName &&
        draft.email?.includes("@")
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
        hasUsedRefineOnce,
        lastSessionId,
      } satisfies RecognitionDraft),
    );
  }, [
    firstName,
    email,
    creatorRef,
    panelIndex,
    answers,
    hasUsedRefineOnce,
    lastSessionId,
  ]);

  useEffect(() => {
    if (!isGenerating) return;
    const interval = window.setInterval(() => {
      setLoadingIndex((current) => (current + 1) % LOADING_LINES.length);
    }, 2200);
    return () => window.clearInterval(interval);
  }, [isGenerating]);

  const panels = useMemo<Panel[]>(
    () => [
      {
        type: "statement",
        title: "Begin with what is here",
        body:
          "Recognition listens for what is already present in your own words\nBring whatever has your attention",
      },
      { type: "capture" },
      ...RECOGNITION_QUESTIONS.slice(0, 4).map((question) => ({
        type: "question" as const,
        question,
      })),
      {
        type: "statement",
        title: "Keep following what becomes clearer",
        body:
          "Your own words are beginning to create the picture\nStay with what has your attention",
      },
      ...RECOGNITION_QUESTIONS.slice(4, 8).map((question) => ({
        type: "question" as const,
        question,
      })),
      {
        type: "statement",
        title: "Notice what is becoming more distinct",
        body:
          "Some parts may feel clearer now\nLet the next answers sharpen what is already visible",
      },
      ...RECOGNITION_QUESTIONS.slice(8).map((question) => ({
        type: "question" as const,
        question,
      })),
      {
        type: "statement",
        title: "Recognition begins where something becomes visible",
      },
      { type: "generate" },
    ],
    [],
  );

  const currentPanel = panels[panelIndex];
  const currentQuestionIndex =
    currentPanel.type === "question"
      ? RECOGNITION_QUESTIONS.findIndex(
          (question) => question.key === currentPanel.question.key,
        )
      : -1;

  const previousAnswers =
    currentQuestionIndex > 0
      ? RECOGNITION_QUESTIONS.slice(0, currentQuestionIndex)
          .map((question, index) => {
            const priorContext = RECOGNITION_QUESTIONS.slice(0, index)
              .map((prior) => ({
                questionKey: prior.key,
                response: answers[prior.key]?.trim() ?? "",
              }))
              .filter((item) => item.response.length > 0);
            return {
              question,
              questionText: getRecognitionQuestionText(question.key, priorContext),
              answer: answers[question.key]?.trim() ?? "",
            };
          })
          .filter((item) => item.answer.length > 0)
      : [];

  const currentQuestionText =
    currentPanel.type === "question"
      ? getRecognitionQuestionText(
          currentPanel.question.key,
          RECOGNITION_QUESTIONS.slice(0, Math.max(currentQuestionIndex, 0))
            .map((question) => ({
              questionKey: question.key,
              response: answers[question.key]?.trim() ?? "",
            }))
            .filter((item) => item.response.length > 0),
        )
      : "";

  useEffect(() => {
    if (currentPanel.type !== "question") return;
    const frame = window.requestAnimationFrame(() => answerRef.current?.focus());
    return () => window.cancelAnimationFrame(frame);
  }, [panelIndex, currentPanel.type]);

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
          ? "Enter your first name and purchase email to continue"
          : "Give this a little more shape before continuing",
      );
      if (currentPanel.type === "question") focusCurrentAnswer();
      return;
    }

    if (currentPanel.type === "capture") {
      try {
        const res = await fetch("/api/recognition/check", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email }),
        });
        const data = await res.json();
        if (!res.ok) {
          throw new Error(data?.error || "Could not verify Recognition access");
        }
        if (!data?.availableProcesses || data.availableProcesses < 1) {
          setError(
            "No unused Recognition process was found for this email. Use the same email you used at checkout.",
          );
          return;
        }
      } catch (err) {
        setError(
          err instanceof Error ? err.message : "Could not verify Recognition access",
        );
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
    setAnswers((current) => ({ ...current, [questionKey]: value }));
    if (error === "Give this a little more shape before continuing") setError("");
  }

  function refineOnce() {
    if (hasUsedRefineOnce) return;
    setHasUsedRefineOnce(true);
    setRecognitionOutput("");
    setPanelIndex(2);
    setUsedBackPanels([]);
    setError("");
  }

  async function submitAndGenerate() {
    if (isGenerating) return;

    try {
      setIsGenerating(true);
      setError("");
      setLoadingIndex(0);

      let sessionId = lastSessionId;
      const mustSaveResponses = !sessionId || hasUsedRefineOnce;

      if (mustSaveResponses) {
        const formattedAnswers = RECOGNITION_QUESTIONS.map((question) => ({
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
        sessionId = sessionData.session.id;
        setLastSessionId(sessionId);
      }

      const generateRes = await fetch("/api/recognition/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          sessionId,
          regenerate: hasUsedRefineOnce,
        }),
      });
      const generateData = await generateRes.json();
      if (!generateRes.ok || !generateData?.output?.output) {
        throw new Error(
          generateData?.error ||
            "Your reflection was saved, but your Recognition could not be generated. Try Generate again; your purchase will not be used twice.",
        );
      }

      setRecognitionOutput(generateData.output.output);
      window.localStorage.removeItem(DRAFT_KEY);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Something went wrong. Please try again.",
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
              <p className="font-serif text-2xl md:text-3xl">
                You’ve now seen your Recognition
              </p>
              <p className="mt-5 font-serif text-xl leading-relaxed text-[#D8D0C0] md:text-2xl">
                Your purchase includes one opportunity to answer again with more
                depth and see what becomes clearer.
              </p>
              <button
                type="button"
                onClick={refineOnce}
                className="mt-8 rounded-full border border-[#D6B97A] bg-[#C6A96B] px-8 py-4 font-serif text-lg text-[#0A0A0A] transition hover:bg-[#D6B97A]"
              >
                Answer once more
              </button>
            </div>
          ) : null}

          <div className="mt-10 rounded-3xl border border-[#4A3D25] bg-[#14110B] p-6 md:p-8">
            <p className="font-serif text-2xl md:text-3xl">
              Something has become more visible
            </p>
            <p className="mt-5 font-serif text-xl leading-relaxed text-[#D8D0C0] md:text-2xl">
              Resonance gives you somewhere to stay with what Recognition revealed.
            </p>
            <a
              href="https://resonance.oremea.com"
              className="mt-8 inline-block rounded-full border border-[#C6A96B]/70 px-6 py-3 font-serif text-lg text-[#C6A96B] transition hover:border-[#D6B97A] hover:text-[#D6B97A]"
            >
              Continue to Resonance
            </a>
          </div>
        </section>
      </main>
    );
  }

  const questionError = currentPanel.type === "question" && Boolean(error);

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
            <p className="mb-6 font-serif text-lg leading-relaxed text-[#D8D0C0]">
              Use the same email you used when purchasing this Recognition process.
            </p>
            <div className="grid gap-4 md:grid-cols-2">
              <input
                value={firstName}
                onChange={(event) => setFirstName(event.target.value)}
                placeholder="First name"
                className="rounded-2xl border border-[#5C4A2B] bg-[#0A0A0A] px-5 py-4 font-serif text-lg outline-none placeholder:text-[#9A9285] focus:border-[#D6B97A]"
              />
              <input
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                placeholder="Purchase email"
                type="email"
                className="rounded-2xl border border-[#5C4A2B] bg-[#0A0A0A] px-5 py-4 font-serif text-lg outline-none placeholder:text-[#9A9285] focus:border-[#D6B97A]"
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
                  {previousAnswers.map(({ question, questionText, answer }) => (
                    <div key={question.key}>
                      <p className="font-serif text-base leading-relaxed text-[#B6A477] md:text-lg">
                        {questionText}
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
              {currentQuestionText}
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
              className="w-full resize-none rounded-2xl border border-[#8E7140] bg-[#0C0B08] px-5 py-4 font-serif text-xl leading-relaxed text-[#F3F0EA] outline-none placeholder:text-[#B9B0A2] focus:border-[#D6B97A] md:text-2xl"
            />
            {questionError ? (
              <p className="mt-4 font-serif text-lg text-red-300">{error}</p>
            ) : null}
          </div>
        ) : (
          <div className="rounded-3xl border border-[#4A3D25] bg-[#11100D] p-6 md:p-10">
            <h1 className="font-serif text-4xl leading-tight md:text-6xl">
              Generate Your Recognition
            </h1>
            <p className="mt-8 font-serif text-xl leading-relaxed text-[#D8D0C0] md:text-2xl">
              Your reflection is generated from your actual answers, not a category,
              quiz result, or generic summary.
            </p>
            {isGenerating ? (
              <div className="mt-10 rounded-3xl border border-[#4A3D25] bg-[#0A0A0A] p-6">
                <p className="font-serif text-2xl">{LOADING_LINES[loadingIndex]}</p>
                <p className="mt-4 font-serif text-lg leading-relaxed text-[#D8D0C0]">
                  This is being generated from your actual answers
                </p>
              </div>
            ) : (
              <button
                type="button"
                onClick={submitAndGenerate}
                className="mt-10 rounded-full border border-[#D6B97A] bg-[#C6A96B] px-8 py-4 font-serif text-lg text-[#0A0A0A] transition hover:bg-[#D6B97A]"
              >
                Generate my Recognition
              </button>
            )}
          </div>
        )}

        {error && currentPanel.type !== "question" ? (
          <div className="mt-6">
            <p className="font-serif text-lg text-red-300">{error}</p>
            {currentPanel.type === "capture" &&
            error.includes("No unused Recognition") ? (
              <a
                href="https://recognition.oremea.com"
                className="mt-4 inline-block text-sm text-[#C6A96B] underline underline-offset-4"
              >
                Purchase another Recognition process
              </a>
            ) : null}
          </div>
        ) : null}

        {currentPanel.type !== "generate" ? (
          <div className="mt-8 flex items-center justify-between gap-4">
            {panelIndex >= 3 ? (
              <button
                type="button"
                disabled={usedBackPanels.includes(panelIndex) || isGenerating}
                onClick={previousPanel}
                className="rounded-full border border-[#4A3D25] px-6 py-3 font-serif text-base text-[#D8D0C0] disabled:opacity-30"
              >
                Back
              </button>
            ) : (
              <div />
            )}
            <button
              type="button"
              onClick={nextPanel}
              disabled={isGenerating}
              className={`rounded-full border px-8 py-3 font-serif text-base transition ${
                canContinue
                  ? "border-[#D6B97A] bg-[#C6A96B] text-[#0A0A0A] hover:bg-[#D6B97A]"
                  : "border-[#6D552D] bg-[#1A140A] text-[#B59A60]"
              }`}
            >
              Continue
            </button>
          </div>
        ) : null}

        {currentPanel.type === "generate" && error ? (
          <p className="mt-6 font-serif text-lg text-red-300">{error}</p>
        ) : null}
      </section>
    </main>
  );
}
