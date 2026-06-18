import type { AnchorDefinition } from "./anchor-definition-engine"
import type { WitnessSignal } from "./witness-signal-engine"

export type StoredWitnessAnchor = {
  id: string
  sessionId: string
  anchor: string
  type: AnchorDefinition["type"]
  statement: string
  behavioralMarkers: string[]
  evidence: string[]
  confidence: number
  strength: number
  source: "entry" | "pattern"
  createdAt: string
}

function createId() {
  return `anchor_${crypto.randomUUID()}`
}

export function buildStoredWitnessAnchor(params: {
  sessionId: string
  signal: WitnessSignal
}): StoredWitnessAnchor {
  const { sessionId, signal } = params
  const definition = signal.anchorDefinition

  return {
    id: createId(),
    sessionId,
    anchor: definition.anchor,
    type: definition.type,
    statement: definition.anchor,
    behavioralMarkers: definition.behavioralMarkers,
    evidence: definition.evidence,
    confidence: definition.confidence,
    strength: signal.strength,
    source: signal.source,
    createdAt: new Date().toISOString(),
  }
}