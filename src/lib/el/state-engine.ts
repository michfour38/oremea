import type {
  EngineScores,
  EngineState,
  Evidence,
  Observation,
} from "./el-types"

export function determineState({
  evidence,
  observations,
  scores,
}: {
  evidence: Evidence[]
  observations: Observation[]
  scores: EngineScores
}): EngineState {
  const hasMovementEvidence = evidence.some(
    (item) => item.type === "movement",
  )

  if (
    hasMovementEvidence &&
    scores.momentum > scores.friction
  ) {
    return "movement_current"
  }

  if (
    scores.momentum > scores.friction &&
    hasEvidenceType(evidence, "choice")
  ) {
    return "movement_ready"
  }

  if (
    observations.some(
      (item) => item.type === "contradiction",
    ) ||
    hasEvidenceType(evidence, "objection") ||
    scores.friction > scores.momentum
  ) {
    return "objection_present"
  }

  if (
    hasEvidenceType(evidence, "resource") &&
    scores.realityDensity < 45
  ) {
    return "resource_missing"
  }

  if (
    hasEvidenceType(evidence, "resource") &&
    scores.realityDensity >= 45
  ) {
    return "resource_identified"
  }

  if (hasEvidenceType(evidence, "possibility")) {
    return "possibility_emerging"
  }

  if (
    hasEvidenceType(evidence, "choice") ||
    scores.realityDensity >= 35
  ) {
    return "choice_forming"
  }

  return "unclear"
}

function hasEvidenceType(
  evidence: Evidence[],
  type: Evidence["type"],
): boolean {
  return evidence.some((item) => item.type === type)
}