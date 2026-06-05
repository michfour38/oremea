"use client";

import { CompassPromptFlow } from "@/components/compass/CompassPromptFlow";
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
import { useEffect, useMemo, useRef, useState } from "react";
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
const [compassMirrorOutput, setCompassMirrorOutput] = useState("");
const [areaMirrorOutput, setAreaMirrorOutput] = useState("");

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
const backLockRef = useRef(false);

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
  () =>
    reflectCoreValues({
      areaResponses,
      selectedArea,
      layers: recursiveLayers,
    }),
  [areaResponses, selectedArea, recursiveLayers],
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
  if (backLockRef.current) return;

  backLockRef.current = true;

  if (
    phase === "intro" ||
    phase === "loading" ||
    phase === "resume"
  ) {
    window.history.pushState(
      { compass: true },
      "",
      window.location.href,
    );

    window.setTimeout(() => {
      backLockRef.current = false;
    }, 300);

    return;
  }

  goBackInsideCompass();

  window.history.pushState(
    { compass: true },
    "",
    window.location.href,
  );

  window.setTimeout(() => {
    backLockRef.current = false;
  }, 300);
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

  function pauseThen(
  next: () => void,
  options: { showAnalyzing?: boolean } = {},
) {
  const showAnalyzing = options.showAnalyzing ?? true;

  if (showAnalyzing) {
    setPhase("analyzing");
  }

  window.setTimeout(next, showAnalyzing ? 1800 : 250);
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
      setRecursiveAnswer("");
      setPhase("depth");
      return;
    }

    setPhase("depth_intro");
    return;
  }

  if (phase === "core_reflection") {
    setRecursiveLayers((current) => current.slice(0, -1));
    setRecursiveAnswer("");
    setPhase("depth");
    return;
  }

  if (phase === "possibility") {
    if (possibilityAnswers.length > 0) {
      setPossibilityAnswers((current) => current.slice(0, -1));
      setPossibilityAnswer("");
      setPhase("possibility");
      return;
    }

    setPhase("core_reflection");
    return;
  }

  if (phase === "possibility_mirror") {
    setPhase("possibility");
    return;
  }

  if (phase === "resistance") {
    setPhase("possibility_mirror");
    return;
  }

  if (phase === "discussion") {
  setPhase("core_reflection");
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

    const updatedAreaResponses = [...areaResponses, analyzed];

setAreaResponses(updatedAreaResponses);
setAnswer("");

    if (areaIndex < COMPASS_AREA_QUESTIONS.length - 1) {
      pauseThen(() => {
        setAreaIndex((current) => current + 1);
        setPhase("area");
      });
      return;
    }

    pauseThen(async () => {
  await generateAreaMirror(updatedAreaResponses);
  setPhase("area_mirror");
});
  }

  function chooseArea(area: CompassGoalArea) {
    setHasStarted(true);
    setSelectedArea(area);
    pauseThen(() => setPhase("depth_intro"));
  }

async function generateAreaMirror(updatedAreaResponses: CompassAreaResponse[]) {
  try {
    const response = await fetch("/api/compass/mirror", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        areaResponses: updatedAreaResponses,
        selectedArea: null,
        recursiveLayers: [],
        mirrorStage: "area",
      }),
    });

    const data = await response.json();

    if (data?.ok && typeof data.output === "string") {
      setAreaMirrorOutput(data.output);
      return;
    }

    setAreaMirrorOutput("");
  } catch (error) {
    console.error("Compass Area Mirror failed:", error);
    setAreaMirrorOutput("");
  }
}

async function generateCompassMirror(
  updatedLayers: CompassRecursiveLayer[],
) {
  try {
    const response = await fetch("/api/compass/mirror", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
  areaResponses,
  selectedArea,
  recursiveLayers: updatedLayers,
  mirrorStage: "core",
}),
    });

    const data = await response.json();

    if (data?.ok && typeof data.output === "string") {
      setCompassMirrorOutput(data.output);
      return;
    }

    setCompassMirrorOutput("");
  } catch (error) {
    console.error("Compass Mirror failed:", error);
    setCompassMirrorOutput("");
  }
}

  function submitRecursiveAnswer() {
    if (!recursiveAnswer.trim()) return;

    if (recursiveLayers.length >= 7) {
  setPhase("core_reflection");
  return;
}

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

    pauseThen(async () => {
  await generateCompassMirror(updated);
  setPhase("core_reflection");
});
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

  async function submitDiscussionMessage() {
  if (!discussionInput.trim()) return;

  setHasStarted(true);

  const participantMessage: CompassDiscussionMessage = {
    role: "participant",
    content: discussionInput,
  };

  const nextMessages = [
    ...discussionMessages,
    participantMessage,
  ];

  setDiscussionMessages([
    ...nextMessages,
    {
      role: "compass",
      content: "...",
    },
  ]);

  const latestAnswer = discussionInput;

  setDiscussionInput("");

  try {
    const response = await fetch(
      "/api/el/conversation",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          product: "compass",
          stage: "discussion",

          latestAnswer,

          conversation: nextMessages.map(
            (message) => ({
              role:
                message.role === "participant"
                  ? "participant"
                  : "system",
              content: message.content,
            }),
          ),

          contextBlocks: [
            {
              label: "Selected Area",
              content: selectedAreaLabel,
            },
            {
              label: "Area Responses",
              content: areaResponses
                .map(
                  (response) =>
                    `${AREA_LABELS[response.area]}:\n${response.answer}`,
                )
                .join("\n\n"),
            },
            {
              label: "Recursive Layers",
              content: recursiveLayers
                .map(
                  (layer) =>
                    `Layer ${layer.layer}\n${layer.answer}`,
                )
                .join("\n\n"),
            },
            {
              label: "Compass Mirror",
              content:
                compassMirrorOutput ||
                coreReflection.reflection,
            },
          ],
        }),
      },
    );

    const data = await response.json();

    const reply =
      data?.ok &&
      typeof data?.result?.reply === "string"
        ? data.result.reply
        : "Compass could not clearly identify the next thing to examine. Say the most important part again.";

    setDiscussionMessages([
      ...nextMessages,
      {
        role: "compass",
        content: reply,
      },
    ]);
  } catch (error) {
    console.error(
      "EL conversation failed:",
      error,
    );

    setDiscussionMessages([
      ...nextMessages,
      {
        role: "compass",
        content:
          "Compass could not clearly identify the next thing to examine. Say the most important part again.",
      },
    ]);
  }
}

async function completeCompassProcess() {
  setHasStarted(true);

  await fetch("/api/compass/session", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      phase: "complete",
      selectedArea,
      areaResponses,
      recursiveLayers,
      possibilityAnswers,
      resistanceMap,
      discussionMessages,
      proposedStep,
      finalStep,
    }),
  });
}

  function moveToExecutionCheck() {
  setHasStarted(true);

  const lastParticipantMessage = [...discussionMessages]
    .reverse()
    .find((message) => message.role === "participant");

  setProposedStep(
    lastParticipantMessage?.content ||
      proposedStep ||
      "Choose one small movement that can be completed next.",
  );

  setExecutionFeeling(
    lastParticipantMessage?.content ||
      proposedStep ||
      "",
  );

  pauseThen(() => setPhase("execution_check"), {
    showAnalyzing: false,
  });
}     

  function submitExecutionFeeling() {
  if (!executionFeeling.trim()) return;

  setHasStarted(true);

  setFinalStep(executionFeeling.trim());

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
  Turn self-awareness into one executable next step
</p>

<p className="mt-5 text-sm uppercase tracking-[0.34em] text-[#d8b15f]">
  Clarity • Direction • Execution
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
  title="Begin Navigation"
  description="You are about to move through eight areas of life."
>
  <p className={`text-sm leading-relaxed ${BODY_TEXT}`}>
    There are no perfect answers.

    There is nothing to perform.

    Compass will not tell you what to do.
  </p>

  <p className={`text-sm leading-relaxed ${BODY_TEXT}`}>
    You may discover that the area demanding your attention is not the area you expected.

    You may discover that several areas are connected.

    You may discover that one decision influences far more than anticipated.
  </p>

  <p className={`text-sm leading-relaxed ${BODY_TEXT}`}>
    Answer honestly.

    Answer specifically.
  </p>

  <p className={`text-sm leading-relaxed ${BODY_TEXT}`}>
    Specificity creates clarity.

    Clarity creates choice.

    Choice creates movement.
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
              title="Reading your responses"
description=""
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
    title="What stands out"
    description={areaMirrorOutput || areaMirror.reflection}
    areaResponses={areaResponses}
    reviewLabel="Review your eight answers"
    onContinue={() =>
      pauseThen(() => setPhase("area_confirmation"), {
        showAnalyzing: false,
      })
    }
  />
)}

          {phase === "area_confirmation" && (
            <CompassPriorityFlow
              title="The clearest direction"
              description={primaryReflection.reflection}
              areaResponses={areaResponses}
              reviewLabel="Review before choosing"
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
  <CompassPromptFlow
    title={possibilityQuestion.question}
    description={null}
    value={possibilityAnswer}
    onChange={setPossibilityAnswer}
    onSubmit={submitPossibilityAnswer}
    placeholder="Answer with real-life details. What changes, who benefits, and what becomes possible?"
    buttonLabel="Continue"
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
  reflection={compassMirrorOutput || coreReflection.reflection}
  recursiveLayers={recursiveLayers}
  extraReflection={extraReflection}
  onExtraReflectionChange={setExtraReflection}
  onContinue={() => {
    const mirrorText = compassMirrorOutput || coreReflection.reflection;

    setDiscussionMessages([
      {
        role: "compass",
        content: mirrorText,
      },
    ]);

    setPhase("discussion");
  }}
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
  onComplete={completeCompassProcess}
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
  border: 2px solid rgba(216, 177, 95, 0.45);
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
  box-shadow: 0 0 0 1px rgba(216, 177, 95, 0.15);
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