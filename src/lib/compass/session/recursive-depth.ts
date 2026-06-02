import type { CompassRecursiveLayer } from "./session-types"

const VALUE_WORDS = [
  "freedom",
  "peace",
  "love",
  "safety",
  "security",
  "clarity",
  "trust",
  "connection",
  "stability",
  "purpose",
  "meaning",
  "strength",
  "discipline",
  "calm",
  "worthiness",
  "belonging",
  "truth",
  "joy",
  "energy",
  "confidence",
  "sovereignty",
  "consistency",
  "choice",
  "independence",
  "capacity",
  "protection",
  "provision",
  "responsibility",
  "movement",
]

export function getRecursiveQuestion(layer: number): string {
  const questions = [
    "Why does this matter to you right now?",
    "What makes this goal significant enough to keep your attention?",
    "What value, responsibility, standard, hope, or expectation gives this goal its weight?",
    "If this became fully real in your life, what would become possible that feels difficult, unavailable, restricted, or out of reach right now?",
    "What would you be able to do, build, choose, protect, experience, or create from that reality?",
    "What does this show you about what you are no longer willing to live without?",
    "After everything you have written, what is the core reality you are choosing to build?",
  ]

  return questions[layer - 1] ?? questions[questions.length - 1]
}

export function createRecursiveLayer({
  layer,
  question,
  answer,
}: {
  layer: number
  question: string
  answer: string
}): CompassRecursiveLayer {
  const normalized = answer.toLowerCase()

  const detectedValueWords = VALUE_WORDS.filter((word) =>
    normalized.includes(word),
  )

  return {
    layer,
    question,
    answer,
    detectedValueWords,
    detectedReasonWords: extractReasonWords(answer),
  }
}

export function buildAdaptiveRecursiveQuestion({
  layer,
  selectedAreaLabel,
  previousAnswer,
  firstAnswer,
}: {
  layer: number
  selectedAreaLabel: string
  previousAnswer: string
  firstAnswer?: string
}): string {
  const reference = cleanReference(previousAnswer || firstAnswer || "")
  const area = selectedAreaLabel.toLowerCase()

  if (!reference) {
    return `Why does ${area} matter to you right now?`
  }

  if (layer === 1) {
    return `You chose ${area}. In your own words, why does “${reference}” matter to you right now?`
  }

  if (layer === 2) {
    return `When you describe “${reference}”, what makes this significant enough to keep your attention?`
  }

  if (layer === 3) {
    return `Under “${reference}”, what value, responsibility, standard, hope, or expectation gives this goal its weight?`
  }

  if (layer === 4) {
    return `If “${reference}” became fully real in your life, what would become possible that feels difficult, unavailable, restricted, or out of reach right now?`
  }

  if (layer === 5) {
    return `From the reality you described in “${reference}”, what would you be able to do, build, choose, protect, experience, or create?`
  }

  if (layer === 6) {
    return `Looking at “${reference}”, what does this show you about what you are no longer willing to live without?`
  }

  return `After everything you have written, what is the core reality you are choosing to build through “${reference}”?`
}

function cleanReference(input: string): string {
  const trimmed = input.trim().replace(/\s+/g, " ")

  if (trimmed.length <= 110) {
    return trimmed
  }

  return `${trimmed.slice(0, 110)}...`
}

function extractReasonWords(input: string): string[] {
  const words = input.toLowerCase().split(/\W+/).filter(Boolean)

  const ignored = [
    "the",
    "and",
    "but",
    "that",
    "with",
    "from",
    "into",
    "because",
    "would",
    "could",
    "should",
    "this",
    "there",
    "their",
    "about",
    "right",
    "what",
    "when",
    "where",
    "which",
  ]

  return [
    ...new Set(
      words.filter((word) => word.length > 4 && !ignored.includes(word)),
    ),
  ]
}