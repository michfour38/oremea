import type { CompassDescentAttempt } from "./compass-descent.types"
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

const DESCENT_QUESTION_KEY = "oremea-compass-descent-question-v17"
const DESCENT_ATTEMPTS_KEY = "oremea-compass-descent-attempts-v3"
const LEGACY_DESCENT_QUESTION_KEYS = [
  "oremea-compass-descent-question-v16",
  "oremea-compass-descent-question-v15",
  "oremea-compass-descent-question-v14",
  "oremea-compass-descent-question-v13",
  "oremea-compass-descent-question-v12",
  "oremea-compass-descent-question-v11",
  "oremea-compass-descent-question-v10",
  "oremea-compass-descent-question-v9",
  "oremea-compass-descent-question-v8",
  "oremea-compass-descent-question-v7",
  "oremea-compass-descent-question-v6",
  "oremea-compass-descent-question-v5",
  "oremea-compass-descent-question-v4",
  "oremea-compass-descent-question-v3",
  "oremea-compass-descent-question-v2",
  "oremea-compass-descent-question",
]

export function getRecursiveQuestion(layer: number): string {
  const questions = [
    "Why is this important to you?",
    "Why does this matter to you?",
    "Why is this significant to you?",
    "Why did this matter to you?",
    "Why was this important to you?",
    "Why does this remain important to you?",
    "Why is this the reason beneath the goal?",
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

  return {
    layer,
    question,
    answer,
    detectedValueWords: VALUE_WORDS.filter((word) => normalized.includes(word)),
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
  if (typeof window === "undefined" || !isUsableQuestion(question)) return

  clearLegacyQuestionCache()
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

  clearLegacyQuestionCache()
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
      isUsableQuestion(stored.question)
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

export function rememberCompassDescentAttempts({
  layer,
  sourceAnswer,
  attempts,
}: {
  layer: number
  sourceAnswer: string
  attempts: CompassDescentAttempt[]
}) {
  if (typeof window === "undefined") return

  window.sessionStorage.setItem(
    DESCENT_ATTEMPTS_KEY,
    JSON.stringify({
      layer,
      sourceAnswer: normalizeSource(sourceAnswer),
      attempts,
    }),
  )
}

export function getRememberedCompassDescentAttempts({
  layer,
  sourceAnswer,
}: {
  layer: number
  sourceAnswer: string
}): CompassDescentAttempt[] {
  if (typeof window === "undefined") return []

  const raw = window.sessionStorage.getItem(DESCENT_ATTEMPTS_KEY)
  if (!raw) return []

  try {
    const stored = JSON.parse(raw) as {
      layer?: unknown
      sourceAnswer?: unknown
      attempts?: unknown
    }

    if (
      stored.layer === layer &&
      stored.sourceAnswer === normalizeSource(sourceAnswer) &&
      Array.isArray(stored.attempts)
    ) {
      return stored.attempts.filter(isStoredAttempt)
    }
  } catch {
    window.sessionStorage.removeItem(DESCENT_ATTEMPTS_KEY)
    return []
  }

  window.sessionStorage.removeItem(DESCENT_ATTEMPTS_KEY)
  return []
}

export function clearRememberedCompassDescentAttempts({
  layer,
  sourceAnswer,
}: {
  layer: number
  sourceAnswer: string
}) {
  if (typeof window === "undefined") return

  const raw = window.sessionStorage.getItem(DESCENT_ATTEMPTS_KEY)
  if (!raw) return

  try {
    const stored = JSON.parse(raw) as {
      layer?: unknown
      sourceAnswer?: unknown
    }

    if (
      stored.layer === layer &&
      stored.sourceAnswer === normalizeSource(sourceAnswer)
    ) {
      window.sessionStorage.removeItem(DESCENT_ATTEMPTS_KEY)
    }
  } catch {
    window.sessionStorage.removeItem(DESCENT_ATTEMPTS_KEY)
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
  const sourceAnswer = previousAnswer || firstAnswer || ""
  const remembered = getRememberedAdaptiveRecursiveQuestion({ layer, sourceAnswer })

  if (remembered) return remembered

  if (layer === 1 && !sourceAnswer) {
    return `Why is ${selectedAreaLabel.toLowerCase()} important to you?`
  }

  return ""
}

function isStoredAttempt(value: unknown): value is CompassDescentAttempt {
  if (!value || typeof value !== "object") return false

  const attempt = value as Record<string, unknown>
  return (
    typeof attempt.question === "string" &&
    typeof attempt.answer === "string" &&
    typeof attempt.movement === "string" &&
    typeof attempt.direction === "string"
  )
}

function isUsableQuestion(question: string): boolean {
  const normalized = question.trim().toLowerCase()
  if (!normalized.endsWith("?")) return false
  if (!/^why\b/.test(normalized)) return false

  return ![
    "make possible",
    "makes possible",
    "made possible",
    "become possible",
    "becomes possible",
    "what comes next",
    "what do you picture",
    "what would it mean now",
    "how will you",
    "how can you",
    "lead to",
    "opens up",
  ].some((phrase) => normalized.includes(phrase))
}

function clearLegacyQuestionCache() {
  if (typeof window === "undefined") return
  LEGACY_DESCENT_QUESTION_KEYS.forEach((key) =>
    window.sessionStorage.removeItem(key),
  )
  window.sessionStorage.removeItem("oremea-compass-descent-attempts-v1")
  window.sessionStorage.removeItem("oremea-compass-descent-attempts-v2")
}

function normalizeSource(input: string): string {
  return input.trim().replace(/\s+/g, " ")
}

function extractReasonWords(input: string): string[] {
  const ignored = new Set([
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
  ])

  return [
    ...new Set(
      input
        .toLowerCase()
        .split(/\W+/)
        .filter((word) => word.length > 4 && !ignored.has(word)),
    ),
  ]
}
