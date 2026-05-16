import type { CompassSignal } from "./language-signals"

export type ParticipantLanguageProfile = {
  preferredLanguage: string[]
  rejectedLanguage: string[]
  dominantThoughtPatterns: string[]
  dominantActionPatterns: string[]
  resonanceSensitivity: number
  profileSummary: string
}

export function buildParticipantLanguageProfile(
  signals: CompassSignal[],
): ParticipantLanguageProfile {
  const preferredLanguage = unique(
    signals.flatMap((signal) => signal.preferredWords),
  )

  const rejectedLanguage = unique(
    signals.flatMap((signal) => signal.rejectedWords),
  )

  const dominantThoughtPatterns = unique(
    signals
      .filter((signal) => signal.kind === "thought_detection")
      .flatMap((signal) => signal.preferredWords),
  )

  const dominantActionPatterns = unique(
    signals
      .filter(
        (signal) => signal.kind === "action_compensation",
      )
      .flatMap((signal) => signal.preferredWords),
  )

  const resonanceSensitivity =
    calculateResonanceSensitivity(signals)

  return {
    preferredLanguage,
    rejectedLanguage,
    dominantThoughtPatterns,
    dominantActionPatterns,
    resonanceSensitivity,

    profileSummary: buildSummary({
      preferredLanguage,
      rejectedLanguage,
      dominantThoughtPatterns,
      dominantActionPatterns,
      resonanceSensitivity,
    }),
  }
}

function calculateResonanceSensitivity(
  signals: CompassSignal[],
): number {
  const resonanceBreaks = signals.filter(
    (signal) => signal.kind === "resonance_break",
  ).length

  const rejections = signals.filter(
    (signal) => signal.kind === "word_rejection",
  ).length

  const preferences = signals.filter(
    (signal) => signal.kind === "word_preference",
  ).length

  return resonanceBreaks * 3 + rejections * 2 + preferences
}

function buildSummary({
  preferredLanguage,
  rejectedLanguage,
  dominantThoughtPatterns,
  dominantActionPatterns,
  resonanceSensitivity,
}: {
  preferredLanguage: string[]
  rejectedLanguage: string[]
  dominantThoughtPatterns: string[]
  dominantActionPatterns: string[]
  resonanceSensitivity: number
}): string {
  return `
Preferred language: ${
    preferredLanguage.join(", ") || "none detected"
  }.

Rejected language: ${
    rejectedLanguage.join(", ") || "none detected"
  }.

Dominant thought patterns: ${
    dominantThoughtPatterns.join(", ") || "none detected"
  }.

Dominant action patterns: ${
    dominantActionPatterns.join(", ") || "none detected"
  }.

Resonance sensitivity score: ${resonanceSensitivity}.
`.trim()
}

function unique(values: string[]): string[] {
  return [...new Set(values.filter(Boolean))]
}