import type { StoredWitnessAnchor } from "./witness-anchor-store"

export type WitnessEmergenceSummary = {
  beganAround: string | null
  movingToward: string | null
  beneathThat: string | null
  summary: string
}

function strongest(anchors: StoredWitnessAnchor[]) {
  return anchors.length > 0
    ? [...anchors].sort((a, b) => b.strength - a.strength)[0]
    : null
}

function first(anchors: StoredWitnessAnchor[]) {
  return anchors.length > 0
    ? [...anchors].sort(
        (a, b) =>
          new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime(),
      )[0]
    : null
}

function findByType(anchors: StoredWitnessAnchor[], type: string) {
  return anchors.find((anchor) => anchor.type === type) || null
}

export function buildWitnessEmergenceSummary(
  anchors: StoredWitnessAnchor[],
): WitnessEmergenceSummary {
  const firstAnchor = first(anchors)
  const strongestAnchor = strongest(anchors)

  const needAnchor = findByType(anchors, "need")
  const fearAnchor = findByType(anchors, "fear")
  const meaningAnchor = findByType(anchors, "meaning")

  const beneathThat =
    needAnchor?.anchor ||
    fearAnchor?.anchor ||
    meaningAnchor?.anchor ||
    null

  if (!firstAnchor || !strongestAnchor) {
    return {
      beganAround: null,
      movingToward: null,
      beneathThat: null,
      summary:
        "Nothing has stabilized yet. The witness is still listening for the strongest signal.",
    }
  }

  return {
    beganAround: firstAnchor.anchor,
    movingToward: strongestAnchor.anchor,
    beneathThat,
    summary: beneathThat
      ? `The witness trail began around ${firstAnchor.anchor}. It appears to be moving toward ${strongestAnchor.anchor}. Beneath that, ${beneathThat} may be carrying part of the load.`
      : `The witness trail began around ${firstAnchor.anchor}. It appears to be moving toward ${strongestAnchor.anchor}.`,
  }
}