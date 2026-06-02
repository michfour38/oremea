import type {
  EngineScores,
  Evidence,
  Observation,
} from "./el-types"

export function calculateScores({
  evidence,
  observations,
  previousScores,
}: {
  evidence: Evidence[]
  observations: Observation[]
  previousScores?: EngineScores | null
}): EngineScores {
  const base = previousScores ?? createEmptyScores()

  const realityDensity = clampScore(
    base.realityDensity * 0.35 +
      scoreRealityDensity(evidence) * 0.65,
  )

  const friction = clampScore(
    base.friction * 0.35 +
      scoreFriction(evidence, observations) * 0.65,
  )

  const activation = clampScore(
    base.activation * 0.35 +
      scoreActivation(observations) * 0.65,
  )

  const agency = clampScore(
    base.agency * 0.35 +
      scoreAgency(evidence) * 0.65,
  )

  const leverage = clampScore(
    base.leverage * 0.35 +
      scoreLeverage(evidence, observations) * 0.65,
  )

  const confidence = clampScore(
    scoreConfidence({
      evidence,
      observations,
      realityDensity,
      friction,
    }),
  )

  const drift = clampScore(
    scoreDrift({
      evidence,
      observations,
      activation,
      friction,
    }),
  )

  const momentum = clampScore(
    activation +
      realityDensity * 0.35 +
      agency * 0.25 -
      friction * 0.4 -
      drift * 0.35,
  )

  return {
    realityDensity,
    momentum,
    friction,
    confidence,
    agency,
    leverage,
    activation,
    drift,
  }
}

export function createEmptyScores(): EngineScores {
  return {
    realityDensity: 0,
    momentum: 0,
    friction: 0,
    confidence: 0,
    agency: 0,
    leverage: 0,
    activation: 0,
    drift: 0,
  }
}

function scoreRealityDensity(
  evidence: Evidence[],
): number {
  const realityCount = evidence.filter(
    (item) => item.type === "reality",
  ).length

  const resourceCount = evidence.filter(
    (item) => item.type === "resource",
  ).length

  const movementCount = evidence.filter(
    (item) => item.type === "movement",
  ).length

  return clampScore(
    realityCount * 18 +
      resourceCount * 8 +
      movementCount * 16,
  )
}

function scoreFriction(
  evidence: Evidence[],
  observations: Observation[],
): number {
  const objectionCount = evidence.filter(
    (item) => item.type === "objection",
  ).length

  const contradictionCount = observations.filter(
    (item) => item.type === "contradiction",
  ).length

  return clampScore(
    objectionCount * 24 +
      contradictionCount * 28,
  )
}

function scoreActivation(
  observations: Observation[],
): number {
  const activation = observations.find(
    (item) => item.type === "activation",
  )

  if (!activation) return 0

  return clampScore(activation.confidence * 100)
}

function scoreAgency(
  evidence: Evidence[],
): number {
  const choiceCount = evidence.filter(
    (item) => item.type === "choice",
  ).length

  const movementCount = evidence.filter(
    (item) => item.type === "movement",
  ).length

  const possibilityCount = evidence.filter(
    (item) => item.type === "possibility",
  ).length

  return clampScore(
    choiceCount * 20 +
      movementCount * 28 +
      possibilityCount * 10,
  )
}

function scoreLeverage(
  evidence: Evidence[],
  observations: Observation[],
): number {
  const resourceCount = evidence.filter(
    (item) => item.type === "resource",
  ).length

  const movementCount = evidence.filter(
    (item) => item.type === "movement",
  ).length

  const contradictionCount = observations.filter(
    (item) => item.type === "contradiction",
  ).length

  return clampScore(
    resourceCount * 12 +
      movementCount * 18 +
      contradictionCount * 20,
  )
}

function scoreConfidence({
  evidence,
  observations,
  realityDensity,
  friction,
}: {
  evidence: Evidence[]
  observations: Observation[]
  realityDensity: number
  friction: number
}): number {
  const evidenceWeight = Math.min(
    evidence.length * 8,
    40,
  )

  const observationWeight = Math.min(
    observations.length * 10,
    30,
  )

  return clampScore(
    evidenceWeight +
      observationWeight +
      realityDensity * 0.35 -
      friction * 0.2,
  )
}

function scoreDrift({
  evidence,
  observations,
  activation,
  friction,
}: {
  evidence: Evidence[]
  observations: Observation[]
  activation: number
  friction: number
}): number {
  if (evidence.length === 0) return 70

  const hasMovement = observations.some(
    (item) => item.type === "movement",
  )

  if (hasMovement) return 0

  return clampScore(
    friction * 0.4 +
      Math.max(0, 40 - activation),
  )
}

function clampScore(value: number): number {
  return Math.max(0, Math.min(100, Math.round(value)))
}