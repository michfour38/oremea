import type { StoredWitnessAnchor } from "./witness-anchor-store"

export type AnchorPriorityReason =
  | "highest_strength"
  | "highest_confidence"
  | "unresolved_expectation"
  | "unresolved_need"
  | "unresolved_fear"
  | "repair_candidate"

export type PrioritizedAnchor = {
  anchor: StoredWitnessAnchor
  reason: AnchorPriorityReason
  score: number
}

function scoreAnchor(anchor: StoredWitnessAnchor) {
  let score = anchor.strength * 100

  if (anchor.type === "expectation") score += 12
  if (anchor.type === "need") score += 10
  if (anchor.type === "fear") score += 8
  if (anchor.type === "repair") score += 6

  score += anchor.confidence * 20

  return score
}

function determineReason(
  anchor: StoredWitnessAnchor,
): AnchorPriorityReason {
  if (anchor.type === "expectation") {
    return "unresolved_expectation"
  }

  if (anchor.type === "need") {
    return "unresolved_need"
  }

  if (anchor.type === "fear") {
    return "unresolved_fear"
  }

  if (anchor.type === "repair") {
    return "repair_candidate"
  }

  if (anchor.confidence >= 0.85) {
    return "highest_confidence"
  }

  return "highest_strength"
}

export function prioritizeWitnessAnchors(
  anchors: StoredWitnessAnchor[],
): PrioritizedAnchor[] {
  return anchors
    .map((anchor) => ({
      anchor,
      reason: determineReason(anchor),
      score: scoreAnchor(anchor),
    }))
    .sort((a, b) => b.score - a.score)
}

export function getPriorityAnchor(
  anchors: StoredWitnessAnchor[],
): PrioritizedAnchor | null {
  const prioritized = prioritizeWitnessAnchors(anchors)

  return prioritized[0] ?? null
}