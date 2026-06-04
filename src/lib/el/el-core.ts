import {
  extractEvidence,
} from "./evidence-engine"

import {
  createObservations,
} from "./observation-engine"

import {
  calculateScores,
  createEmptyScores,
} from "./scoring-engine"

import {
  determineState,
} from "./state-engine"

import {
  selectQuestion,
} from "./question-selector"

import {
  generateResponse,
} from "./response-engine"

import type {
  ELInput,
  ELOutput,
  EngineTick,
} from "./el-types"

export function runELTick({
  participantResponse,
  previousTicks = [],
  memory = null,
}: ELInput): ELOutput {
  const evidence = extractEvidence(participantResponse)

  const observations = createObservations(evidence)

  const previousScores =
    previousTicks[previousTicks.length - 1]?.scores ??
    createEmptyScores()

  const scores = calculateScores({
    evidence,
    observations,
    previousScores,
  })

  const primaryState = determineState({
    evidence,
    observations,
    scores,
  })

  const selectedQuestion = selectQuestion({
    state: primaryState,
    evidence,
    observations,
    scores,
  })

  const reply = generateResponse({
  participantResponse,
  state: primaryState,
  question: selectedQuestion,
  evidence,
  observations,
  scores,
})

  const tick: EngineTick = {
    id: crypto.randomUUID(),
    participantResponse,
    evidence,
    observations,
    scores,
    primaryState,
    selectedQuestion,
    timestamp: new Date().toISOString(),
  }

  return {
    tick,
    reply,
    shouldContinue:
      primaryState !== "movement_current",
  }
}