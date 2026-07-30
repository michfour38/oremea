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

const DESCENT_QUESTION_KEY = "oremea-compass-descent-question-v2"
const LEGACY_DESCENT_QUESTION_KEY = "oremea-compass-descent-question"

export function getRecursiveQuestion(layer: number): string {
  const questions = [
    "Why does this matter to you right now?",
    "What is it about what you just described that matters to you?",
    "What makes that important to you?",
    "Why does that matter to you?",
    "What is underneath that for you?",
    "What makes that matter so deeply to you?",
    "Why does that matter at the deepest level for you?",
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

export function rememberAdaptiveRecursiveQuestion({
  layer,
  sourceAnswer,
  question,
}: {
  layer: number
  sourceAnswer: string
  question: string
}) {
  if (typeof window === "undefined" || !isRootDigQuestion(question)) return

  window.sessionStorage.removeItem(LEGACY_DESCENT_QUESTION_KEY)
  window.sessionStorage.setItem(
    DESCENT_QUESTION_KEY,
    JSON.stringify({
      layer,
      sourceAnswer: normalizeSource(sourceAnswer),
      question: question.trim(),
    }),
  )
}

export function getRememberedAdaptiveRecursiveQuestion({
  layer,
  sourceAnswer,
}: {
  layer: number
  sourceAnswer: string
}): string | null {
  if (typeof window === "undefined") return null

  window.sessionStorage.removeItem(LEGACY_DESCENT_QUESTION_KEY)

  const raw = window.sessionStorage.getItem(DESCENT_QUESTION_KEY)
  if (!raw) return null

  try {
    const stored = JSON.parse(raw) as {
      layer?: unknown
      sourceAnswer?: unknown
      question?: unknown
    }

    if (
      stored.layer === layer &&
      stored.sourceAnswer === normalizeSource(sourceAnswer) &&
      typeof stored.question === "string" &&
      isRootDigQuestion(stored.question)
    ) {
      return stored.question.trim()
    }
  } catch {
    window.sessionStorage.removeItem(DESCENT_QUESTION_KEY)
    return null
  }

  window.sessionStorage.removeItem(DESCENT_QUESTION_KEY)
  return null
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
  const sourceAnswer = previousAnswer || firstAnswer || ""
  const remembered = getRememberedAdaptiveRecursiveQuestion({
    layer,
    sourceAnswer,
  })

  if (remembered) return remembered

  if (layer === 1) {
    return `Why does ${selectedAreaLabel.toLowerCase()} matter to you right now?`
  }

  return getRecursiveQuestion(layer)
}

function isRootDigQuestion(question: string): boolean {
  const normalized = question.trim().toLowerCase()
  if (!normalized) return false

  const changesLens = [
    "make possible",
    "give you room",
    "what would this create",
    "what would that create",
    "what comes next",
    "what do you picture",
    "what would it mean",
    "what does it mean",
    "what does this carry",
    "what does that carry",
    "how much weight",
  ].some((phrase) => normalized.includes(phrase))

  if (changesLens) return false

  return (
    normalized.includes("why") ||
    normalized.includes("matter") ||
    normalized.includes("important") ||
    normalized.includes("underneath")
  )
}

function normalizeSource(input: string): string {
  return input.trim().replace(/\s+/g, " ")
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
