import type { ThoughtActionSignal } from "./types"

const THOUGHT_WORDS = [
  "notice",
  "detect",
  "realize",
  "realise",
  "think",
  "sense",
  "see",
  "recognize",
  "recognise",
  "understand",
  "discern",
  "know",
  "feel",
  "observe",
]

const ACTION_WORDS = [
  "do",
  "carry",
  "compensate",
  "act",
  "move",
  "build",
  "send",
  "publish",
  "choose",
  "execute",
  "repair",
  "repeat",
  "embody",
  "train",
  "optimize",
  "optimise",
  "create",
  "protect",
  "stabilize",
  "stabilise",
]

export function detectThoughtActionSignals(
  input: string,
): ThoughtActionSignal {
  const normalized = input.toLowerCase()

  const thoughtWords = THOUGHT_WORDS.filter((word) =>
    normalized.includes(word),
  )

  const actionWords = ACTION_WORDS.filter((word) =>
    normalized.includes(word),
  )

  return {
    thoughtWords,
    actionWords,

    thoughtLayer:
      thoughtWords.length > 0
        ? "Natural detection layer: what the participant inherently notices, senses, recognizes, or discerns."
        : null,

    actionLayer:
      actionWords.length > 0
        ? "Automatic compensation layer: what the participant instinctively executes, carries, repairs, or stabilizes."
        : null,
  }
}