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

  const scored = responses.map((response) => ({
    area: response.area,

    score:
      response.languageWeight +
      response.emotionalWeight +
      response.valueWords.length,
  }))

  scored.sort((a, b) => b.score - a.score)

  const strongest = scored[0]

  if (!strongest) {
    return {
      detectedArea: null,
      reflection:
        "Compass could not yet identify a possible area carrying stronger emotional or cognitive weighting.",
    }
  }

  return {
    detectedArea: strongest.area,

    reflection: `
Compass noticed stronger emotional and cognitive weighting around ${strongest.area}.

This does not mean Compass is deciding for you.

You may feel this area truly is most important right now,
or you may feel another area matters more deeply.

Sometimes people speak most emotionally about:
- what hurts most,
- what feels most urgent,
- or what supports another deeper goal.

Does this reflection feel accurate to you?
`.trim(),
  }
}