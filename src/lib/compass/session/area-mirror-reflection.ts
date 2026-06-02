import {
  buildAreaELObservation,
} from "./area-el-observation"

import type { CompassAreaResponse } from "./session-types"

export type CompassAreaMirrorReflection = {
  reflection: string
  strongestAreas: string[]
}

export function buildAreaMirrorReflection(
  responses: CompassAreaResponse[],
): CompassAreaMirrorReflection {
  if (responses.length === 0) {
    return {
      strongestAreas: [],
      reflection:
        "Compass does not have enough information to reflect anything useful yet.",
    }
  }

  const scored = responses
    .map((response) => ({
      ...response,
      score:
        response.languageWeight +
        response.emotionalWeight +
        response.valueWords.length +
        response.frictionWords.length,
    }))
    .sort((a, b) => b.score - a.score)

  const strongestAreas = scored
    .slice(0, 3)
    .map((item) => item.area)

  const observation = buildAreaELObservation(responses)

  return {
    strongestAreas,
    reflection: observation.reflection,
  }
}