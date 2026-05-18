"use client";

import Image from "next/image";
import { useMemo, useState } from "react";

import {
  COMPASS_AREA_QUESTIONS,
  analyzeAreaResponse,
  calibrateExecutionStep,
  createRecursiveLayer,
  evaluateResonanceBridge,
  generateNextStep,
  getRecursiveQuestion,
  mapResistance,
  reflectCoreValues,
  reflectPrimaryArea,
  type CompassAreaResponse,
  type CompassGoalArea,
  type CompassRecursiveLayer,
  type CompassResistanceMap,
} from "@/src/lib/compass/session";

type CompassPhase =
  | "intro"
  | "area"
  | "analyzing"
  | "area_confirmation"
  | "depth_intro"
  | "depth"
  | "core_reflection"
  | "resistance"
  | "execution_check"
  | "complete";

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

export default function CompassPage() {
  const [phase, setPhase] = useState<CompassPhase>("intro");
  const [areaIndex, setAreaIndex] = useState(0);
  const [answer, setAnswer] = useState("");
  const [areaResponses, setAreaResponses] = useState<CompassAreaResponse[]>([]);
  const [selectedArea, setSelectedArea] = useState<CompassGoalArea | null>(null);
  const [recursiveLayers, setRecursiveLayers] = useState<CompassRecursiveLayer[]>([]);
  const [recursiveAnswer, setRecursiveAnswer] = useState("");
  const [resistanceAnswer, setResistanceAnswer] = useState("");
  const [resistanceMap, setResistanceMap] = useState<CompassResistanceMap | null>(null);
  const [proposedStep, setProposedStep] = useState("");
  const [executionFeeling, setExecutionFeeling] = useState("");
  const [finalStep, setFinalStep] = useState("");

  const currentArea = COMPASS_AREA_QUESTIONS[areaIndex];
  const primaryReflection = useMemo(
    () => reflectPrimaryArea(areaResponses),
    [areaResponses],
  );
  const coreReflection = useMemo(
    () => reflectCoreValues(recursiveLayers),
    [recursiveLayers],
  );
  const resonanceBridge = useMemo(
    () => evaluateResonanceBridge(areaResponses),
    [areaResponses],
  );

  function pauseThen(next: () => void) {
    setPhase("analyzing");
    window.setTimeout(next, 1400);
  }

  function submitAreaAnswer() {
    if (!currentArea || !answer.trim()) return;

    const analyzed = analyzeAreaResponse({
      area: currentArea.area,
      answer,
    });

    const updated = [...areaResponses, analyzed];
    setAreaResponses(updated);
    setAnswer("");

    if (areaIndex < COMPASS_AREA_QUESTIONS.length - 1) {
      pauseThen(() => {
        setAreaIndex((current) => current + 1);
        setPhase("area");
      });
      return;
    }

    pauseThen(() => setPhase("area_confirmation"));
  }

  function chooseArea(area: CompassGoalArea) {
    setSelectedArea(area);
    pauseThen(() => setPhase("depth_intro"));
  }

  function submitRecursiveAnswer() {
    if (!recursiveAnswer.trim()) return;

    const layerNumber = recursiveLayers.length + 1;
    const question = getRecursiveQuestion(layerNumber);

    const layer = createRecursiveLayer({
      layer: layerNumber,
      question,
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

    const mapped = mapResistance({ answer: resistanceAnswer });
    setResistanceMap(mapped);

    const step = generateNextStep({
      goal: selectedArea ? AREA_LABELS[selectedArea] : "your goal",
      resistance: mapped,
      execution: null,
    });

    setProposedStep(step);
    pauseThen(() => setPhase("execution_check"));
  }

  function submitExecutionFeeling() {
    if (!executionFeeling.trim()) return;

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

  return (
    <main className="min-h-screen bg-[#080706] text-stone-100">
      <section className="relative min-h-screen overflow-hidden px-5 py-8 sm:px-8 lg:px-12">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,_rgba(184,134,64,0.14),_transparent_32%),linear-gradient(180deg,_rgba(30,24,18,0.88),_rgba(8,7,6,1)_48%,_rgba(11,9,7,1))]" />
        <div className="absolute inset-0 opacity-[0.05] bg-[linear-gradient(120deg,_transparent_0%,_rgba(255,255,255,0.12)_45%,_transparent_70%)]" />

        <div className="relative mx-auto max-w-3xl">
          <header className="mb-10 pt-6 text-center">
            <div className="mx-auto mb-6 flex justify-center">
              <Image
                src="/image/compass-logo.webp"
                alt="The Compass by Oremea"
                width={540}
                height={160}
                priority
                className="h-auto w-[320px] sm:w-[420px]"
              />
            </div>

            <p className="mx-auto max-w-2xl text-base leading-relaxed text-stone-300 sm:text-lg">
              Compass helps you discover the goal carrying the most meaning,
              understand why it matters, identify what interrupts it, and choose
              one real next step.
            </p>

            <p className="mt-4 text-sm uppercase tracking-[0.28em] text-amber-200/55">
              Embodied momentum matters more than fantasy intensity.
            </p>
          </header>

          {phase === "intro" && (
            <CompassCard
              title="Begin Compass"
              description="You will move through eight recognizable goal areas, one question at a time. Compass may reflect patterns it notices in your language, but it will never decide for you."
            >
              <p className="text-sm leading-relaxed text-stone-400">
                Later, Compass will take you at least seven layers deeper into
                the goal you choose. That section may feel repetitive. It is
                intentional. The purpose is to reach the deeper value underneath
                the goal.
              </p>

              <button onClick={() => setPhase("area")} className="primary-button">
                Begin
              </button>
            </CompassCard>
          )}

          {phase === "analyzing" && (
            <CompassCard title="Compass is reading your response" description="...">
              <div className="flex justify-center gap-2 py-6 text-3xl text-amber-100/70">
                <span className="animate-pulse">.</span>
                <span className="animate-pulse delay-150">.</span>
                <span className="animate-pulse delay-300">.</span>
              </div>
            </CompassCard>
          )}

          {phase === "area" && currentArea && (
            <CompassCard
              title={currentArea.title}
              description={currentArea.question}
              eyebrow={`${areaIndex + 1} of ${COMPASS_AREA_QUESTIONS.length}`}
            >
              <textarea
                value={answer}
                onChange={(event) => setAnswer(event.target.value)}
                placeholder={currentArea.placeholder}
                rows={7}
                className="compass-textarea"
              />

              <button onClick={submitAreaAnswer} className="primary-button">
                Continue
              </button>
            </CompassCard>
          )}

          {phase === "area_confirmation" && (
            <CompassCard
              title="What feels most important now?"
              description={primaryReflection.reflection}
            >
              <p className="text-sm leading-relaxed text-stone-400">
                Choose the area you feel is the true starting point. If Compass
                noticed a different area carrying more signal, use that as
                awareness — not instruction.
              </p>

              <div className="grid gap-3 sm:grid-cols-2">
                {COMPASS_AREA_QUESTIONS.map((item) => (
                  <button
                    key={item.area}
                    onClick={() => chooseArea(item.area)}
                    className="rounded-2xl border border-amber-200/14 bg-[#211912]/82 px-4 py-3 text-left text-sm text-stone-200 transition hover:border-amber-200/35 hover:bg-[#2a2018]"
                  >
                    {item.title}
                  </button>
                ))}
              </div>
            </CompassCard>
          )}

          {phase === "depth_intro" && (
            <CompassCard
              title="Seven layers deeper"
              description={`You chose ${
                selectedArea ? AREA_LABELS[selectedArea] : "this goal"
              }. Compass will now ask seven deeper questions. The repetition is deliberate.`}
            >
              <p className="text-sm leading-relaxed text-stone-400">
                This is where surface motivation begins turning into core value,
                reason, and self-recognition.
              </p>

              <button onClick={() => setPhase("depth")} className="primary-button">
                Go deeper
              </button>
            </CompassCard>
          )}

          {phase === "depth" && (
            <CompassCard
              title={`Layer ${recursiveLayers.length + 1} of 7`}
              description={getRecursiveQuestion(recursiveLayers.length + 1)}
            >
              <textarea
                value={recursiveAnswer}
                onChange={(event) => setRecursiveAnswer(event.target.value)}
                placeholder="Answer honestly. The exact words you use matter."
                rows={7}
                className="compass-textarea"
              />

              <button onClick={submitRecursiveAnswer} className="primary-button">
                Continue
              </button>
            </CompassCard>
          )}

          {phase === "core_reflection" && (
            <CompassCard
              title="Core value reflection"
              description={coreReflection.reflection}
            >
              <p className="text-sm leading-relaxed text-stone-400">
                Does this feel accurate? You can question, refine, disagree with,
                or add context to any reflection. Confusion is also useful data.
              </p>

              <button onClick={() => setPhase("resistance")} className="primary-button">
                Continue to resistance
              </button>
            </CompassCard>
          )}

          {phase === "resistance" && (
            <CompassCard
              title="What is in the way?"
              description="Now name the friction. What interrupts this goal, delays it, drains it, or makes it feel difficult to execute?"
            >
              <textarea
                value={resistanceAnswer}
                onChange={(event) => setResistanceAnswer(event.target.value)}
                placeholder="Include the obstacle, the avoidance pattern, and what usually happens when you try to move forward."
                rows={8}
                className="compass-textarea"
              />

              <button onClick={submitResistance} className="primary-button">
                Analyze resistance
              </button>
            </CompassCard>
          )}

          {phase === "execution_check" && (
            <CompassCard
              title="Execution calibration"
              description="Compass has reduced this into a possible next step. How do you feel about doing this?"
            >
              <div className="rounded-[1.5rem] border border-amber-200/12 bg-[#211912]/70 p-5 text-sm leading-relaxed text-stone-300 whitespace-pre-line">
                {proposedStep}
              </div>

              <textarea
                value={executionFeeling}
                onChange={(event) => setExecutionFeeling(event.target.value)}
                placeholder="Example: I can do this. / This feels too public. / This feels too big. / I need a smaller first step."
                rows={5}
                className="compass-textarea"
              />

              <button onClick={submitExecutionFeeling} className="primary-button">
                Finalize next step
              </button>
            </CompassCard>
          )}

          {phase === "complete" && (
            <CompassCard
              title="Your next executable step"
              description="Do this one thing. Not the whole transformation. One real movement."
            >
              <div className="rounded-[1.5rem] border border-amber-200/12 bg-[#211912]/70 p-5 text-sm leading-relaxed text-stone-300 whitespace-pre-line">
                {finalStep}
              </div>

              {resonanceBridge.eligible && (
                <div className="rounded-[1.5rem] border border-amber-200/16 bg-[#16110d]/88 p-5">
                  <p className="text-sm leading-relaxed text-stone-300 whitespace-pre-line">
                    {resonanceBridge.reflection}
                  </p>

                  <a
                    href={resonanceBridge.ctaHref ?? "https://www.oremea.com/?open=resonance"}
                    className="mt-4 inline-flex rounded-full border border-amber-200/24 bg-amber-100/10 px-5 py-3 text-sm text-amber-100 transition hover:bg-amber-100/16"
                  >
                    {resonanceBridge.ctaLabel ?? "Explore Resonance"}
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
          border: 1px solid rgba(253, 230, 138, 0.22);
          background: rgba(254, 243, 199, 0.1);
          padding: 0.9rem 1.2rem;
          font-size: 0.9rem;
          color: rgb(254, 243, 199);
          transition: 180ms ease;
        }

        .primary-button:hover {
          background: rgba(254, 243, 199, 0.16);
          border-color: rgba(253, 230, 138, 0.36);
        }

        .compass-textarea {
          min-height: 160px;
          width: 100%;
          resize: none;
          border-radius: 1.5rem;
          border: 1px solid rgba(253, 230, 138, 0.1);
          background: rgba(33, 25, 18, 0.82);
          padding: 1rem 1.25rem;
          font-size: 0.9rem;
          line-height: 1.7;
          color: rgb(245, 245, 244);
          outline: none;
          transition: 180ms ease;
        }

        .compass-textarea::placeholder {
          color: rgb(120, 113, 108);
        }

        .compass-textarea:focus {
          border-color: rgba(253, 230, 138, 0.3);
          background: rgba(38, 29, 21, 0.9);
        }
      `}</style>
    </main>
  );
}

function CompassCard({
  eyebrow,
  title,
  description,
  children,
}: {
  eyebrow?: string;
  title: string;
  description: string;
  children: React.ReactNode;
}) {
  return (
    <section className="rounded-[2rem] border border-amber-200/14 bg-[#120f0c]/88 p-6 shadow-2xl shadow-black/30 backdrop-blur">
      {eyebrow && (
        <p className="mb-3 text-xs uppercase tracking-[0.28em] text-amber-200/50">
          {eyebrow}
        </p>
      )}

      <h1 className="font-serif text-3xl text-amber-100 sm:text-4xl">
        {title}
      </h1>

      <p className="mt-4 whitespace-pre-line text-sm leading-relaxed text-stone-400 sm:text-base">
        {description}
      </p>

      <div className="mt-6 space-y-4">{children}</div>
    </section>
  );
}