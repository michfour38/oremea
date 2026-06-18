import type { AnchorDefinition } from "./anchor-definition-engine"
import type { StoredWitnessAnchor } from "./witness-anchor-store"

function normalizeStringArray(value: unknown): string[] {
  return Array.isArray(value) ? value.map(String).filter(Boolean) : []
}

function normalizeSource(value: unknown): StoredWitnessAnchor["source"] {
  return value === "pattern" ? "pattern" : "entry"
}

export function normalizeStoredWitnessAnchor(anchor: {
  id: string
  cycle_id: string
  anchor_type: string
  anchor_name: string
  confidence: number
  behavioral_markers: unknown
  evidence: unknown
  strength: number
  source?: unknown
  created_at: Date
}): StoredWitnessAnchor {
  return {
    id: anchor.id,
    sessionId: anchor.cycle_id,
    anchor: anchor.anchor_name,
    type: anchor.anchor_type as AnchorDefinition["type"],
    statement: anchor.anchor_name,
    behavioralMarkers: normalizeStringArray(anchor.behavioral_markers),
    evidence: normalizeStringArray(anchor.evidence),
    confidence: anchor.confidence,
    strength: anchor.strength,
    source: normalizeSource(anchor.source),
    createdAt: anchor.created_at.toISOString(),
  }
}

export function normalizeLiveWitnessAnchor(params: {
  cycleId: string
  anchorDefinition: AnchorDefinition
  strength: number
  source?: StoredWitnessAnchor["source"]
}): StoredWitnessAnchor {
  return {
    id: "live-anchor",
    sessionId: params.cycleId,
    anchor: params.anchorDefinition.anchor,
    type: params.anchorDefinition.type,
    statement: params.anchorDefinition.anchor,
    behavioralMarkers: params.anchorDefinition.behavioralMarkers,
    evidence: params.anchorDefinition.evidence,
    confidence: params.anchorDefinition.confidence,
    strength: params.strength,
    source: params.source ?? "entry",
    createdAt: new Date().toISOString(),
  }
}