import {
  buildWitnessAnchorRelationships,
  type WitnessAnchorRelationship,
} from "./witness-anchor-relationships"
import {
  followWitnessSignal,
  type WitnessSignalDirection,
} from "./witness-follow-signal"
import type { StoredWitnessAnchor } from "./witness-anchor-store"

export type WitnessSessionState = {
  sessionId: string
  anchors: StoredWitnessAnchor[]
  relationships: WitnessAnchorRelationship[]
  strongestAnchor: StoredWitnessAnchor | null
  signalDirection: WitnessSignalDirection
  readyForSharedSpace: boolean
}

export function buildWitnessSessionState(params: {
  sessionId: string
  anchors: StoredWitnessAnchor[]
}): WitnessSessionState {
  const { sessionId, anchors } = params

  const strongestAnchor =
    anchors.length > 0
      ? [...anchors].sort((a, b) => b.strength - a.strength)[0]
      : null

  const signalDirection = followWitnessSignal(anchors)

  return {
    sessionId,
    anchors,
    relationships: buildWitnessAnchorRelationships(anchors),
    strongestAnchor,
    signalDirection,
    readyForSharedSpace:
      Boolean(signalDirection.anchor) &&
      signalDirection.anchor!.confidence >= 0.75 &&
      anchors.length >= 3,
  }
}