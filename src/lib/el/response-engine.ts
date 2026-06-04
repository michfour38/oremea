import type {
  EngineScores,
  EngineState,
  Evidence,
  Observation,
} from "./el-types"

export function generateResponse({
  participantResponse,
  state,
  question,
  evidence,
  observations,
  scores,
}: {
  participantResponse: string
  state: EngineState
  question: string
  evidence: Evidence[]
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
  participantResponse,
  evidence,
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
  participantResponse,
  evidence,
  observations,
  scores,
}: {
  participantResponse: string
  evidence: Evidence[]
  observations: Observation[]
  scores: EngineScores
}): string | null {
  void evidence

  if (scores.confidence < 55) {
    return null
  }

  const answer = participantResponse.trim()

  if (answer.length > 180) {
  const compressed = compressAnswer(answer)

  return `
${compressed}

What breaks first when this tries to move?
`.trim()
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

function compressAnswer(answer: string): string {
  const cleaned = answer.trim().replace(/\s+/g, " ")

  const sentences = cleaned
    .split(/(?<=[.!?])\s+/)
    .map((sentence) => sentence.trim())
    .filter(Boolean)

  const strongest = sentences.slice(0, 3)

  if (strongest.length === 0) {
    return "There is a real interruption here."
  }

  return strongest.join("\n\n")
}