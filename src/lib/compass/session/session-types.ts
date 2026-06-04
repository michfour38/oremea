export type CompassGoalArea =
  | "relationships"
  | "income"
  | "health"
  | "spirituality"
  | "investments"
  | "network"
  | "knowledge"
  | "lifestyle"

export type CompassSessionStage =
  | "area_discovery"
  | "area_confirmation"
  | "recursive_depth"
  | "core_value_reflection"
  | "resistance_mapping"
  | "execution_calibration"
  | "next_step_commitment"
  | "complete"

export type CompassResponseTone =
  | "clear"
  | "uncertain"
  | "emotional"
  | "resistant"
  | "apprehensive"
  | "energized"

export type CompassMirrorStage =
  | "area"
  | "core"

export type CompassAreaResponse = {
  area: CompassGoalArea
  answer: string
  languageWeight: number
  emotionalWeight: number
  valueWords: string[]
  frictionWords: string[]
}

export type CompassRecursiveLayer = {
  layer: number
  question: string
  answer: string
  detectedValueWords: string[]
  detectedReasonWords: string[]
}

export type CompassResistanceMap = {
  obstacle: string
  avoidancePattern: string
  emotionalFriction: string
  supportNeeded: string
}

export type CompassExecutionCheck = {
  proposedStep: string
  participantFeeling: string
  tone: CompassResponseTone
  isStepExecutable: boolean
  recalibratedStep: string | null
}

export type CompassSession = {
  id: string
  stage: CompassSessionStage
  currentQuestion: string
  selectedArea: CompassGoalArea | null
  detectedPrimaryArea: CompassGoalArea | null
  areaResponses: CompassAreaResponse[]
  recursiveLayers: CompassRecursiveLayer[]
  coreValueHypothesis: string | null
  resistanceMap: CompassResistanceMap | null
  executionCheck: CompassExecutionCheck | null
  finalNextStep: string | null
  resonanceCtaEligible: boolean
}

export type CompassContext = {
  selectedArea: CompassGoalArea | null
  areaResponses: CompassAreaResponse[]
  recursiveLayers: CompassRecursiveLayer[]
  coreMirror: string
}