import type { CompassScopeCategory } from "../scope-boundary"

export type CompassMapItemKind =
  | "goal"
  | "attention"
  | "dependency"
  | "decision"
  | "waiting"

export type CompassMapItemOwnership =
  | "mine"
  | "shared"
  | "someone_else"
  | "unclear"

export type CompassMapItemStatus =
  | "active"
  | "waiting"
  | "completed"
  | "released"

export type CompassMapItem = {
  id: string
  content: string
  kind: CompassMapItemKind
  ownership: CompassMapItemOwnership
  status: CompassMapItemStatus
  area: string | null
  sourceMessageIndex: number | null
  sourceSnippet: string | null
  createdAt: string
  completedAt: string | null
}

export type CompassMovementStatus =
  | "active"
  | "completed"
  | "blocked"
  | "rejected"
  | "replaced"

export type CompassMovement = {
  id: string
  mapItemId: string | null
  instruction: string
  reason: string | null
  status: CompassMovementStatus
  createdAt: string
  completedAt: string | null
}

export type CompassEndingState = {
  version: 1
  selectedArea: string | null
  mapItems: CompassMapItem[]
  movements: CompassMovement[]
  currentMovementId: string | null
  reframe: string | null
  followUpQuestion: string | null
  scopeCategory: CompassScopeCategory
  discussionCount: number
  updatedAt: string
}

export type CompassMapCandidate = {
  content: string
  kind: CompassMapItemKind
  ownership: CompassMapItemOwnership
  area: string | null
  sourceMessageIndex: number | null
  sourceSnippet: string | null
}

export type CompassEndingEngineResult = {
  scopeCategory: CompassScopeCategory
  mapItems: CompassMapCandidate[]
  reframe: string | null
  movement: {
    instruction: string
    reason: string | null
    mapItemContent: string | null
  } | null
  followUpQuestion: string | null
}

export function createEmptyCompassEndingState(
  selectedArea: string | null = null,
): CompassEndingState {
  return {
    version: 1,
    selectedArea,
    mapItems: [],
    movements: [],
    currentMovementId: null,
    reframe: null,
    followUpQuestion: null,
    scopeCategory: "in_scope",
    discussionCount: 0,
    updatedAt: new Date().toISOString(),
  }
}
