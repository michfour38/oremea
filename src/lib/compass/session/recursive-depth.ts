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

const DESCENT_QUESTION_KEY = "oremea-compass-descent-question-v3"
const LEGACY_DESCENT_QUESTION_KEYS = [
  "oremea-compass-descent-question-v2",
  "oremea-compass-descent-question",
]

export function getRecursiveQuestion(layer: number): string {
  const questions = [
    "Why does this matter to you right now?",
    "Why is that important to you?",
    "Why did that affect you that way?",
    "Why did that feel true to you?",
    "Why is that still important to you?",
    "Why does that matter beneath everything else you have named?",
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

  return buildRootDigFallback({
    layer,
    selectedAreaLabel,
    sourceAnswer,
  })
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

  return !changesLens && normalized.startsWith("why")
}

function buildRootDigFallback({
  layer,
  selectedAreaLabel,
  sourceAnswer,
}: {
  layer: number
  selectedAreaLabel: string
  sourceAnswer: string
}): string {
  const cleaned = sourceAnswer
    .trim()
    .replace(/^because\s+/i, "")
    .replace(/[.!?]+$/, "")

  const tiredMatch = cleaned.match(/^i(?:['’]m| am)\s+tired of\s+(.+)/i)
  if (tiredMatch) {
    return `Why are you tired of ${toSecondPerson(tiredMatch[1])}?`
  }

  const feltLikeMatch = cleaned.match(/^i(?:\s+always)?\s+felt like\s+(.+)/i)
  if (feltLikeMatch) {
    return `Why did you feel like ${toSecondPerson(feltLikeMatch[1])}?`
  }

  const feltMatch = cleaned.match(/^i(?:\s+always)?\s+felt\s+(.+)/i)
  if (feltMatch) {
    return `Why did you feel ${toSecondPerson(feltMatch[1])}?`
  }

  const beliefMatch = cleaned.match(/^i\s+(?:believed|thought)\s+(.+)/i)
  if (beliefMatch) {
    return `Why did you believe ${toSecondPerson(beliefMatch[1])}?`
  }

  const focus = extractFocusPhrase(cleaned)
  if (focus) {
    return `Why is ${toSecondPerson(focus)} so important to you?`
  }

  return layer === 1
    ? `Why does ${selectedAreaLabel.toLowerCase()} matter to you right now?`
    : getRecursiveQuestion(layer)
}

function clearLegacyQuestionCache() {
  if (typeof window === "undefined") return

  LEGACY_DESCENT_QUESTION_KEYS.forEach((key) =>
    window.sessionStorage.removeItem(key),
  )
}

function toSecondPerson(input: string): string {
  return input
    .trim()
    .replace(/\bi['’]m\b/gi, "you're")
    .replace(/\bi am\b/gi, "you are")
    .replace(/\bi['’]ve\b/gi, "you've")
    .replace(/\bi['’]d\b/gi, "you'd")
    .replace(/\bmy\b/gi, "your")
    .replace(/\bme\b/gi, "you")
    .replace(/\bi\b/gi, "you")
}

function extractFocusPhrase(input: string): string | null {
  const normalized = input.trim().replace(/\s+/g, " ")
  if (!normalized) return null

  const clauses = normalized
    .split(/[,;]|\s+[—–-]\s+/)
    .map((part) => part.trim().replace(/[.!?]+$/, ""))
    .filter(Boolean)

  const concise = clauses.find((part) => {
    const words = part.split(/\s+/).filter(Boolean)
    return words.length <= 12 && part.length <= 96
  })

  if (concise) return concise

  const words = normalized.split(/\s+/).filter(Boolean)
  return words.slice(0, 12).join(" ").replace(/[.!?,;:]+$/, "") || null
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
