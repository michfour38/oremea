import {
  detectDependencyClusters,
} from "./dependency-cluster-engine"

import type {
  CompassAreaResponse,
  CompassGoalArea,
} from "./session-types"

export type PrimaryAreaReflection = {
  detectedArea: CompassGoalArea | null
  reflection: string
}

export function reflectPrimaryArea(
  responses: CompassAreaResponse[],
): PrimaryAreaReflection {
  if (responses.length === 0) {
    return {
      detectedArea: null,
      reflection:
        "Compass does not yet have enough information to reflect a possible primary area.",
    }
  }

  const clusters = detectDependencyClusters(responses)

  const strongestCluster = clusters[0]

  if (!strongestCluster) {
    return {
      detectedArea: null,
      reflection:
        "Compass could not yet identify a useful leverage point.",
    }
  }

  const detectedArea =
    strongestCluster.supportingAreas[0] as CompassGoalArea

  return {
    detectedArea,

    reflection: `
Compass noticed that several of your answers appear connected through ${strongestCluster.label}.

This does not mean Compass is deciding for you.

It also does not mean ${strongestCluster.label} is the only thing that matters.

It means movement there may create movement elsewhere.

Sometimes the most important area is not the one carrying the most emotion.

Sometimes it is the area carrying the most leverage.

The question is not:

"What feels biggest?"

The question is:

"What creates the strongest bridge between your current reality and the reality you want to create?"
`.trim(),
  }
}