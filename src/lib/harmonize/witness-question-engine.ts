import type { AnchorDefinition } from "./anchor-definition-engine"

export function buildWitnessQuestion(anchor: AnchorDefinition): string {
  if (anchor.behavioralQuestion) {
    return anchor.behavioralQuestion
  }

  if (anchor.type === "expectation") {
    return "What would the other person have done if this expectation had been met?"
  }

  if (anchor.type === "fear") {
    return "What would have happened in the room if this fear had come true?"
  }

  if (anchor.type === "need") {
    return "What would someone have done that would have made this need visible?"
  }

  if (anchor.type === "repair") {
    return "What would repair have looked like in behavior, not intention?"
  }

  if (anchor.type === "pattern") {
    return "Where else have you seen this same pattern happen in behavior?"
  }

  if (anchor.type === "behavior") {
    return "What did that behavior seem to protect, avoid, or reveal?"
  }

  return "What would have happened differently if this moment had gone the way your body expected it to?"
}