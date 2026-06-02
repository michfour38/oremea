import type {
  EngineScores,
  EngineState,
  Evidence,
  Observation,
} from "./el-types"

export function selectQuestion({
  state,
  evidence,
  observations,
  scores,
}: {
  state: EngineState
  evidence: Evidence[]
  observations: Observation[]
  scores: EngineScores
}): string {
  if (state === "movement_current") {
    return ""
  }

  if (state === "objection_present") {
    return selectObjectionQuestion(evidence)
  }

  if (state === "resource_missing") {
    return "What resource would make this easier to move?"
  }

  if (state === "resource_identified") {
    return "What would this resource make possible first?"
  }

  if (state === "possibility_emerging") {
    return "Which possibility feels most worth choosing first?"
  }

  if (state === "choice_forming") {
    return "What would you like to become true?"
  }

  if (state === "movement_ready") {
    return "What is the next completed action?"
  }

  if (scores.drift > 55) {
    return "What matters most right now?"
  }

  if (
    observations.some(
      (item) => item.type === "contradiction",
    )
  ) {
    return "What would need to connect these two realities?"
  }

  return "What would you like to become true?"
}

function selectObjectionQuestion(
  evidence: Evidence[],
): string {
  const objection = evidence.find(
    (item) => item.type === "objection",
  )

  if (!objection) {
    return "What still feels unresolved?"
  }

  if (
    objection.content.includes("don't know") ||
    objection.content.includes("dont know") ||
    objection.content.includes("unsure") ||
    objection.content.includes("not sure")
  ) {
    return "What do you know right now?"
  }

  if (
    objection.content.includes("can't") ||
    objection.content.includes("cannot") ||
    objection.content.includes("impossible")
  ) {
    return "What part of this is genuinely impossible, and what part is only not yet resourced?"
  }

  return "What still feels unresolved?"
}