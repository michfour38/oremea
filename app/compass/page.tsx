"use client";

import { CompassPriorityFlow } from "@/components/compass/CompassPriorityFlow";
import { CompassAreaFlow } from "@/components/compass/CompassAreaFlow";
import { CompassCard } from "@/components/compass/CompassCard";
import Image from "next/image";
import { useEffect, useMemo, useState } from "react";

import {
  COMPASS_AREA_QUESTIONS,
  analyzeAreaResponse,
  buildAdaptiveRecursiveQuestion,
  buildAreaMirrorReflection,
  calibrateExecutionStep,
  continueCompassDiscussion,
  createRecursiveLayer,
  evaluateResonanceBridge,
  generateNextStep,
  getRecursiveQuestion,
  mapResistance,
  reflectCoreValues,
  reflectPrimaryArea,
  type CompassAreaResponse,
  type CompassDiscussionMessage,
  type CompassGoalArea,
  type CompassRecursiveLayer,
  type CompassResistanceMap,
} from "@/src/lib/compass/session";

type CompassPhase =
  | "loading"
  | "resume"
  | "intro"
  | "area"
  | "analyzing"
  | "area_mirror"
  | "area_confirmation"
  | "depth_intro"
  | "depth"
  | "core_reflection"
  | "resistance"
  | "discussion"
  | "execution_check"
  | "complete";

type StoredCompassSession = {
  phase?: string | null;
  selected_area?: string | null;
  area_responses?: unknown;
  recursive_layers?: unknown;
  resistance_map?: unknown;
  discussion_messages?: unknown;
  proposed_step?: string | null;
  final_step?: string | null;
};

const AREA_LABELS: Record<CompassGoalArea, string> = {
  relationships: "Relationships",
  income: "Income",
  health: "Health",
  spirituality: "Spirituality",
  investments: "Investments",
  network: "Network",
  knowledge: "Knowledge",
  lifestyle: "Lifestyle",
};

const BODY_TEXT = "text-zinc-400";

export default function CompassPage() {
  const [phase, setPhase] = useState<CompassPhase>("loading");
  const [savedSession, setSavedSession] = useState<StoredCompassSession | null>(null);
  const [sessionLoaded, setSessionLoaded] = useState(false);
  const [hasStarted, setHasStarted] = useState(false);

  const [areaIndex, setAreaIndex] = useState(0);
  const [answer, setAnswer] = useState("");
  const [areaResponses, setAreaResponses] = useState<CompassAreaResponse[]>([]);
  const [selectedArea, setSelectedArea] = useState<CompassGoalArea | null>(null);
  const [recursiveLayers, setRecursiveLayers] = useState<CompassRecursiveLayer[]>([]);
  const [recursiveAnswer, setRecursiveAnswer] = useState("");
  const [extraReflection, setExtraReflection] = useState("");
  const [resistanceAnswer, setResistanceAnswer] = useState("");
  const [resistanceMap, setResistanceMap] = useState<CompassResistanceMap | null>(null);
  const [proposedStep, setProposedStep] = useState("");
  const [executionFeeling, setExecutionFeeling] = useState("");
  const [finalStep, setFinalStep] = useState("");
  const [discussionInput, setDiscussionInput] = useState("");
  const [discussionMessages, setDiscussionMessages] = useState<CompassDiscussionMessage[]>([]);

  const currentArea = COMPASS_AREA_QUESTIONS[areaIndex];

  const areaMirror = useMemo(() => buildAreaMirrorReflection(areaResponses), [areaResponses]);
  const primaryReflection = useMemo(() => reflectPrimaryArea(areaResponses), [areaResponses]);
  const coreReflection = useMemo(() => reflectCoreValues(recursiveLayers), [recursiveLayers]);
  const resonanceBridge = useMemo(() => evaluateResonanceBridge(areaResponses), [areaResponses]);

  const selectedAreaLabel = selectedArea ? AREA_LABELS[selectedArea] : "your chosen goal";

  useEffect(() => {
    async function loadSession() {
      try {
        const response = await fetch("/api/compass/session", { method: "GET" });

        if (!response.ok) {
          setPhase("intro");
          setSessionLoaded(true);
          return;
        }

        const data = await response.json();

        if (data.session) {
          setSavedSession(data.session);
          setPhase("resume");
        } else {
          setPhase("intro");
        }
      } catch {
        setPhase("intro");
      } finally {
        setSessionLoaded(true);
      }
    }

    loadSession();
  }, []);

  useEffect(() => {
    window.history.pushState({ compass: true }, "", window.location.href);

    function handleBrowserBack() {
      if (phase === "intro" || phase === "loading" || phase === "resume") {
        window.history.pushState({ compass: true }, "", window.location.href);
        return;
      }

      goBackInsideCompass();
      window.history.pushState({ compass: true }, "", window.location.href);
    }

    window.addEventListener("popstate", handleBrowserBack);

    return () => {
      window.removeEventListener("popstate", handleBrowserBack);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phase, areaIndex, recursiveLayers.length]);

  useEffect(() => {
    if (
      !sessionLoaded ||
      !hasStarted ||
      phase === "loading" ||
      phase === "resume" ||
      phase === "analyzing"
    ) {
      return;
    }

    const timeout = window.setTimeout(() => {
      fetch("/api/compass/session", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          phase,
          selectedArea,
          areaResponses,
          recursiveLayers,
          resistanceMap,
          discussionMessages,
          proposedStep,
          finalStep,
        }),
      }).catch(() => {});
    }, 700);

    return () => window.clearTimeout(timeout);
  }, [
    sessionLoaded,
    hasStarted,
    phase,
    selectedArea,
    areaResponses,
    recursiveLayers,
    resistanceMap,
    discussionMessages,
    proposedStep,
    finalStep,
  ]);

  function pauseThen(next: () => void) {
    setPhase("analyzing");
    window.setTimeout(next, 1800);
  }

  function goBackInsideCompass() {
    if (phase === "area") {
      if (areaIndex > 0) {
        setAreaIndex((current) => Math.max(0, current - 1));
        setPhase("area");
        return;
      }

      setPhase("intro");
      return;
    }

    if (phase === "area_mirror") {
      setAreaIndex(COMPASS_AREA_QUESTIONS.length - 1);
      setPhase("area");
      return;
    }

    if (phase === "area_confirmation") {
      setPhase("area_mirror");
      return;
    }

    if (phase === "depth_intro") {
      setPhase("area_confirmation");
      return;
    }

    if (phase === "depth") {
      if (recursiveLayers.length > 0) {
        setRecursiveLayers((current) => current.slice(0, -1));
        setPhase("depth");
        return;
      }

      setPhase("depth_intro");
      return;
    }

    if (phase === "core_reflection") {
      setPhase("depth");
      return;
    }

    if (phase === "resistance") {
      setPhase("core_reflection");
      return;
    }

    if (phase === "discussion") {
      setPhase("resistance");
      return;
    }

    if (phase === "execution_check") {
      setPhase("discussion");
      return;
    }

    if (phase === "complete") {
      setPhase("execution_check");
    }
  }

  function beginNewSession() {
    setSavedSession(null);
    setHasStarted(true);
    setAreaIndex(0);
    setAnswer("");
    setAreaResponses([]);
    setSelectedArea(null);
    setRecursiveLayers([]);
    setRecursiveAnswer("");
    setExtraReflection("");
    setResistanceAnswer("");
    setResistanceMap(null);
    setProposedStep("");
    setExecutionFeeling("");
    setFinalStep("");
    setDiscussionInput("");
    setDiscussionMessages([]);
    setPhase("intro");
  }

  function resumeSession() {
    if (!savedSession) {
      setPhase("intro");
      return;
    }

    const restoredAreaResponses = toArray<CompassAreaResponse>(savedSession.area_responses);
    const restoredRecursiveLayers = toArray<CompassRecursiveLayer>(savedSession.recursive_layers);
    const restoredMessages = toArray<CompassDiscussionMessage>(savedSession.discussion_messages);

    setAreaResponses(restoredAreaResponses);
    setRecursiveLayers(restoredRecursiveLayers);
    setDiscussionMessages(restoredMessages);
    setResistanceMap(toObject<CompassResistanceMap>(savedSession.resistance_map));
    setProposedStep(savedSession.proposed_step ?? "");
    setFinalStep(savedSession.final_step ?? "");

    const restoredArea = isCompassGoalArea(savedSession.selected_area)
      ? savedSession.selected_area
      : null;

    setSelectedArea(restoredArea);
    setAreaIndex(Math.min(restoredAreaResponses.length, COMPASS_AREA_QUESTIONS.length - 1));
    setHasStarted(true);
    setPhase(normalizePhase(savedSession.phase));
  }

  function submitAreaAnswer() {
    if (!currentArea || !answer.trim()) return;

    setHasStarted(true);

    const analyzed = analyzeAreaResponse({
      area: currentArea.area,
      answer,
    });

    setAreaResponses((current) => [...current, analyzed]);
    setAnswer("");

    if (areaIndex < COMPASS_AREA_QUESTIONS.length - 1) {
      pauseThen(() => {
        setAreaIndex((current) => current + 1);
        setPhase("area");
      });
      return;
    }

    pauseThen(() => setPhase("area_mirror"));
  }

  function chooseArea(area: CompassGoalArea) {
    setHasStarted(true);
    setSelectedArea(area);
    pauseThen(() => setPhase("depth_intro"));
  }

  function submitRecursiveAnswer() {
    if (!recursiveAnswer.trim()) return;

    setHasStarted(true);

    const layerNumber = recursiveLayers.length + 1;

    const question = buildAdaptiveRecursiveQuestion({
      layer: layerNumber,
      selectedAreaLabel,
      previousAnswer: recursiveLayers[recursiveLayers.length - 1]?.answer ?? "",
      firstAnswer: areaResponses.find((response) => response.area === selectedArea)?.answer ?? "",
    });

    const fallbackQuestion = getRecursiveQuestion(layerNumber);

    const layer = createRecursiveLayer({
      layer: layerNumber,
      question: question || fallbackQuestion,
      answer: recursiveAnswer,
    });

    const updated = [...recursiveLayers, layer];

    setRecursiveLayers(updated);
    setRecursiveAnswer("");

    if (updated.length < 7) {
      pauseThen(() => setPhase("depth"));
      return;
    }

    pauseThen(() => setPhase("core_reflection"));
  }

  function submitResistance() {
    if (!resistanceAnswer.trim()) return;

    setHasStarted(true);

    const mapped = mapResistance({ answer: resistanceAnswer });
    setResistanceMap(mapped);

    const step = generateNextStep({
      goal: selectedAreaLabel,
      resistance: mapped,
      execution: null,
    });

    setProposedStep(step);

    setDiscussionMessages([
      {
        role: "compass",
        content:
          "Before we finalize the next step, let’s sit with the resistance for a moment. The aim is not to force intensity. It is to find the smallest honest movement you can actually keep.",
      },
      {
        role: "compass",
        content: step,
      },
    ]);

    pauseThen(() => setPhase("discussion"));
  }

  function submitDiscussionMessage() {
    if (!discussionInput.trim()) return;

    setHasStarted(true);

    const participantMessage: CompassDiscussionMessage = {
      role: "participant",
      content: discussionInput,
    };

    const nextMessages = [...discussionMessages, participantMessage];

    const result = continueCompassDiscussion({
      messages: nextMessages,
      latestAnswer: discussionInput,
      proposedStep,
    });

    const compassMessage: CompassDiscussionMessage = {
      role: "compass",
      content: result.compassReply,
    };

    setDiscussionMessages([...nextMessages, compassMessage]);
    setDiscussionInput("");

    if (!result.shouldContinueDiscussion) {
      setFinalStep(result.suggestedMicroStep ?? proposedStep);
      pauseThen(() => setPhase("complete"));
    }
  }

  function moveToExecutionCheck() {
    setHasStarted(true);
    pauseThen(() => setPhase("execution_check"));
  }

  function submitExecutionFeeling() {
    if (!executionFeeling.trim()) return;

    setHasStarted(true);

    const calibrated = calibrateExecutionStep({
      proposedStep,
      participantResponse: executionFeeling,
    });

    setFinalStep(
      calibrated.isStepExecutable
        ? proposedStep
        : calibrated.recalibratedStep ?? proposedStep,
    );

    pauseThen(() => setPhase("complete"));
  }

  const showBackButton = !["loading", "resume", "intro", "analyzing"].includes(phase);

  return (
    <main className="min-h-screen bg-[#090909] text-stone-100">
      <section className="relative min-h-screen overflow-hidden px-5 py-8 sm:px-8 lg:px-12">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,_rgba(184,134,64,0.08),_transparent_28%),linear-gradient(180deg,_rgba(16,16,16,0.96),_rgba(9,9,9,1))]" />

        <div className="relative mx-auto max-w-3xl">
          <header className="mb-5 pt-1 text-center">
            <div className="mx-auto mb-2 flex justify-center">
              <Image
                src="/images/compass-logo.webp"
                alt="The Compass by Oremea"
                width={640}
                height={180}
                priority
                className="h-auto w-[380px] sm:w-[560px]"
              />
            </div>

            <p className={`mx-auto max-w-2xl text-base leading-relaxed ${BODY_TEXT} sm:text-lg`}>
              Compass helps you discover what matters most to you, understand why
              it matters, identify what interrupts it, and build momentum through
              aligned execution.
            </p>

            <p className="mt-5 text-sm uppercase tracking-[0.34em] text-[#d8b15f]">
              Embodied momentum matters more than fantasy intensity.
            </p>
          </header>

          {showBackButton && (
            <button
              type="button"
              onClick={goBackInsideCompass}
              className="mb-4 text-sm text-zinc-400 transition hover:text-[#d8b15f]"
            >
              ← Back
            </button>
          )}

          {phase === "loading" && (
            <CompassCard title="Opening Compass" description="Checking whether there is an active session to resume.">
              <div className={`flex justify-center py-8 text-5xl ${BODY_TEXT}`}>...</div>
            </CompassCard>
          )}

          {phase === "resume" && (
            <CompassCard title="Resume Compass?" description="Compass found a previous active session. You can continue from where you left off, or begin again.">
              <button onClick={resumeSession} className="primary-button">
                Resume previous session
              </button>

              <button onClick={beginNewSession} className="secondary-button">
                Start fresh
              </button>
            </CompassCard>
          )}

          {phase === "intro" && (
            <CompassCard title="Begin Compass" description="You will move through eight recognizable life areas, one question at a time.">
              <p className={`text-sm leading-relaxed ${BODY_TEXT}`}>
                Compass may notice emotional weighting, repeating language,
                contradictions, resistance patterns, or recurring values in your
                responses.
              </p>

              <p className={`text-sm leading-relaxed ${BODY_TEXT}`}>
                Compass will never decide for you.
              </p>

              <p className={`text-sm leading-relaxed ${BODY_TEXT}`}>
                Later, Compass will take you at least seven layers deeper into
                the goal you choose.
              </p>

              <button
                onClick={() => {
                  setHasStarted(true);
                  setPhase("area");
                }}
                className="primary-button"
              >
                Begin
              </button>
            </CompassCard>
          )}

          {phase === "analyzing" && (
            <CompassCard title="Compass is analyzing your responses" description="Please wait while Compass reflects on your language patterns.">
              <div className={`flex justify-center py-8 text-5xl ${BODY_TEXT}`}>...</div>
            </CompassCard>
          )}

          {phase === "area" && (
  <CompassAreaFlow
    areaIndex={areaIndex}
    answer={answer}
    areaResponses={areaResponses}
    onAnswerChange={setAnswer}
    onSubmitAnswer={submitAreaAnswer}
  />
)}

          {phase === "area_mirror" && (
  <CompassPriorityFlow
    title="Compass reflection"
    description={areaMirror.reflection}
    areaResponses={areaResponses}
    reviewLabel="Review your eight answers"
    onContinue={() => pauseThen(() => setPhase("area_confirmation"))}
  />
)}

          {phase === "area_confirmation" && (
  <CompassPriorityFlow
    title="What feels most important right now?"
    description={primaryReflection.reflection}
    areaResponses={areaResponses}
    reviewLabel="Review your answers"
    showAreaChoices
    onChooseArea={chooseArea}
  />
)}

          {phase === "depth_intro" && (
            <CompassCard title="Great, now we're getting into it." description={`Let's go deeper into your priority of ${selectedAreaLabel}.`}>
              <p className={`text-sm leading-relaxed ${BODY_TEXT}`}>
                You may notice we ask a few similar questions. The repetition is
                deliberate.
              </p>

              <p className={`text-sm leading-relaxed ${BODY_TEXT}`}>
                We are looking for what sits beneath the goal: the pressure, the
                pain, the need, the belief, and the reason to keep moving.
              </p>

              <button onClick={() => setPhase("depth")} className="primary-button">
                Go deeper
              </button>
            </CompassCard>
          )}

          {phase === "depth" && (
            <CompassCard
              eyebrow={`Reflection ${recursiveLayers.length + 1} of 7`}
              title={buildAdaptiveRecursiveQuestion({
                layer: recursiveLayers.length + 1,
                selectedAreaLabel,
                previousAnswer: recursiveLayers[recursiveLayers.length - 1]?.answer ?? "",
                firstAnswer: areaResponses.find((response) => response.area === selectedArea)?.answer ?? "",
              })}
              description={
                recursiveLayers.length > 0
                  ? "We are incorporating your answers into the questions as the process evolves. The more you provide, the more direction may appear."
                  : `Let's begin exploring why ${selectedAreaLabel.toLowerCase()} matters to you.`
              }
            >
              <textarea value={recursiveAnswer} onChange={(event) => setRecursiveAnswer(event.target.value)} placeholder="Answer openly. The more context you give, the more Compass can help reflect possible patterns, values, and next steps." rows={7} className="compass-textarea" />

              <button onClick={submitRecursiveAnswer} className="primary-button">
                Continue
              </button>
            </CompassCard>
          )}

          {phase === "core_reflection" && (
            <CompassCard title="Core pattern reflection" description={coreReflection.reflection}>
              <details className="rounded-2xl border border-zinc-800 bg-[#131313] p-4">
                <summary className={`cursor-pointer text-sm ${BODY_TEXT}`}>Review your deeper reflections</summary>

                <div className="mt-4 space-y-4">
                  {recursiveLayers.map((layer) => (
                    <div key={layer.layer} className="rounded-xl border border-zinc-800 p-4">
                      <p className="text-sm text-[#d8b15f]">{layer.question}</p>
                      <p className={`mt-2 whitespace-pre-line text-sm ${BODY_TEXT}`}>{layer.answer}</p>
                    </div>
                  ))}
                </div>
              </details>

              <textarea value={extraReflection} onChange={(event) => setExtraReflection(event.target.value)} placeholder="Would you like to clarify, question, refine, or add anything before continuing?" rows={5} className="compass-textarea" />

              <button onClick={() => setPhase("resistance")} className="primary-button">
                Continue
              </button>
            </CompassCard>
          )}

          {phase === "resistance" && (
            <CompassCard title="What tends to get in the way?" description={`What usually interrupts, delays, emotionally complicates, or prevents movement toward ${selectedAreaLabel.toLowerCase()}?`}>
              <textarea value={resistanceAnswer} onChange={(event) => setResistanceAnswer(event.target.value)} placeholder="Describe the friction, emotional resistance, avoidance patterns, fears, or recurring interruptions." rows={8} className="compass-textarea" />

              <button onClick={submitResistance} className="primary-button">
                Analyze resistance
              </button>
            </CompassCard>
          )}

          {phase === "discussion" && (
            <CompassCard title="Let’s sit with this before we move." description="This is where Compass helps you find the smallest truthful next step.">
              <div className="space-y-5">
                {discussionMessages.map((message, index) => (
                  <div key={`${message.role}-${index}`} className="text-sm leading-relaxed">
                    <p className={message.role === "compass" ? "mb-1 text-[#d8b15f]" : "mb-1 text-zinc-200"}>
                      {message.role === "compass" ? "Compass" : "You"}
                    </p>

                    <p className={`whitespace-pre-line ${message.role === "compass" ? BODY_TEXT : "text-zinc-100"}`}>
                      {message.content}
                    </p>
                  </div>
                ))}
              </div>

              <textarea value={discussionInput} onChange={(event) => setDiscussionInput(event.target.value)} placeholder="Reply here. If you feel blocked, say that. If you feel resistant, say that. If you feel ready, say that too." rows={6} className="compass-textarea" />

              <button onClick={submitDiscussionMessage} className="primary-button">
                Send
              </button>

              <button onClick={moveToExecutionCheck} className="secondary-button">
                I’m ready to choose the next step
              </button>
            </CompassCard>
          )}

          {phase === "execution_check" && (
            <CompassCard title="Do you feel able to execute this?" description="If this still feels too large, unclear, public, emotionally loaded, or difficult to begin, Compass will reduce the pressure further.">
              <textarea value={executionFeeling} onChange={(event) => setExecutionFeeling(event.target.value)} placeholder="Does this feel realistic, emotionally safe, sustainable, too large, too public, unclear, or difficult to begin?" rows={6} className="compass-textarea" />

              <button onClick={submitExecutionFeeling} className="primary-button">
                Finalize next step
              </button>
            </CompassCard>
          )}

          {phase === "complete" && (
            <CompassCard title="Your next executable step" description="One real movement. Not the entire transformation.">
              <div className={`rounded-[1.5rem] border border-zinc-800 bg-[#121212] p-5 text-sm leading-relaxed whitespace-pre-line ${BODY_TEXT}`}>
                {finalStep}
              </div>

              {resonanceBridge.eligible && (
                <div className="rounded-[1.5rem] border border-zinc-800 bg-[#121212] p-5">
                  <p className={`whitespace-pre-line text-sm leading-relaxed ${BODY_TEXT}`}>{resonanceBridge.reflection}</p>

                  <a href={resonanceBridge.ctaHref ?? "https://www.oremea.com/?open=resonance"} className="primary-button inline-flex items-center justify-center">
                    {resonanceBridge.ctaLabel}
                  </a>
                </div>
              )}
            </CompassCard>
          )}
        </div>
      </section>

      <style jsx>{`
        .primary-button {
          margin-top: 1rem;
          width: 100%;
          border-radius: 999px;
          border: 1px solid #d8b15f;
          background: linear-gradient(180deg, #d8b15f, #9f7332);
          padding: 0.95rem 1.2rem;
          font-size: 0.92rem;
          color: #120d07;
          font-weight: 600;
          transition: 180ms ease;
        }

        .primary-button:hover {
          border-color: #e2c374;
          background: linear-gradient(180deg, #e2c374, #a87a38);
        }

        .secondary-button {
          margin-top: 0.25rem;
          width: 100%;
          border-radius: 999px;
          border: 1px solid #3f3f46;
          background: #111111;
          padding: 0.9rem 1.2rem;
          font-size: 0.9rem;
          color: #a1a1aa;
          transition: 180ms ease;
        }

        .secondary-button:hover {
          border-color: #71717a;
          color: #f4f4f5;
        }

        .selection-button {
          border-radius: 1.2rem;
          border: 1px solid #27272a;
          background: #131313;
          padding: 1rem;
          text-align: left;
          font-size: 0.92rem;
          color: #d8b15f;
          transition: 180ms ease;
        }

        .selection-button:hover {
          border-color: #d8b15f;
          background: #1a1a1a;
        }

        .compass-textarea {
          min-height: 170px;
          width: 100%;
          resize: none;
          border-radius: 1.5rem;
          border: 1px solid #3f3f46;
          background: #18110b;
          padding: 1rem 1.2rem;
          font-size: 0.95rem;
          line-height: 1.8;
          color: #f4f4f5;
          outline: none;
          transition: 180ms ease;
        }

        .compass-textarea::placeholder {
          color: #a1a1aa;
        }

        .compass-textarea:focus {
          border-color: #d8b15f;
          background: #1f1710;
        }
      `}</style>
    </main>
  );
}

function normalizePhase(value: string | null | undefined): CompassPhase {
  const allowed: CompassPhase[] = [
    "intro",
    "area",
    "area_mirror",
    "area_confirmation",
    "depth_intro",
    "depth",
    "core_reflection",
    "resistance",
    "discussion",
    "execution_check",
    "complete",
  ];

  if (value && allowed.includes(value as CompassPhase)) {
    return value as CompassPhase;
  }

  return "intro";
}

function isCompassGoalArea(value: unknown): value is CompassGoalArea {
  return (
    value === "relationships" ||
    value === "income" ||
    value === "health" ||
    value === "spirituality" ||
    value === "investments" ||
    value === "network" ||
    value === "knowledge" ||
    value === "lifestyle"
  );
}

function toArray<T>(value: unknown): T[] {
  return Array.isArray(value) ? (value as T[]) : [];
}

function toObject<T>(value: unknown): T | null {
  if (value && typeof value === "object" && !Array.isArray(value)) {
    return value as T;
  }

  return null;
}

