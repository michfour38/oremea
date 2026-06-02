import {
  detectDependencyClusters,
  formatAreaList,
} from "./dependency-cluster-engine"

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
  const clusters = detectDependencyClusters(responses)
  const strongestCluster = clusters[0] ?? null

  const leverageArea =
    strongestCluster?.supportingAreas[0] ?? responses[0]?.area ?? null

  const dependencyCluster = strongestCluster?.label ?? null

  const reflection = buildReflection({
    responses,
    strongestCluster,
  })

  const bridgeQuestion = dependencyCluster
    ? `Which area would create the strongest bridge between your current reality and the reality ${dependencyCluster} is helping you build?`
    : "Which area would create the strongest bridge between your current reality and the reality you want to create?"

  return {
    dependencyCluster,
    leverageArea,
    bridgeQuestion,
    reflection,
  }
}

function buildReflection({
  responses,
  strongestCluster,
}: {
  responses: CompassAreaResponse[]
  strongestCluster: ReturnType<typeof detectDependencyClusters>[number] | null
}): string {
  const strongestQuotes = getUniqueAreaQuotes(responses)

  if (!strongestCluster) {
    return `
Compass is not choosing for you.

${strongestQuotes}

The clearest bridge is not fully visible yet.

Which area would create the most movement if it became stronger first?
`.trim()
  }

  return `
Compass is not choosing for you.

${strongestQuotes}

These answers do not appear to be separate goals.

Several of them appear connected through ${strongestCluster.label}.

This shows up across ${formatAreaList(strongestCluster.supportingAreas)}.

That does not mean ${strongestCluster.label} is the only thing that matters.

It means ${strongestCluster.label} may be carrying leverage because movement there could create movement elsewhere.

The next question is not which area sounds deepest.

The next question is which area creates the strongest bridge between your current reality and the reality you want to create.
`.trim()
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