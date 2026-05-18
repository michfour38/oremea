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
  "attachment",
  "lonely",
  "seen",
  "understood",
  "emotionally safe",
  "emotionally unsafe",
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
Some of your goals appear closely connected to relational patterns, emotional safety, communication, connection, attachment, or self-awareness inside relationships.

Sometimes execution difficulties are not only about discipline or motivation.

Sometimes they are connected to:
- how safe a person feels,
- how seen they feel,
- what they fear losing,
- what they learned about love,
- or how they relate to themselves inside connection.

You are welcome to explore this further if it feels relevant to you.
`.trim(),

    ctaLabel: "Explore Resonance",

    ctaHref:
      "https://www.oremea.com/?open=resonance",
  }
}