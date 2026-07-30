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

const DESCENT_QUESTION_KEY = "oremea-compass-descent-question-v4"
const LEGACY_DESCENT_QUESTION_KEYS = [
  "oremea-compass-descent-question-v3",
  "oremea-compass-descent-question-v2",
  "oremea-compass-descent-question",
]

export function getRecursiveQuestion(layer: number): string {
  const questions = [
    "Why does this matter to you right now?",
    "Why is that important to you?",
    "Why does that matter to you?",
    "Why is that important?",
    "Why does that matter?",
    "Why is that important to you here?",
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
  if (!normalized || !normalized.startsWith("why")) return false

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

  const changesThread = [
    "why did you feel",
    "why do you feel",
    "why did you believe",
    "why do you believe",
    "why did you think",
    "why do you think",
    "why did you conclude",
    "why did you react",
    "why wouldn't your",
    "why would your",
  ].some((phrase) => normalized.startsWith(phrase))

  return !changesLens && !changesThread
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
  const directAnswer = extractDirectAnswer(sourceAnswer)

  if (!directAnswer) {
    return layer === 1
      ? `Why does ${selectedAreaLabel.toLowerCase()} matter to you right now?`
      : getRecursiveQuestion(layer)
  }

  const clause = toSecondPerson(directAnswer)
  const pastTense = /^(you\s+(?:felt|heard|were|had|believed|thought|wanted|needed)|it\s+(?:felt|was|made))/i.test(
    clause,
  )

  if (pastTense) {
    return layer % 2 === 0
      ? `Why was it important to you that ${lowercaseFirst(clause)}?`
      : `Why did it matter to you that ${lowercaseFirst(clause)}?`
  }

  return layer % 2 === 0
    ? `Why is it important to you that ${lowercaseFirst(clause)}?`
    : `Why does it matter to you that ${lowercaseFirst(clause)}?`
}

function extractDirectAnswer(input: string): string {
  const normalized = input.trim().replace(/\s+/g, " ")
  if (!normalized) return ""

  const fragments = normalized
    .match(/[^.!?]+[.!?]?/g)
    ?.map((part) => part.trim())
    .filter(Boolean) ?? [normalized]

  const statements = fragments
    .filter((part) => !part.endsWith("?"))
    .filter((part) => !/^(why|what|how|when|where|who|would|could|should)\b/i.test(part))
    .map((part) => part.replace(/^because\s+/i, "").replace(/[.!?]+$/, "").trim())
    .filter(Boolean)

  const directStatements = statements.filter((part) =>
    /^(i\b|i['’]m\b|i am\b|i['’]ve\b|i have\b|i felt\b|i feel\b|i want\b|i need\b|i care\b|i believe\b|i thought\b|i was\b|my\b|me\b|it made me\b|that made me\b)/i.test(
      part,
    ),
  )

  const selected = directStatements.length > 0 ? directStatements : statements
  return selected.join("; ")
}

function lowercaseFirst(input: string): string {
  return input ? input.charAt(0).toLowerCase() + input.slice(1) : input
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
    .replace(/^because\s+/i, "")
    .replace(/\bi['’]m\b/gi, "you're")
    .replace(/\bi am\b/gi, "you are")
    .replace(/\bi['’]ve\b/gi, "you've")
    .replace(/\bi['’]d\b/gi, "you'd")
    .replace(/\bmy\b/gi, "your")
    .replace(/\bme\b/gi, "you")
    .replace(/\bi\b/gi, "you")
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
