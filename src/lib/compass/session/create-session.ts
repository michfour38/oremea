import type {
  CompassGoalArea,
  CompassSession,
} from "./session-types"

import { COMPASS_AREA_QUESTIONS } from "./session-areas"

export function createCompassSession(): CompassSession {
  const firstArea =
    COMPASS_AREA_QUESTIONS[0]

  return {
    id: crypto.randomUUID(),

    stage: "area_discovery",

    currentQuestion: firstArea.question,

    selectedArea: null,

    detectedPrimaryArea: null,

    areaResponses: [],

    recursiveLayers: [],

    coreValueHypothesis: null,

    resistanceMap: null,

    executionCheck: null,

    finalNextStep: null,

    resonanceCtaEligible: false,
  }
}

export function getNextArea(
  currentArea: CompassGoalArea,
): CompassGoalArea | null {
  const areas: CompassGoalArea[] = [
    "relationships",
    "income",
    "health",
    "spirituality",
    "investments",
    "network",
    "knowledge",
    "lifestyle",
  ]

  const currentIndex =
    areas.indexOf(currentArea)

  const nextIndex = currentIndex + 1

  return areas[nextIndex] ?? null
}