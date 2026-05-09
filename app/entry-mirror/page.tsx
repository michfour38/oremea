"use client";

import { useMemo, useState } from "react";

type EntryType = "female" | "male" | "neutral";

type Question = {
  key: string;
  text: string;
};

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
    { key: "past_connections_common", text: "What do your past connections have in common — before things go wrong?" },
    { key: "early_ignored_signal", text: "What did you feel early… that you later ignored?" },
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
  const [firstName, setFirstName] = useState("");
  const [email, setEmail] = useState("");
  const [panelIndex, setPanelIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [isGenerating, setIsGenerating] = useState(false);
  const [mirrorOutput, setMirrorOutput] = useState("");
  const [error, setError] = useState("");
const loadingLines = [
  "Noticing repeated language…",
  "Looking for emotional patterns…",
  "Separating attraction from clarity…",
  "Listening for tension beneath the answers…",
  "Building your Entry Mirror…",
];

const loadingLine =
  loadingLines[Math.floor(Date.now() / 2200) % loadingLines.length];

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
        title: "The pattern doesn’t break later.\nIt breaks at the beginning.",
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

  function nextPanel() {
    setError("");
    setPanelIndex((value) => Math.min(value + 1, panels.length - 1));
  }

  function previousPanel() {
    setError("");
    setPanelIndex((value) => Math.max(value - 1, 0));
  }

  function updateAnswer(questionKey: string, value: string) {
    setAnswers((current) => ({
      ...current,
      [questionKey]: value,
    }));
  }

  async function submitAndGenerate() {
    try {
      setIsGenerating(true);
      setError("");

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
          source: "entry-mirror-page",
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
        body: JSON.stringify({ sessionId: sessionData.session.id }),
      });

      const generateData = await generateRes.json();

      if (!generateRes.ok || !generateData?.output?.output) {
        throw new Error("Your reflection was saved, but the Mirror could not be generated.");
      }

      setMirrorOutput(generateData.output.output);
    } catch (err) {
      console.error(err);
      setError(err instanceof Error ? err.message : "Something went wrong. Please try again.");
    } finally {
      setIsGenerating(false);
    }
  }

  if (mirrorOutput) {
    return (
      <main className="min-h-screen bg-[#0A0A0A] px-6 py-12 text-[#EAEAEA]">
        <section className="mx-auto max-w-3xl">
          <p className="mb-16 text-sm tracking-[0.35em] text-[#BFBFBF]">OREMEA</p>

          <h1 className="mb-10 font-serif text-4xl leading-tight md:text-6xl">
            Your Entry Mirror
          </h1>

          <div className="whitespace-pre-wrap rounded-3xl border border-[#2A2418] bg-[#11100D] p-6 font-serif text-2xl leading-relaxed text-[#D8D0C0] md:p-10">
            {mirrorOutput}
          </div>

          <div className="mt-12 rounded-3xl border border-[#3A2F1C] bg-[#14110B] p-6 md:p-8">
            <p className="font-serif text-3xl text-[#EAEAEA]">
              You already recognise the pattern.
            </p>
            <p className="mt-5 font-serif text-2xl leading-relaxed text-[#BFBFBF]">
              What you haven’t done yet… is stay with it long enough to change it.
            </p>

            <div className="mt-8 space-y-4 font-serif text-2xl text-[#BFBFBF]">
              <p>Resonance</p>
              <p>Resonance + Mirror</p>
            </div>

            <p className="mt-8 text-sm tracking-[0.25em] text-[#C6A96B]">
              ADD YOUR LIVE LINK HERE
            </p>
          </div>
        </section>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[#0A0A0A] px-6 py-10 text-[#EAEAEA]">
      <section className="mx-auto flex min-h-[calc(100vh-5rem)] max-w-3xl flex-col justify-center">
        <div className="mb-10 flex items-center justify-between">
          <p className="text-sm tracking-[0.35em] text-[#BFBFBF]">OREMEA</p>
          <p className="text-sm tracking-[0.25em] text-[#C6A96B]">{progress}%</p>
        </div>

        <div className="mb-10 h-px bg-[#2A2418]">
          <div className="h-px bg-[#C6A96B]" style={{ width: `${progress}%` }} />
        </div>

        {currentPanel.type === "capture" ? (
          <div className="rounded-3xl border border-[#2A2418] bg-[#11100D] p-6 md:p-10">
            <h1 className="mb-8 font-serif text-4xl leading-tight md:text-6xl">
              Begin privately.
            </h1>

            <div className="mb-8 grid gap-3 md:grid-cols-3">
              {(["female", "male", "neutral"] as EntryType[]).map((type) => (
                <button
                  key={type}
                  type="button"
                  onClick={() => {
                    setEntryType(type);
                    setPanelIndex(1);
                    setAnswers({});
                    setError("");
                  }}
                  className={`rounded-2xl border px-5 py-4 text-left font-serif text-xl capitalize transition ${
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
                className="rounded-2xl border border-[#2A2418] bg-[#0A0A0A] px-5 py-4 font-serif text-xl text-[#EAEAEA] outline-none placeholder:text-[#777] focus:border-[#C6A96B]"
              />

              <input
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                placeholder="Email"
                type="email"
                className="rounded-2xl border border-[#2A2418] bg-[#0A0A0A] px-5 py-4 font-serif text-xl text-[#EAEAEA] outline-none placeholder:text-[#777] focus:border-[#C6A96B]"
              />
            </div>
          </div>
        ) : currentPanel.type === "statement" ? (
          <div className="rounded-3xl border border-[#2A2418] bg-[#11100D] p-6 md:p-10">
            <h1 className="whitespace-pre-wrap font-serif text-5xl leading-tight md:text-7xl">
              {currentPanel.title}
            </h1>

            {currentPanel.body ? (
              <p className="mt-12 whitespace-pre-wrap font-serif text-2xl leading-relaxed text-[#BFBFBF] md:text-3xl">
                {currentPanel.body}
              </p>
            ) : null}
          </div>
        ) : currentPanel.type === "question" ? (
          <div className="rounded-3xl border border-[#2A2418] bg-[#11100D] p-6 md:p-10">
            <p className="mb-10 text-sm tracking-[0.25em] text-[#C6A96B]">
              REFLECTION
            </p>

            <h1 className="mb-10 font-serif text-4xl leading-tight md:text-6xl">
              {currentPanel.question.text}
            </h1>

            <textarea
              value={answers[currentPanel.question.key] ?? ""}
              onChange={(event) =>
                updateAnswer(currentPanel.question.key, event.target.value)
              }
              rows={7}
              placeholder="Write honestly. This is private."
              className="w-full resize-none rounded-2xl border border-[#2A2418] bg-[#0A0A0A] px-5 py-4 font-serif text-2xl leading-relaxed text-[#EAEAEA] outline-none placeholder:text-[#666] focus:border-[#C6A96B]"
            />
          </div>
        ) : (
          <div className="rounded-3xl border border-[#2A2418] bg-[#11100D] p-6 md:p-10">
            <h1 className="font-serif text-5xl leading-tight md:text-7xl">
              Generate your Entry Mirror.
            </h1>

            <p className="mt-10 font-serif text-2xl leading-relaxed text-[#BFBFBF]">
              Your reflection will be generated from your actual answers — not a category, not a quiz result, not a generic summary.
            </p>

            {isGenerating ? (
  <div className="mt-12 rounded-3xl border border-[#2A2418] bg-[#0A0A0A] p-6">
    <p className="font-serif text-2xl text-[#EAEAEA]">
      {loadingLine}
    </p>
    <p className="mt-4 font-serif text-lg leading-relaxed text-[#BFBFBF]">
      This is being generated from your actual answers.
    </p>
  </div>
) : (
  <button
    type="button"
    onClick={submitAndGenerate}
    className="mt-12 rounded-full bg-[#C6A96B] px-8 py-4 font-serif text-xl text-[#0A0A0A] transition"
  >
    Generate my Entry Mirror
  </button>
)}
          </div>
        )}

        {error ? <p className="mt-6 font-serif text-lg text-red-300">{error}</p> : null}

        <div className="mt-8 flex items-center justify-between gap-4">
          <button
            type="button"
            disabled={panelIndex === 0 || isGenerating}
            onClick={previousPanel}
            className="rounded-full border border-[#2A2418] px-6 py-3 font-serif text-lg text-[#BFBFBF] disabled:cursor-not-allowed disabled:opacity-30"
          >
            Back
          </button>

          {currentPanel.type !== "generate" ? (
            <button
              type="button"
              disabled={!canContinue || isGenerating}
              onClick={nextPanel}
              className="rounded-full bg-[#C6A96B] px-7 py-3 font-serif text-lg text-[#0A0A0A] transition disabled:cursor-not-allowed disabled:opacity-40"
            >
              Continue
            </button>
          ) : null}
        </div>
      </section>
    </main>
  );
}