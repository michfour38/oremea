import type { AnchorDefinition } from "./anchor-definition-engine"
import {
  getPriorityAnchor,
  type AnchorPriorityReason,
} from "./witness-anchor-priority"
import type { StoredWitnessAnchor } from "./witness-anchor-store"

export type WitnessSignalDirection = {
  anchor: StoredWitnessAnchor | null
  reason: AnchorPriorityReason | "no_anchor"
  nextQuestion: string
}

function questionForPriorityAnchor(anchor: StoredWitnessAnchor): string {
  if (anchor.type === "expectation") {
    return `When you say ${anchor.anchor}, what would the other person have done differently in behavior?`
  }

  if (anchor.type === "need") {
    return `If ${anchor.anchor} had been met here, what would someone have done or noticed?`
  }

  if (anchor.type === "fear") {
    return `If ${anchor.anchor} is the fear underneath this, what are you afraid would happen next?`
  }

  if (anchor.type === "repair") {
    return `What would make ${anchor.anchor} feel real in behavior, not just words?`
  }

  if (anchor.type === "pattern") {
    return `Where does ${anchor.anchor} repeat in what actually happens?`
  }

  if (anchor.type === "behavior") {
    return `What does ${anchor.anchor} seem to protect, avoid, or reveal?`
  }

  return `What feels most important about ${anchor.anchor}?`
}

export function followWitnessSignal(
  anchors: StoredWitnessAnchor[],
): WitnessSignalDirection {
  const priority = getPriorityAnchor(anchors)

  if (!priority) {
    return {
      anchor: null,
      reason: "no_anchor",
      nextQuestion: "Tell me what happened.",
    }
  }

  return {
    anchor: priority.anchor,
    reason: priority.reason,
    nextQuestion: questionForPriorityAnchor(priority.anchor),
  }
}

export function followLiveAnchor(
  anchor: AnchorDefinition | null,
): string {
  if (!anchor) {
    return "Tell me what happened."
  }

  return anchor.behavioralQuestion
}