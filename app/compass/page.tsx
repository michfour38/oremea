"use client";

import { evaluatePriorityRedirect } from "@/src/lib/compass/session/priority-redirect";
import MemberNav from "@/app/(member)/member-nav";
import { CompassAreaFlow } from "@/components/compass/CompassAreaFlow";
import { CompassCard } from "@/components/compass/CompassCard";
import {
  CompassComplete,
  CompassDiscussionFlow,
  CompassExecutionCheck,
} from "@/components/compass/CompassDiscussionFlow";
import {
  CompassDepthFlow,
  CompassDepthIntro,
} from "@/components/compass/CompassDepthFlow";
import { CompassPriorityFlow } from "@/components/compass/CompassPriorityFlow";
import {
  CompassCoreReflection,
  CompassResistanceFlow,
} from "@/components/compass/CompassResistanceFlow";
import Image from "next/image";
import { useEffect, useMemo, useState } from "react";
import {
  buildPossibilityMirror,
  getPossibilityQuestion,
} from "@/src/lib/compass/session/possibility-expansion";
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
| "possibility"
| "possibility_mirror"
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
possibility_answers?: unknown;
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
  const [savedSession, setSavedSession] =
    useState<StoredCompassSession | null>(null);
  const [sessionLoaded, setSessionLoaded] = useState(false);
  const [hasStarted, setHasStarted] = useState(false);
  const [isRestoring, setIsRestoring] = useState(true);

  const [areaIndex, setAreaIndex] = useState(0);
  const [answer, setAnswer] = useState("");
  const [areaResponses, setAreaResponses] = useState<CompassAreaResponse[]>([]);
  const [selectedArea, setSelectedArea] = useState<CompassGoalArea | null>(null);
  const [recursiveLayers, setRecursiveLayers] = useState<CompassRecursiveLayer[]>([]);
  const [recursiveAnswer, setRecursiveAnswer] = useState("");
  const [extraReflection, setExtraReflection] = useState("");

const [possibilityAnswers, setPossibilityAnswers] = useState<string[]>([]);
const [possibilityAnswer, setPossibilityAnswer] = useState("");

  const [resistanceAnswer, setResistanceAnswer] = useState("");
  const [resistanceMap, setResistanceMap] =
    useState<CompassResistanceMap | null>(null);
  const [proposedStep, setProposedStep] = useState("");
  const [executionFeeling, setExecutionFeeling] = useState("");
  const [finalStep, setFinalStep] = useState("");
  const [discussionInput, setDiscussionInput] = useState("");
  const [discussionMessages, setDiscussionMessages] =
    useState<CompassDiscussionMessage[]>([]);

  const currentArea = COMPASS_AREA_QUESTIONS[areaIndex];

  const areaMirror = useMemo(
    () => buildAreaMirrorReflection(areaResponses),
    [areaResponses],
  );

  const primaryReflection = useMemo(
    () => reflectPrimaryArea(areaResponses),
    [areaResponses],
  );

  const coreReflection = useMemo(
    () => reflectCoreValues(recursiveLayers),
    [recursiveLayers],
  );

const possibilityQuestion = useMemo(
  () =>
    getPossibilityQuestion({
      selectedArea,
      index: possibilityAnswers.length,
    }),
  [selectedArea, possibilityAnswers.length],
);

const possibilityMirror = useMemo(
  () =>
    buildPossibilityMirror({
      selectedArea,
      possibilityAnswers,
    }),
  [selectedArea, possibilityAnswers],
);

  const resonanceBridge = useMemo(
    () => evaluateResonanceBridge(areaResponses),
    [areaResponses],
  );

  const selectedAreaLabel = selectedArea
    ? AREA_LABELS[selectedArea]
    : "your chosen goal";

  useEffect(() => {
    async function loadSession() {
      try {
        setIsRestoring(true);

        const response = await fetch("/api/compass/session", {
          method: "GET",
        });

        if (!response.ok) {
          setPhase("intro");
          return;
        }

        const data = await response.json();

        if (data.session) {
          setSavedSession(data.session);
          setPhase("resume");
        } else {
          setPhase("intro");
        }
      } catch (error) {
        console.error("Failed to load Compass session:", error);
        setPhase("intro");
      } finally {
        setSessionLoaded(true);
        setIsRestoring(false);
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
  }, [phase, areaIndex, recursiveLayers.length, possibilityAnswers.length]);

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
          possibilityAnswers,
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
    possibilityAnswers,
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

if (phase === "possibility") {
  if (possibilityAnswers.length > 0) {
    setPossibilityAnswers((current) => current.slice(0, -1));
    setPossibilityAnswer("");
    setPhase("possibility");
    return;
  }

  setRecursiveLayers((current) => current.slice(0, -1));
  setRecursiveAnswer("");
  setPhase("depth");
  return;
}

if (phase === "possibility_mirror") {
  setPhase("possibility");
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
fetch("/api/compass/session", {
  method: "POST",
  headers: {
    "Content-Type": "application/json",
  },
  body: JSON.stringify({
  phase: "intro",
  areaResponses: [],
  recursiveLayers: [],
  possibilityAnswers: [],
  discussionMessages: [],
}),
}).catch(() => {});
    setHasStarted(true);
    setAreaIndex(0);
    setAnswer("");
    setAreaResponses([]);
    setSelectedArea(null);
    setRecursiveLayers([]);
    setRecursiveAnswer("");
    setExtraReflection("");
setPossibilityAnswers([]);
setPossibilityAnswer("");
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

    const restoredAreaResponses = toArray<CompassAreaResponse>(
      savedSession.area_responses,
    );
    const restoredRecursiveLayers = toArray<CompassRecursiveLayer>(
      savedSession.recursive_layers,
    );
    const restoredMessages = toArray<CompassDiscussionMessage>(
      savedSession.discussion_messages,
    );

    setAreaResponses(restoredAreaResponses);
    setRecursiveLayers(restoredRecursiveLayers);
setPossibilityAnswers(toArray<string>(savedSession.possibility_answers));
    setDiscussionMessages(restoredMessages);
    setResistanceMap(toObject<CompassResistanceMap>(savedSession.resistance_map));
    setProposedStep(savedSession.proposed_step ?? "");
    setFinalStep(savedSession.final_step ?? "");

    const restoredArea = isCompassGoalArea(savedSession.selected_area)
      ? savedSession.selected_area
      : null;

    setSelectedArea(restoredArea);
    setAreaIndex(
      Math.min(restoredAreaResponses.length, COMPASS_AREA_QUESTIONS.length - 1),
    );
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
      firstAnswer:
        areaResponses.find((response) => response.area === selectedArea)
          ?.answer ?? "",
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

function submitPossibilityAnswer() {
  if (!possibilityAnswer.trim()) return;

  setHasStarted(true);

  const updated = [
    ...possibilityAnswers,
    possibilityAnswer,
  ];

  setPossibilityAnswers(updated);
  setPossibilityAnswer("");

  if (updated.length < 4) {
  pauseThen(() => setPhase("possibility"));
  return;
}

setDiscussionMessages([
  {
    role: "compass",
    content: possibilityMirror,
  },
  {
    role: "compass",
    content: "What tends to interrupt movement toward this most often?",
  },
]);

pauseThen(() => setPhase("discussion"));
}

  function submitResistance() {
    if (!resistanceAnswer.trim()) return;

    setHasStarted(true);

    const mapped = mapResistance({ answer: resistanceAnswer });
    setResistanceMap(mapped);

const redirect = evaluatePriorityRedirect({
  selectedArea,
  areaResponses,
  recursiveAnswers: recursiveLayers.map((layer) => layer.answer),
  resistanceAnswer,
});

if (redirect.shouldRedirect && redirect.suggestedArea) {
  setSelectedArea(redirect.suggestedArea);
}

    const step = generateNextStep({
      goal: selectedAreaLabel,
      resistance: mapped,
      execution: null,
    });

    setProposedStep(step);

    setDiscussionMessages([
  {
    role: "compass",
    content: possibilityMirror,
  },
  {
    role: "compass",
    content: `What tends to interrupt movement toward this most often?`,
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

    setDiscussionMessages([
  ...nextMessages,
  {
    role: "compass",
    content: "•••",
  },
]);

setDiscussionInput("");

window.setTimeout(() => {
  const compassMessage: CompassDiscussionMessage = {
    role: "compass",
    content: result.compassReply,
  };

  setDiscussionMessages((current) => [
    ...current.slice(0, -1),
    compassMessage,
  ]);
}, calculateTypingDelay(result.compassReply));

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

  if (isRestoring) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[#090909] text-stone-100">
        Loading Compass...
      </main>
    );
  }

  const showBackButton = !["loading", "resume", "intro", "analyzing"].includes(
    phase,
  );

  return (
    <main className="min-h-screen bg-[#090909] text-stone-100">
<MemberNav />
      <section className="relative z-0 min-h-screen overflow-hidden px-5 py-8 sm:px-8 lg:px-12">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,_rgba(184,134,64,0.08),_transparent_28%),linear-gradient(180deg,_rgba(16,16,16,0.96),_rgba(9,9,9,1))]" />

        <div className="relative z-0 mx-auto max-w-3xl">
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

            <p
              className={`mx-auto max-w-2xl text-base leading-relaxed ${BODY_TEXT} sm:text-lg`}
            >
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

          {phase === "resume" && (
            <CompassCard
              title="Resume Compass?"
              description="Compass found a previous active session. You can continue from where you left off, or begin again."
            >
              <button onClick={resumeSession} className="primary-button">
                Resume previous session
              </button>

              <button onClick={beginNewSession} className="secondary-button">
                Start fresh
              </button>
            </CompassCard>
          )}

          {phase === "intro" && (
            <CompassCard
              title="Begin Compass"
              description="You will move through eight recognizable life areas, one question at a time."
            >
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
  beginNewSession();
  setPhase("area");
}}
                className="primary-button"
              >
                Begin
              </button>
            </CompassCard>
          )}

          {phase === "analyzing" && (
            <CompassCard
              title="Compass is finding the clearest thread"
              description="Stay with this for a moment."
            >
              <div className={`flex justify-center py-8 text-5xl ${BODY_TEXT}`}>
                ...
              </div>
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
            <CompassDepthIntro
              selectedAreaLabel={selectedAreaLabel}
              onBegin={() => setPhase("depth")}
            />
          )}

          {phase === "depth" && (
            <CompassDepthFlow
              selectedArea={selectedArea}
              selectedAreaLabel={selectedAreaLabel}
              areaResponses={areaResponses}
              recursiveLayers={recursiveLayers}
              recursiveAnswer={recursiveAnswer}
              onAnswerChange={setRecursiveAnswer}
              onSubmitAnswer={submitRecursiveAnswer}
            />
          )}

          {phase === "possibility" && (
  <CompassDiscussionFlow
    discussionMessages={[
      {
        role: "compass",
        content: possibilityQuestion.question,
      },
    ]}
    discussionInput={possibilityAnswer}
    onDiscussionInputChange={setPossibilityAnswer}
    onSend={submitPossibilityAnswer}
    onReady={submitPossibilityAnswer}
  />
)}

          {phase === "possibility_mirror" && (
            <CompassCard
              title="Compass reflection"
              description={possibilityMirror}
            >
              <button
                onClick={() => pauseThen(() => setPhase("resistance"))}
                className="primary-button"
              >
                Continue
              </button>
            </CompassCard>
          )}

          {phase === "core_reflection" && (
            <CompassCoreReflection
              reflection={coreReflection.reflection}
              recursiveLayers={recursiveLayers}
              extraReflection={extraReflection}
              onExtraReflectionChange={setExtraReflection}
              onContinue={() => setPhase("possibility")}
            />
          )}

          {phase === "resistance" && (
            <CompassResistanceFlow
              selectedAreaLabel={selectedAreaLabel}
              resistanceAnswer={resistanceAnswer}
              onResistanceChange={setResistanceAnswer}
              onSubmitResistance={submitResistance}
            />
          )}

          {phase === "discussion" && (
            <CompassDiscussionFlow
              discussionMessages={discussionMessages}
              discussionInput={discussionInput}
              onDiscussionInputChange={setDiscussionInput}
              onSend={submitDiscussionMessage}
              onReady={moveToExecutionCheck}
            />
          )}

          {phase === "execution_check" && (
            <CompassExecutionCheck
              executionFeeling={executionFeeling}
              onExecutionFeelingChange={setExecutionFeeling}
              onFinalize={submitExecutionFeeling}
            />
          )}

          {phase === "complete" && (
            <CompassComplete
              finalStep={finalStep}
              resonanceReflection={
                resonanceBridge.eligible ? resonanceBridge.reflection : null
              }
              resonanceCtaHref={resonanceBridge.ctaHref}
              resonanceCtaLabel={resonanceBridge.ctaLabel}
            />
          )}
        </div>
      </section>

      <style jsx global>{`
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

function calculateTypingDelay(
  response: string,
): number {
  const length = response.length

  if (length < 120) {
    return 1800
  }

  if (length < 260) {
    return 2600
  }

  if (length < 420) {
    return 3400
  }

  return 4200
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
"possibility",
"possibility_mirror",
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