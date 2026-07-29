import type { CompassAreaResponse } from "./session-types"

export type CompassAreaELObservation = {
  dependencyCluster: string | null
  leverageArea: string | null
  bridgeQuestion: string
  reflection: string
}

export function buildAreaELObservation(
  responses: CompassAreaResponse[],
): CompassAreaELObservation {
  const strongestQuotes = getUniqueAreaQuotes(responses)

  return {
    dependencyCluster: null,
    leverageArea: null,
    bridgeQuestion: "Where do you want to begin?",
    reflection: `
${strongestQuotes}

These are separate things you have named as important. Some may connect as you continue; others may simply matter alongside one another.
`.trim(),
  }
}

function getUniqueAreaQuotes(
  responses: CompassAreaResponse[],
): string {
  const seen = new Set<string>()

  return responses
    .slice()
    .sort(
      (a, b) =>
        b.languageWeight +
        b.emotionalWeight -
        (a.languageWeight + a.emotionalWeight),
    )
    .filter((response) => {
      if (seen.has(response.area)) return false
      seen.add(response.area)
      return true
    })
    .slice(0, 3)
    .map(
      (response) =>
        `In ${formatArea(response.area)}, you wrote: “${cleanReference(
          response.answer,
        )}”`,
    )
    .join("\n\n")
}

function formatArea(area: string): string {
  return area.charAt(0).toUpperCase() + area.slice(1)
}

function cleanReference(input: string): string {
  const trimmed = input.trim().replace(/\s+/g, " ")

  if (trimmed.length <= 180) {
    return trimmed
  }

  return `${trimmed.slice(0, 180)}...`
}
