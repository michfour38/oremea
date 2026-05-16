import type { CorrectionSignal } from "./types"

const REJECTION_MARKERS = [
  "no",
  "not",
  "i disagree",
  "retry",
  "that's not it",
  "thats not it",
  "not that",
  "stop",
  "stopped reading",
]

const PREFERENCE_MARKERS = [
  "yes",
  "exactly",
  "this",
  "that's it",
  "thats it",
  "better",
  "correct",
  "hits hard",
]

export function detectCorrectionSignals(
  input: string,
): CorrectionSignal {
  const normalized = input.toLowerCase()

  const hasRejection = REJECTION_MARKERS.some((marker) =>
    normalized.includes(marker),
  )

  const hasPreference = PREFERENCE_MARKERS.some((marker) =>
    normalized.includes(marker),
  )

  return {
    rejectedWords: extractRejectedWords(input),
    preferredWords: extractPreferredWords(input),
    hasRejection,
    hasPreference,
  }
}

function extractRejectedWords(input: string): string[] {
  const matches: string[] = []

  const patterns = [
    /not\s+["“]?([^",.!?”]+)["”]?/gi,
    /no[,:\s-]+["“]?([^",.!?”]+)["”]?/gi,
    /i disagree.*?["“]?([^",.!?”]+)["”]?/gi,
    /stopped reading here[:\s-]+["“]?([^",.!?”]+)["”]?/gi,
  ]

  for (const pattern of patterns) {
    const found = [...input.matchAll(pattern)]

    for (const match of found) {
      if (match[1]) {
        matches.push(cleanPhrase(match[1]))
      }
    }
  }

  return unique(matches)
}

function extractPreferredWords(input: string): string[] {
  const matches: string[] = []

  const patterns = [
    /yes[,:\s-]+["“]?([^",.!?”]+)["”]?/gi,
    /exactly[,:\s-]+["“]?([^",.!?”]+)["”]?/gi,
    /replace .*? with ([^,.!?]+)/gi,
    /i mean ([^,.!?]+)/gi,
  ]

  for (const pattern of patterns) {
    const found = [...input.matchAll(pattern)]

    for (const match of found) {
      if (match[1]) {
        matches.push(cleanPhrase(match[1]))
      }
    }
  }

  return unique(matches)
}

function cleanPhrase(value: string): string {
  return value
    .trim()
    .replace(/^["“]+|["”]+$/g, "")
}

function unique(values: string[]): string[] {
  return [...new Set(values.filter(Boolean))]
}