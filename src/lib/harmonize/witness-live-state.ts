import type { AnchorDefinition } from "./anchor-definition-engine"
import { normalizeLiveWitnessAnchor } from "./witness-anchor-normalize"
import type { WitnessSignal } from "./witness-signal-engine"
import type { WitnessSessionState } from "./witness-session-state"

export function buildLiveWitnessSessionState(params: {
  cycleId: string
  anchorDefinition: AnchorDefinition | null
  strongestSignal: WitnessSignal | null
  nextQuestion: string
  readyForSharedSpace: boolean
}): WitnessSessionState {
  const liveAnchor =
    params.anchorDefinition && params.strongestSignal
      ? normalizeLiveWitnessAnchor({
          cycleId: params.cycleId,
          anchorDefinition: params.anchorDefinition,
          strength: params.strongestSignal.strength,
          source: params.strongestSignal.source,
        })
      : null

  return {
    sessionId: params.cycleId,
    anchors: liveAnchor ? [liveAnchor] : [],
    relationships: [],
    strongestAnchor: liveAnchor,
    signalDirection: {
      anchor: liveAnchor,
      reason: liveAnchor ? "highest_strength" : "no_anchor",
      nextQuestion: params.nextQuestion,
    },
    readyForSharedSpace: params.readyForSharedSpace,
  }
}