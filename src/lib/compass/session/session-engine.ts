import { analyzeAreaResponse } from "./area-analysis"
import { createRecursiveLayer } from "./recursive-depth"
import { reflectCoreValues } from "./core-value-reflection"
import { generateNextStep } from "./generate-next-step"
import { mapResistance } from "./resistance-mapping"
import { evaluateResonanceBridge } from "./resonance-bridge"
import { reflectPrimaryArea } from "./select-primary-area"

import type {
  CompassGoalArea,
  CompassSession,
} from "./session-types"

export function addAreaResponse({
  session,
  area,
  answer,
}: {
  session: CompassSession
  area: CompassGoalArea
  answer: string
}): CompassSession {
  const analyzed =
    analyzeAreaResponse({
      area,
      answer,
    })

  return {
    ...session,

    areaResponses: [
      ...session.areaResponses,
      analyzed,
    ],
  }
}

export function addRecursiveAnswer({
  session,
  layer,
  question,
  answer,
}: {
  session: CompassSession
  layer: number
  question: string
  answer: string
}): CompassSession {
  const recursiveLayer =
    createRecursiveLayer({
      layer,
      question,
      answer,
    })

  return {
    ...session,

    recursiveLayers: [
      ...session.recursiveLayers,
      recursiveLayer,
    ],
  }
}

export function buildPrimaryAreaReflection(
  session: CompassSession,
) {
  return reflectPrimaryArea(
    session.areaResponses,
  )
}

export function buildCoreValueReflection(
  session: CompassSession,
) {
  return reflectCoreValues(
    session.recursiveLayers,
  )
}

export function buildResistanceMap({
  answer,
}: {
  answer: string
}) {
  return mapResistance({
    answer,
  })
}

export function buildNextStep({
  goal,
  session,
}: {
  goal: string
  session: CompassSession
}) {
  return generateNextStep({
    goal,

    resistance:
      session.resistanceMap,

    execution:
      session.executionCheck,
  })
}

export function buildResonanceBridge(
  session: CompassSession,
) {
  return evaluateResonanceBridge(
    session.areaResponses,
  )
}