import type { ParticipantLanguageProfile } from "./participant-language-profile"

export type ResonanceInclination = {
  shouldOfferResonance: boolean
  score: number
  reasons: string[]
  ctaCopy: string | null
}

const RESONANCE_LANGUAGE = [
  "relationship",
  "relationships",
  "partner",
  "ex",
  "marriage",
  "divorce",
  "connection",
  "intimacy",
  "trust",
  "seen",
  "love",
  "attachment",
  "relational",
  "greg",
  "gregory",
]

export function detectResonanceInclination(
  profile: ParticipantLanguageProfile,
): ResonanceInclination {
  const language = [
    ...profile.preferredLanguage,
    ...profile.dominantThoughtPatterns,
    ...profile.dominantActionPatterns,
  ].map((word) => word.toLowerCase())

  const matched = RESONANCE_LANGUAGE.filter((word) =>
    language.some((item) => item.includes(word)),
  )

  const score =
    matched.length +
    Math.floor(profile.resonanceSensitivity / 3)

  return {
    shouldOfferResonance: score >= 3,
    score,
    reasons: matched,
    ctaCopy:
      score >= 3
        ? "Your language is beginning to point toward relational patterns. Resonance may help you understand how your identity expresses itself inside connection."
        : null,
  }
}