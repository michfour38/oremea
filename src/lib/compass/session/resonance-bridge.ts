import type {
  CompassAreaResponse,
} from "./session-types"

const CONTRADICTION_SIGNALS = [
  "but",
  "however",
  "even though",
  "i know",
  "i should",
  "i want",
  "i need",
  "i can't",
  "i cannot",
  "i don't",
  "i keep",
  "again",
  "always",
  "never",
  "stuck",
  "repeat",
  "same",
  "avoid",
  "give up",
  "walk away",
]

const SELF_PATTERN_SIGNALS = [
  "i don't know who i am",
  "i don't know what i want",
  "i don't know what matters",
  "i say",
  "i do",
  "i choose",
  "i abandon",
  "i disappear",
  "i sabotage",
  "i shut down",
  "i avoid",
]

export type ResonanceBridgeResult = {
  eligible: boolean
  reflection: string | null
  ctaLabel: string | null
  ctaHref: string | null
}

export function evaluateResonanceBridge(
  responses: CompassAreaResponse[],
): ResonanceBridgeResult {
  const combinedText = responses
    .map((response) => response.answer)
    .join(" ")
    .toLowerCase()

  const contradictionMatches = CONTRADICTION_SIGNALS.filter((signal) =>
    combinedText.includes(signal),
  )

  const selfPatternMatches = SELF_PATTERN_SIGNALS.filter((signal) =>
    combinedText.includes(signal),
  )

  const eligible =
    contradictionMatches.length >= 4 ||
    selfPatternMatches.length >= 2

  if (!eligible) {
    return {
      eligible: false,
      reflection: null,
      ctaLabel: null,
      ctaHref: null,
    }
  }

  return {
    eligible: true,

    reflection: `
Compass identified direction.

What also appears present is a repeated pattern between what is wanted, what is chosen, what is avoided, and what keeps happening.

That is Resonance territory.

Resonance is not the next step because relationships were mentioned.

It becomes relevant when the pattern itself needs to be explored over time.
`.trim(),

    ctaLabel: "Explore Resonance",

    ctaHref: "https://www.oremea.com/?open=resonance",
  }
}