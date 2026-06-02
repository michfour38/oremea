import type {
  EngineScores,
  EngineState,
  Observation,
} from "./el-types"

export function generateResponse({
  state,
  question,
  observations,
  scores,
}: {
  state: EngineState
  question: string
  observations: Observation[]
  scores: EngineScores
}): string {
  if (state === "movement_current") {
    return `
Movement is current.

Reality has changed.

Compass stops here.
`.trim()
  }

  const reflection = buildOptionalReflection({
    observations,
    scores,
  })

  if (!reflection) {
    return question
  }

  return `
${reflection}

${question}
`.trim()
}

function buildOptionalReflection({
  observations,
  scores,
}: {
  observations: Observation[]
  scores: EngineScores
}): string | null {
  if (scores.confidence < 55) {
    return null
  }

  const contradiction = observations.find(
    (item) => item.type === "contradiction",
  )

  if (contradiction && scores.friction > 45) {
    return "These two parts are not fully connected yet."
  }

  const movement = observations.find(
    (item) => item.type === "movement",
  )

  if (movement) {
    return "A real movement is now visible."
  }

  const resource = observations.find(
    (item) => item.type === "resource",
  )

  if (resource && scores.leverage > 45) {
    return "There may be leverage around this resource."
  }

  return null
}