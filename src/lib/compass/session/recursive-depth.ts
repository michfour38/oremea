import type {
  CompassRecursiveLayer,
} from "./session-types"

const RECURSIVE_QUESTIONS = [
  "Why is this important to you?",
  "What would change in your life if this became consistent?",
  "What does achieving this allow you to feel, experience, or become?",
  "What feels unresolved, painful, or restricted without this?",
  "What deeper value do you think this goal is connected to?",
  "What are you truly seeking underneath this goal?",
  "If this goal fully became reality, what finally becomes possible?",
]

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
]

export function getRecursiveQuestion(
  layer: number,
): string {
  return (
    RECURSIVE_QUESTIONS[layer - 1] ??
    RECURSIVE_QUESTIONS[
      RECURSIVE_QUESTIONS.length - 1
    ]
  )
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
  const normalized =
    answer.toLowerCase()

  const detectedValueWords =
    VALUE_WORDS.filter((word) =>
      normalized.includes(word),
    )

  return {
    layer,
    question,
    answer,

    detectedValueWords,

    detectedReasonWords:
      extractReasonWords(answer),
  }
}

function extractReasonWords(
  input: string,
): string[] {
  const words = input
    .toLowerCase()
    .split(/\W+/)
    .filter(Boolean)

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
  ]

  return [
    ...new Set(
      words.filter(
        (word) =>
          word.length > 4 &&
          !ignored.includes(word),
      ),
    ),
  ]
}