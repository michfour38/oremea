import { detectCompassSignals } from "../language-signals"

import type {
  CompassAreaResponse,
  CompassGoalArea,
} from "./session-types"

const EMOTIONAL_WORDS = [
  "desperate",
  "afraid",
  "fear",
  "stuck",
  "trapped",
  "love",
  "lonely",
  "peace",
  "safe",
  "safety",
  "freedom",
  "pressure",
  "overwhelmed",
  "calm",
  "stable",
  "seen",
  "worthy",
  "anxious",
  "exhausted",
]

const VALUE_WORDS = [
  "freedom",
  "peace",
  "stability",
  "love",
  "security",
  "connection",
  "clarity",
  "truth",
  "discipline",
  "strength",
  "health",
  "growth",
  "purpose",
  "consistency",
  "success",
  "alignment",
]

export function analyzeAreaResponse({
  area,
  answer,
}: {
  area: CompassGoalArea
  answer: string
}): CompassAreaResponse {
  const normalized =
    answer.toLowerCase()

  const signals =
    detectCompassSignals(answer)

  const emotionalMatches =
    EMOTIONAL_WORDS.filter((word) =>
      normalized.includes(word),
    )

  const valueMatches =
    VALUE_WORDS.filter((word) =>
      normalized.includes(word),
    )

  const languageWeight =
    signals.length +
    valueMatches.length

  const emotionalWeight =
    emotionalMatches.length * 2

  return {
    area,
    answer,

    languageWeight,

    emotionalWeight,

    valueWords: valueMatches,

    frictionWords: emotionalMatches,
  }
}