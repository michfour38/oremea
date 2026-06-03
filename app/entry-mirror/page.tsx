"use client";

import { useEffect, useMemo, useState } from "react";

type EntryType = "female" | "male" | "neutral";

type Question = {
  key: string;
  text: string;
};

const LOADING_LINES = [
  "Reading what you wrote...",
  "Finding the thread...",
  "Preparing your reflection...",
];

const DRAFT_KEY = "oremea-entry-mirror-draft";

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

const QUESTIONS: Record<EntryType, Question[]> = {
  female: [
    { key: "past_connections_common", text: "What do your connections tend to have in common — before things go wrong?" },
    { key: "early_ignored_signal", text: "What did you notice early that you talked yourself out of trusting?" },
    { key: "fastest_pull", text: "What kind of energy pulls you in fastest?" },
    { key: "adjusting_point", text: "At what point do you start adjusting to keep the connection?" },
    { key: "slightly_off_response", text: "What do you do when something feels slightly off?" },
    { key: "speak_or_wait", text: "Do you speak early… or wait and hope it resolves?" },
    { key: "maintaining", text: "What are you trying to maintain — connection, potential, or peace?" },
    { key: "avoid_saying", text: "What do you avoid saying when something matters?" },
    { key: "quiet_or_clear", text: "What feels easier — staying quiet or being clear?" },
    { key: "protecting_from_feeling", text: "What are you trying not to feel?" },
    { key: "acted_earlier", text: "What would change if you acted earlier?" },
    { key: "notice_sooner", text: "What would you need to notice sooner?" },
    { key: "no_longer_explain", text: "What would you no longer explain away?" },
    { key: "first_clarity", text: "What would you choose if you trusted your first clarity?" },
  ],
  male: [
    { key: "initial_attraction", text: "What initially attracts you — looks, energy, attention, ease?" },
    { key: "know_interested", text: "When do you know you’re interested?" },
    { key: "interest_shift", text: "When do you start losing interest?" },
    { key: "what_changes", text: "What changes — in them, or in you?" },
    { key: "needing_space", text: "At what point do you start needing space?" },
    { key: "pressure_point", text: "What makes you feel pressured, even if nothing is said?" },
    { key: "when_real", text: "When things get more real, what happens inside you?" },
    { key: "consistent_or_pull_back", text: "Do you stay consistent… or do you start pulling back?" },
    { key: "harder_than_should", text: "What feels harder than it should — consistency, emotional openness, responsibility, or clarity?" },
    { key: "avoided_conversation", text: "What conversations do you delay or avoid?" },
    { key: "should_say", text: "What do you know you should say… but don’t?" },
    { key: "vague_or_direct", text: "What feels easier — staying vague, or being direct?" },
    { key: "consistent_after_attraction", text: "What would it look like to stay consistent after attraction?" },
    { key: "clear_early", text: "What would it take to be clear early instead of vague later?" },
    { key: "responsibility_point", text: "Where do you need to take responsibility instead of stepping back?" },
    { key: "pulling_back", text: "What are you actually avoiding by not showing up fully?" },
  ],
  neutral: [
    { key: "beneath_surface", text: "What do your past connections have in common — beneath the surface?" },
    { key: "right_early", text: "What tends to feel right early on?" },
    { key: "early_notice", text: "What do you notice… but don’t act on?" },
    { key: "realise_off", text: "When do you realise something is off?" },
    { key: "override", text: "What do you tend to override early?" },
    { key: "explain_away", text: "What do you explain away?" },
    { key: "tell_yourself_to_stay", text: "What do you tell yourself to stay?" },
    { key: "role_in_connection", text: "What role do you tend to take in connection?" },
    { key: "move_style", text: "Do you move toward, adapt, observe, lead, stabilise, or withdraw?" },
    { key: "unclear_response", text: "When things become unclear, what do you do?" },
    { key: "consistency_over_time", text: "How consistent is your behaviour over time?" },
    { key: "allow_continue", text: "What do you allow to continue longer than you should?" },
    { key: "manage_or_address", text: "What feels easier to manage than to address?" },
    { key: "clarity_vs_connection", text: "Where do you prioritise connection over clarity?" },
    { key: "act_earlier", text: "What would it look like to act earlier?" },
    { key: "trusted_first_clarity", text: "What would change if you trusted your first clarity?" },
    { key: "stop_negotiating", text: "What would you stop negotiating?" },
  ],
};

export default function EntryMirrorPage() {
  const [entryType, setEntryType] = useState<EntryType>("neutral");
const [creatorRef, setCreatorRef] = useState("");
  const [firstName, setFirstName] = useState("");
  const [email, setEmail] = useState("");
  const [panelIndex, setPanelIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [isGenerating, setIsGenerating] = useState(false);
  const [mirrorOutput, setMirrorOutput] = useState("");
const [hasUsedRefineOnce, setHasUsedRefineOnce] = useState(false);
const [lastSessionId, setLastSessionId] = useState("");
  const [error, setError] = useState("");
const [usedBackPanels, setUsedBackPanels] = useState<number[]>([]);
  const [loadingIndex, setLoadingIndex] = useState(0);

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

    if (draft.entryType) setEntryType(draft.entryType);
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
  entryType,
  firstName,
  email,
  creatorRef,
  panelIndex,
  answers,
})
  );
}, [entryType, firstName, email, creatorRef, panelIndex, answers]);

  useEffect(() => {
    if (!isGenerating) return;

    const interval = window.setInterval(() => {
      setLoadingIndex((current) => (current + 1) % LOADING_LINES.length);
    }, 2200);

    return () => window.clearInterval(interval);
  }, [isGenerating]);

  const panels = useMemo<Panel[]>(() => {
    const questions = QUESTIONS[entryType];

    return [
      {
        type: "statement",
        title:
          entryType === "male"
            ? "You’re not unlucky in relationships.\nYou’re repeating a pattern."
            : entryType === "female"
              ? "You don’t have a type.\nYou have a pattern."
              : "You don’t repeat people.\nYou repeat dynamics.",
        body:
          entryType === "neutral"
            ? "The faces change.\nThe circumstances change.\nBut the underlying experience becomes familiar."
            : "You meet different people.\nBut the dynamic feels familiar.\nAttraction happens fast.\nClarity comes later.",
      },
      { type: "capture" },
      ...questions.slice(0, 4).map((question) => ({ type: "question" as const, question })),
      {
        type: "statement",
        title: "Patterns don’t start at the end.",
        body: "They start in the early signal.\nThe quiet hesitation.\nThe moment you notice… and continue anyway.",
      },
      ...questions.slice(4, 10).map((question) => ({ type: "question" as const, question })),
      {
        type: "statement",
        title: "This is how the pattern usually unfolds:",
        body: "Something feels right.\nConnection builds.\nSomething shifts.\nYou notice.\nYou stay.\nIt repeats.",
      },
      ...questions.slice(10).map((question) => ({ type: "question" as const, question })),
      {
        type: "statement",
        title: "The moment you notice it, is the moment the pattern can change.",
      },
      {
        type: "statement",
        title: "You don’t miss the signs.\nYou override them.",
      },
      { type: "generate" },
    ];
  }, [entryType]);

  const currentPanel = panels[panelIndex];
  const progress = Math.round(((panelIndex + 1) / panels.length) * 100);

  const canContinue =
    currentPanel.type === "statement" ||
    currentPanel.type === "generate" ||
    (currentPanel.type === "capture"
      ? firstName.trim().length > 0 && email.trim().includes("@")
      : answers[currentPanel.question.key]?.trim().length >= 8);

  async function nextPanel() {
  if (!canContinue) {
    setError(
      currentPanel.type === "capture"
        ? "Enter your first name and email to continue."
        : "Write a little more before continuing."
    );
    return;
  }

  if (currentPanel.type === "capture") {
    try {
      const res = await fetch("/api/entry-mirror/check", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email,
        }),
      });

      const data = await res.json();

      if (data?.alreadyCompleted) {
        setError(
          "This Recognition reflection has already been completed for this email."
        );
        return;
      }
    } catch (err) {
      console.error(err);
      setError("Could not verify Recognition status.");
      return;
    }
  }

  setError("");
  setPanelIndex((value) => Math.min(value + 1, panels.length - 1));
}

  function previousPanel() {
  if (usedBackPanels.includes(panelIndex)) {
    setError("You’ve already gone back from this point.");
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
}

function refineOnce() {
  if (hasUsedRefineOnce) return;

  setHasUsedRefineOnce(true);
  setMirrorOutput("");
  setPanelIndex(2);
  setError("");
}

  async function submitAndGenerate() {
    try {
      setIsGenerating(true);
      setError("");
      setLoadingIndex(0);

      const formattedAnswers = QUESTIONS[entryType].map((question) => ({
        questionKey: question.key,
        response: answers[question.key] ?? "",
      }));

      const sessionRes = await fetch("/api/entry-mirror/session", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          firstName,
          email,
          entryType,
          source: creatorRef ? `creator:${creatorRef}` : "entry-mirror-page",
          answers: formattedAnswers,
        }),
      });

      const sessionData = await sessionRes.json();

      if (!sessionRes.ok || !sessionData?.session?.id) {
        throw new Error(sessionData?.error || "Could not save reflection.");
      }

      const generateRes = await fetch("/api/entry-mirror/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
  sessionId: sessionData.session.id,
  regenerate: hasUsedRefineOnce,
}),
      });

      const generateData = await generateRes.json();

      if (!generateRes.ok || !generateData?.output?.output) {
        throw new Error("Your reflection was saved, but the Mirror could not be generated.");
      }

setLastSessionId(sessionData.session.id);
      setMirrorOutput(generateData.output.output);
window.localStorage.removeItem(DRAFT_KEY);
    } catch (err) {
      console.error(err);
      setError(err instanceof Error ? err.message : "Something went wrong. Please try again.");
    } finally {
      setIsGenerating(false);
    }
  }

  if (mirrorOutput) {
    return (
      <main className="min-h-screen bg-[#0A0A0A] px-6 py-10 text-[#EAEAEA]">
        <section className="mx-auto max-w-3xl">
          <p className="mb-12 text-center text-xs tracking-[0.45em] text-[#BFBFBF]">
            OREMEA
          </p>

          <h1 className="mb-8 font-serif text-3xl leading-tight md:text-5xl">
            Your Entry Mirror
          </h1>

          <div className="whitespace-pre-wrap rounded-3xl border border-[#2A2418] bg-[#11100D] p-6 font-serif text-xl leading-relaxed text-[#D8D0C0] md:p-10 md:text-2xl">
  {mirrorOutput}
</div>

{!hasUsedRefineOnce ? (
  <div className="mt-10 rounded-3xl border border-[#3A2F1C] bg-[#14110B] p-6 md:p-8">
    <p className="font-serif text-2xl text-[#EAEAEA] md:text-3xl">
      You’ve now seen your Mirror reflection.
    </p>

    <p className="mt-5 font-serif text-xl leading-relaxed text-[#BFBFBF] md:text-2xl">
      Would you like to answer again with more depth, and see how much more precise the Mirror becomes?
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

<div className="mt-10 rounded-3xl border border-[#3A2F1C] bg-[#14110B] p-6 md:p-8">
            <p className="font-serif text-2xl text-[#EAEAEA] md:text-3xl">
              You already recognise the pattern.
            </p>
            <p className="mt-5 font-serif text-xl leading-relaxed text-[#BFBFBF] md:text-2xl">
              What you haven’t done yet… is stay with it long enough to change it.
            </p>

            <div className="mt-8 space-y-4 font-serif">
  <p className="text-2xl text-[#EAEAEA] md:text-3xl">
    Resonance
  </p>
  <p className="text-2xl text-[#C6A96B] md:text-3xl">
    Resonance + Mirror
  </p>
</div>

<a
  href="/#resonance"
  className="mt-8 inline-block rounded-full border border-[#C6A96B]/70 px-6 py-3 font-serif text-lg text-[#C6A96B] transition hover:border-[#D6B97A] hover:text-[#D6B97A]"
>
  Enter here — www.oremea.com
</a>
          </div>
        </section>
      </main>
    );
  }

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
          <div className="rounded-3xl border border-[#2A2418] bg-[#11100D] p-6 md:p-10">
            <h1 className="mb-8 font-serif text-3xl leading-tight md:text-5xl">
              Begin privately.
            </h1>

            <div className="mb-8 grid gap-3 md:grid-cols-3">
              {(["female", "male", "neutral"] as EntryType[]).map((type) => (
                <button
                  key={type}
                  type="button"
                  onClick={() => {
  setEntryType(type);
  setError("");
}}
                  className={`rounded-2xl border px-5 py-4 text-left font-serif text-lg capitalize transition md:text-xl ${
                    entryType === type
                      ? "border-[#C6A96B] bg-[#171208] text-[#EAEAEA]"
                      : "border-[#2A2418] bg-[#0A0A0A] text-[#BFBFBF] hover:border-[#A88A4A]"
                  }`}
                >
                  {type === "female" ? "Women" : type === "male" ? "Men" : "Neutral"}
                </button>
              ))}
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <input
                value={firstName}
                onChange={(event) => setFirstName(event.target.value)}
                placeholder="First name"
                className="rounded-2xl border border-[#2A2418] bg-[#0A0A0A] px-5 py-4 font-serif text-lg text-[#EAEAEA] outline-none placeholder:text-[#777] focus:border-[#C6A96B] md:text-xl"
              />

              <input
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                placeholder="Email"
                type="email"
                className="rounded-2xl border border-[#2A2418] bg-[#0A0A0A] px-5 py-4 font-serif text-lg text-[#EAEAEA] outline-none placeholder:text-[#777] focus:border-[#C6A96B] md:text-xl"
              />
            </div>
          </div>
        ) : currentPanel.type === "statement" ? (
          <div className="rounded-3xl border border-[#2A2418] bg-[#11100D] p-6 md:p-10">
            <h1 className="whitespace-pre-wrap font-serif text-4xl leading-[1.05] md:text-6xl">
              {currentPanel.title}
            </h1>

            {currentPanel.body ? (
              <p className="mt-10 whitespace-pre-wrap font-serif text-xl leading-relaxed text-[#BFBFBF] md:text-2xl">
                {currentPanel.body}
              </p>
            ) : null}
          </div>
        ) : currentPanel.type === "question" ? (
          <div className="rounded-3xl border border-[#2A2418] bg-[#11100D] p-6 md:p-10">
            <p className="mb-8 text-xs tracking-[0.25em] text-[#C6A96B]">
              REFLECTION
            </p>

            <h1 className="mb-8 font-serif text-3xl leading-tight md:text-5xl">
              {currentPanel.question.text}
            </h1>

            <textarea
              value={answers[currentPanel.question.key] ?? ""}
              onChange={(event) =>
                updateAnswer(currentPanel.question.key, event.target.value)
              }
              rows={7}
              placeholder="Write honestly. This is private."
              className="w-full resize-none rounded-2xl border border-[#2A2418] bg-[#0A0A0A] px-5 py-4 font-serif text-xl leading-relaxed text-[#EAEAEA] outline-none placeholder:text-[#666] focus:border-[#C6A96B] md:text-2xl"
            />
          </div>
        ) : (
          <div className="rounded-3xl border border-[#2A2418] bg-[#11100D] p-6 md:p-10">
            <h1 className="font-serif text-4xl leading-tight md:text-6xl">
              Generate your Entry Mirror.
            </h1>

            <p className="mt-8 font-serif text-xl leading-relaxed text-[#BFBFBF] md:text-2xl">
              Your reflection will be generated from your actual answers — not a category, not a quiz result, not a generic summary.
            </p>

            {isGenerating ? (
              <div className="mt-10 rounded-3xl border border-[#2A2418] bg-[#0A0A0A] p-6">
                <p className="font-serif text-2xl text-[#EAEAEA]">
                  {LOADING_LINES[loadingIndex]}
                </p>
                <p className="mt-4 font-serif text-lg leading-relaxed text-[#BFBFBF]">
                  This is being generated from your actual answers.
                </p>
              </div>
            ) : (
              <button
                type="button"
                onClick={submitAndGenerate}
                className="mt-10 rounded-full border border-[#D6B97A] bg-[#C6A96B] px-8 py-4 font-serif text-lg tracking-[0.06em] text-[#0A0A0A] shadow-[0_0_28px_rgba(198,169,107,0.18)] transition hover:bg-[#D6B97A]"
              >
                Generate my Entry Mirror
              </button>
            )}
          </div>
        )}

        {error ? (
  error.includes("already been completed") ? (
    <div className="mt-8 rounded-3xl border border-[#3A2F1C] bg-[#14110B] p-6 md:p-8">
      <p className="font-serif text-2xl text-[#EAEAEA] md:text-3xl">
        Your Recognition reflection already exists.
      </p>

      <p className="mt-5 font-serif text-xl leading-relaxed text-[#BFBFBF] md:text-2xl">
        Please check your inbox for your reflection email, or continue exploring Resonance below.
      </p>

      <a
        href="/#resonance"
        className="mt-8 inline-block rounded-full border border-[#C6A96B]/70 px-6 py-3 font-serif text-lg text-[#C6A96B] transition hover:border-[#D6B97A] hover:text-[#D6B97A]"
      >
        Continue into Resonance
      </a>
    </div>
  ) : (
    <p className="mt-6 font-serif text-lg text-red-300">
      {error}
    </p>
  )
) : null}

        <div className="mt-8 flex items-center justify-between gap-4">
          {panelIndex >= 3 && currentPanel.type !== "generate" ? (
  <button
    type="button"
    disabled={usedBackPanels.includes(panelIndex) || isGenerating}
    onClick={previousPanel}
    className="rounded-full border border-[#2A2418] px-6 py-3 font-serif text-base text-[#BFBFBF] transition hover:border-[#A88A4A] disabled:cursor-not-allowed disabled:opacity-30"
  >
    Back
  </button>
) : (
  <div />
)}

          {currentPanel.type !== "generate" ? (
            <button
              type="button"
              onClick={nextPanel}
              className={`rounded-full border px-8 py-3 font-serif text-base tracking-[0.06em] transition ${
                canContinue
                  ? "border-[#D6B97A] bg-[#C6A96B] text-[#0A0A0A] shadow-[0_0_28px_rgba(198,169,107,0.18)] hover:bg-[#D6B97A]"
                  : "border-[#3A2F1C] bg-[#171208] text-[#8F815E] hover:border-[#A88A4A]"
              }`}
            >
              Continue
            </button>
          ) : null}
        </div>
      </section>
    </main>
  );
}