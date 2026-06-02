import type {
  CompassAreaResponse,
} from "./session-types"

const RELATIONAL_SIGNALS = [
  "relationship",
  "relationships",
  "partner",
  "love",
  "connection",
  "trust",
  "communication",
  "marriage",
  "divorce",
  "dating",
  "family",
  "seen",
  "understood",
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
  const combinedText =
    responses
      .map((response) => response.answer)
      .join(" ")
      .toLowerCase()

  const matches =
    RELATIONAL_SIGNALS.filter((signal) =>
      combinedText.includes(signal),
    )

  if (matches.length < 3) {
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
Some of what you named appears connected to how you choose, build, protect, or navigate connection.

If relationships are part of the reality you are trying to create, Resonance continues this work in a more relational container.

Compass has helped identify movement.

Resonance is where relational patterns, choices, and participation can be explored over time.
`.trim(),

    ctaLabel: "Explore Resonance",

    ctaHref:
      "https://www.oremea.com/?open=resonance",
  }
}