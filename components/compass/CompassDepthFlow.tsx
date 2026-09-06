"use client"

import { useEffect, useMemo, useState } from "react"

import {
  COMPASS_DESCENT_LAYER_COUNT,
  clearRememberedCompassDescentAttempts,
  getRememberedAdaptiveRecursiveQuestion,
  getRememberedCompassDescentAttempts,
  rememberAdaptiveRecursiveQuestion,
  rememberCompassDescentAttempts,
  type CompassAreaResponse,
  type CompassDescentAttempt,
  type CompassDescentDecision,
  type CompassDescentResolution,
  type CompassGoalArea,
  type CompassRecursiveLayer,
} from "@/src/lib/compass/session"

import { CompassCard } from "./CompassCard"

const BODY_TEXT = "text-zinc-300"

export function CompassDepthIntro({
  selectedAreaLabel,
  onBegin,
}: {
  selectedAreaLabel: string
  onBegin: () => void
}) {
  return (
    <CompassCard
      title="The Descent"
      description={`You have chosen ${selectedAreaLabel}. Now Compass begins identifying what matters most beneath the surface of that choice.`}
    >
      <p className={`text-sm leading-relaxed ${BODY_TEXT}`}>
        Across seven layers, Compass keeps asking why to follow what matters
        beneath your first answer.
      </p>

      <button onClick={onBegin} className="primary-button">
        Begin The Descent
      </button>
    </CompassCard>
  )
}

export function CompassDepthFlow({
  selectedArea,
  selectedAreaLabel,
  areaResponses,
  recursiveLayers,
  recursiveAnswer,
  onAnswerChange,
  onSubmitAnswer,
}: {
  selectedArea: CompassGoalArea | null
  selectedAreaLabel: string
  areaResponses: CompassAreaResponse[]
  recursiveLayers: CompassRecursiveLayer[]
  recursiveAnswer: string
  onAnswerChange: (value: string) => void
  onSubmitAnswer: (resolution: CompassDescentResolution) => void
}) {
  const layerNumber = Math.min(
    recursiveLayers.length + 1,
    COMPASS_DESCENT_LAYER_COUNT,
  )
  const firstAnswer = useMemo(
    () =>
      areaResponses.find((response) => response.area === selectedArea)?.answer ?? "",
    [areaResponses, selectedArea],
  )
  const previousAnswer = recursiveLayers[recursiveLayers.length - 1]?.answer ?? ""
  const carriedAnswer = previousAnswer || firstAnswer

  const [currentQuestion, setCurrentQuestion] = useState("")
  const [attempts, setAttempts] = useState<CompassDescentAttempt[]>([])
  const [isQuestionLoading, setIsQuestionLoading] = useState(true)
  const [isAnswerSubmitting, setIsAnswerSubmitting] = useState(false)
  const [questionError, setQuestionError] = useState("")
  const [retryNonce, setRetryNonce] = useState(0)

  const latestAttemptAnswer = attempts[attempts.length - 1]?.answer ?? ""
  const visibleCarriedAnswer = latestAttemptAnswer || carriedAnswer

  useEffect(() => {
    let cancelled = false

    async function loadQuestion() {
      const rememberedAttempts = getRememberedCompassDescentAttempts({
        layer: layerNumber,
        sourceAnswer: carriedAnswer,
      })
      const remembered = getRememberedAdaptiveRecursiveQuestion({
        layer: layerNumber,
        sourceAnswer: carriedAnswer,
      })

      if (remembered) {
        setAttempts(rememberedAttempts)
        setCurrentQuestion(remembered)
        setQuestionError("")
        setIsQuestionLoading(false)
        return
      }

      if (!selectedArea) {
        setCurrentQuestion("")
        setQuestionError("Choose an area before beginning The Descent.")
        setIsQuestionLoading(false)
        return
      }

      setAttempts(rememberedAttempts)
      setCurrentQuestion("")
      setQuestionError("")
      setIsQuestionLoading(true)

      try {
        const response = await fetch("/api/compass/descent-question", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            layer: layerNumber,
            selectedArea,
            areaResponses,
            recursiveLayers,
          }),
        })

        const data = await response.json()

        if (cancelled) return

        const generatedQuestion =
          response.ok && data?.ok && typeof data.question === "string"
            ? data.question.trim()
            : ""

        if (!generatedQuestion) {
          throw new Error(
            typeof data?.error === "string"
              ? data.error
              : "Mirror did not return a usable Descent question.",
          )
        }

        rememberAdaptiveRecursiveQuestion({
          layer: layerNumber,
          sourceAnswer: carriedAnswer,
          question: generatedQuestion,
        })

        setCurrentQuestion(generatedQuestion)
      } catch (error) {
        if (cancelled) return

        console.error("Compass Descent question failed:", error)
        setCurrentQuestion("")
        setQuestionError(
          "Mirror could not form the next question without leaving your words.",
        )
      } finally {
        if (!cancelled) setIsQuestionLoading(false)
      }
    }

    void loadQuestion()

    return () => {
      cancelled = true
    }
  }, [
    areaResponses,
    carriedAnswer,
    layerNumber,
    recursiveLayers,
    retryNonce,
    selectedArea,
  ])

  async function submitAnswer() {
    if (
      !selectedArea ||
      !currentQuestion ||
      !recursiveAnswer.trim() ||
      isAnswerSubmitting
    ) {
      return
    }

    setIsAnswerSubmitting(true)
    setQuestionError("")

    try {
      const participantAnswer = recursiveAnswer.trim()
      const displayedQuestion = currentQuestion

      const response = await fetch("/api/compass/descent-question", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          layer: layerNumber,
          selectedArea,
          areaResponses,
          recursiveLayers,
          currentQuestion: displayedQuestion,
          currentAnswer: participantAnswer,
          attempts,
        }),
      })

      const data = await response.json()
      const decision = data?.decision as CompassDescentDecision | undefined

      if (
        !response.ok ||
        !data?.ok ||
        !decision ||
        typeof decision.historyAction !== "string"
      ) {
        throw new Error(
          typeof data?.error === "string"
            ? data.error
            : "Mirror did not return a usable Descent decision.",
        )
      }

      const currentAttempt: CompassDescentAttempt = {
        question: displayedQuestion,
        answer: participantAnswer,
        movement: decision.movement,
        direction: decision.direction,
      }

      if (decision.historyAction === "stay") {
        const updatedAttempts = [...attempts, currentAttempt]
        rememberCompassDescentAttempts({
          layer: layerNumber,
          sourceAnswer: carriedAnswer,
          attempts: updatedAttempts,
        })

        if (!decision.question) {
          throw new Error("Mirror did not return a same-layer question.")
        }

        rememberAdaptiveRecursiveQuestion({
          layer: layerNumber,
          sourceAnswer: carriedAnswer,
          question: decision.question,
        })

        setAttempts(updatedAttempts)
        setCurrentQuestion(decision.question)
      }

      if (decision.historyAction === "replace_previous") {
        clearRememberedCompassDescentAttempts({
          layer: layerNumber,
          sourceAnswer: carriedAnswer,
        })

        const correctedSource =
          decision.substantiveAnswer?.trim() || carriedAnswer

        if (!decision.question) {
          throw new Error("Mirror did not return a corrected-thread question.")
        }

        rememberAdaptiveRecursiveQuestion({
          layer: layerNumber,
          sourceAnswer: correctedSource,
          question: decision.question,
        })

        clearRememberedCompassDescentAttempts({
          layer: layerNumber,
          sourceAnswer: correctedSource,
        })

        setAttempts([])
        setCurrentQuestion(decision.question)
      }

      if (decision.historyAction === "append") {
        clearRememberedCompassDescentAttempts({
          layer: layerNumber,
          sourceAnswer: carriedAnswer,
        })

        if (
          layerNumber < COMPASS_DESCENT_LAYER_COUNT &&
          decision.question &&
          decision.substantiveAnswer
        ) {
          rememberAdaptiveRecursiveQuestion({
            layer: layerNumber + 1,
            sourceAnswer: decision.substantiveAnswer,
            question: decision.question,
          })
          clearRememberedCompassDescentAttempts({
            layer: layerNumber + 1,
            sourceAnswer: decision.substantiveAnswer,
          })
        }

        setAttempts([])
      }

      onSubmitAnswer({
        decision,
        displayedQuestion,
        participantAnswer,
      })
    } catch (error) {
      console.error("Compass Descent answer failed:", error)
      setQuestionError(
        "Mirror could not follow that answer without leaving your meaning.",
      )
    } finally {
      setIsAnswerSubmitting(false)
    }
  }

  // The submitted answer must leave the input immediately.
  // Keep the component mounted so a failed request can restore the untouched answer.
  if (isAnswerSubmitting) {
    return (
      <CompassCard
        eyebrow={`The Descent · Layer ${layerNumber} of ${COMPASS_DESCENT_LAYER_COUNT}`}
        title=""
        description=""
      >
        <p className="font-serif text-3xl leading-tight text-[#d8b15f] sm:text-4xl">
          Reading your response...
        </p>
      </CompassCard>
    )
  }

  return (
    <CompassCard
      eyebrow={`The Descent · Layer ${layerNumber} of ${COMPASS_DESCENT_LAYER_COUNT}`}
      title=""
      description=""
    >
      {visibleCarriedAnswer ? (
        <div className="rounded-[1.3rem] border border-zinc-700 bg-[#141414] p-5">
          <p className="text-xs uppercase tracking-[0.2em] text-zinc-300">
            You said
          </p>
          <p className="mt-3 whitespace-pre-line text-base leading-7 text-zinc-100 sm:text-lg">
            {visibleCarriedAnswer}
          </p>
        </div>
      ) : null}

      <div className="pt-2">
        {isQuestionLoading ? (
          <p className="font-serif text-3xl leading-tight text-[#d8b15f] sm:text-4xl">
            Reading your response...
          </p>
        ) : questionError ? (
          <div className="space-y-4">
            <p className="font-serif text-2xl leading-tight text-zinc-100 sm:text-3xl">
              {questionError}
            </p>
            <button
              type="button"
              onClick={() => setRetryNonce((value) => value + 1)}
              className="primary-button"
            >
              Try again
            </button>
          </div>
        ) : (
          <h2 className="font-serif text-3xl leading-tight text-[#d8b15f] sm:text-4xl">
            {currentQuestion}
          </h2>
        )}
      </div>

      <textarea
        value={recursiveAnswer}
        onChange={(event) => onAnswerChange(event.target.value)}
        placeholder="✱ The repetition is intentional. Answer in your own words; each response shapes the next why."
        rows={7}
        disabled={
          isQuestionLoading ||
          isAnswerSubmitting ||
          Boolean(questionError) ||
          !currentQuestion
        }
        className="compass-textarea compass-descent-textarea"
      />

      <button
        onClick={submitAnswer}
        disabled={
          isQuestionLoading ||
          isAnswerSubmitting ||
          Boolean(questionError) ||
          !currentQuestion ||
          !recursiveAnswer.trim()
        }
        className="primary-button disabled:cursor-not-allowed disabled:opacity-50"
      >
        Continue
      </button>
    </CompassCard>
  )
}
