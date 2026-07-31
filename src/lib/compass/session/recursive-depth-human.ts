import { buildMirrorWhyQuestion } from "@/src/lib/oremea/mirror-question"

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

const DESCENT_QUESTION_KEY = "oremea-compass-descent-question-v6"
const LEGACY_DESCENT_QUESTION_KEYS = [
  "oremea-compass-descent-question-v5",
  "oremea-compass-descent-question-v4",
  "oremea-compass-descent-question-v3",
  "oremea-compass-descent-question-v2",
  "oremea-compass-descent-question",
]

export function getRecursiveQuestion(layer: number): string {
  const questions = [
    "Why does this matter to you right now?",
    "Why is that important to you?",
    "Why does that matter to you?",
    "Why is that important here?",
    "Why does that matter now?",
    "Why is that still important to you?",
    "Why does that matter beneath everything else you have named?",
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
    return `Why does ${selectedAreaLabel.toLowerCase()} matter to you right now?`
  }

  return buildMirrorWhyQuestion({ layer, sourceAnswer })
}

function isUsableQuestion(question: string): boolean {
  const normalized = question.trim().toLowerCase()
  if (!normalized.startsWith("why") || !normalized.endsWith("?")) return false

  return ![
    "make possible",
    "give you room",
    "what comes next",
    "what do you picture",
    "what would it mean",
  ].some((phrase) => normalized.includes(phrase))
}

function clearLegacyQuestionCache() {
  if (typeof window === "undefined") return
  LEGACY_DESCENT_QUESTION_KEYS.forEach((key) => window.sessionStorage.removeItem(key))
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
