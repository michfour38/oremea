export type EvidenceType =
  | "reality"
  | "resource"
  | "strength"
  | "possibility"
  | "choice"
  | "objection"
  | "movement"

export type EvidenceSource =
  | "participant"
  | "memory"
  | "completed_action"

export type Evidence = {
  id: string
  type: EvidenceType
  content: string
  confidence: number
  source: EvidenceSource
  timestamp: string
}

export type ObservationType =
  | EvidenceType
  | "contradiction"
  | "activation"

export type Observation = {
  id: string
  type: ObservationType
  confidence: number
  evidenceIds: string[]
  summary: string
}

export type EngineScores = {
  realityDensity: number
  momentum: number
  friction: number
  confidence: number
  agency: number
  leverage: number
  activation: number
  drift: number
}

export type EngineState =
  | "unclear"
  | "choice_forming"
  | "resource_missing"
  | "resource_identified"
  | "possibility_emerging"
  | "objection_present"
  | "movement_ready"
  | "movement_current"

export type Reality = {
  id: string
  description: string
  ownershipScore: number
  realityDistance: number
  coherenceScore: number
  isCurrent: boolean
}

export type Horizon = {
  id: string
  parentRealityId: string
  description: string
  distanceScore: number
  completed: boolean
}

export type Bridge = {
  id: string
  currentRealityId: string
  targetRealityId: string
  horizonIds: string[]
  strengthScore: number
}

export type ELMemory = {
  completedRealities: Reality[]
  completedActions: string[]
  successfulMovementPatterns: string[]
  leverageEvents: string[]
  trajectories: string[]
}

export type EngineTick = {
  id: string
  participantResponse: string
  evidence: Evidence[]
  observations: Observation[]
  scores: EngineScores
  primaryState: EngineState
  selectedQuestion: string
  timestamp: string
}

export type ELInput = {
  participantResponse: string
  previousTicks?: EngineTick[]
  memory?: ELMemory | null
}

export type ELOutput = {
  tick: EngineTick
  reply: string
  shouldContinue: boolean
}