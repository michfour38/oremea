import type { StoredWitnessAnchor } from "./witness-anchor-store"
import type { WitnessSessionState } from "./witness-session-state"

export type WitnessMeaningPanelAnchor = {
  id: string
  label: string
  type: string
  strength: number
  confidence: number
  evidence: string[]
  behavioralMarkers: string[]
  source: StoredWitnessAnchor["source"]
}

export type WitnessMeaningPanelModel = {
  strongestAnchor: WitnessMeaningPanelAnchor | null
  activeAnchor: WitnessMeaningPanelAnchor | null
  nextQuestion: string
  readyForSharedSpace: boolean
  anchors: WitnessMeaningPanelAnchor[]
}

function toPanelAnchor(
  anchor: WitnessSessionState["anchors"][number],
): WitnessMeaningPanelAnchor {
  return {
    id: anchor.id,
    label: anchor.anchor,
    type: anchor.type,
    strength: anchor.strength,
    confidence: anchor.confidence,
    evidence: anchor.evidence,
    behavioralMarkers: anchor.behavioralMarkers,
    source: anchor.source,
  }
}

export function buildWitnessMeaningPanelModel(
  state: WitnessSessionState,
): WitnessMeaningPanelModel {
  const activeAnchor = state.signalDirection.anchor
    ? toPanelAnchor(state.signalDirection.anchor)
    : null

  return {
    strongestAnchor: state.strongestAnchor
      ? toPanelAnchor(state.strongestAnchor)
      : null,

    activeAnchor,

    nextQuestion: state.signalDirection.nextQuestion,

    readyForSharedSpace: state.readyForSharedSpace,

    anchors: state.anchors.map(toPanelAnchor),
  }
}