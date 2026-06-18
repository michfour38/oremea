import type { StoredWitnessAnchor } from "./witness-anchor-store"

export type WitnessAnchorTimelineItem = {
  id: string
  label: string
  type: StoredWitnessAnchor["type"]
  strength: number
  confidence: number
  emergedAt: string
  evidence: string[]
}

export function buildWitnessAnchorTimeline(
  anchors: StoredWitnessAnchor[],
): WitnessAnchorTimelineItem[] {
  return [...anchors]
    .sort(
      (a, b) =>
        new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime(),
    )
    .map((anchor) => ({
      id: anchor.id,
      label: anchor.anchor,
      type: anchor.type,
      strength: anchor.strength,
      confidence: anchor.confidence,
      emergedAt: anchor.createdAt,
      evidence: anchor.evidence,
    }))
}