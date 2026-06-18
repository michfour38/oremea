import type { AnchorDefinition } from "./anchor-definition-engine"
import type { StoredWitnessAnchor } from "./witness-anchor-store"

type AnchorLike =
  | StoredWitnessAnchor
  | {
      anchor: AnchorDefinition["anchor"]
      type: AnchorDefinition["type"]
    }

export function describeAnchorType(type: AnchorDefinition["type"]) {
  if (type === "expectation") {
    return "an expectation that may be carrying emotional weight"
  }

  if (type === "need") {
    return "a need that may not have had enough room yet"
  }

  if (type === "fear") {
    return "a fear that may be shaping the reaction"
  }

  if (type === "repair") {
    return "a repair condition that may need to be honored"
  }

  if (type === "pattern") {
    return "a repeating pattern the witness is noticing"
  }

  if (type === "behavior") {
    return "a behavior that may reveal more than the words alone"
  }

  return "a meaning anchor that is still forming"
}

export function buildAnchorEmergenceSentence(anchor: AnchorLike) {
  return `${anchor.anchor} appears to be ${describeAnchorType(anchor.type)}.`
}

export function buildAnchorFollowSentence(anchor: AnchorLike) {
  if (anchor.type === "expectation") {
    return "The witness is following this because expectations often reveal what someone hoped would happen in behavior."
  }

  if (anchor.type === "need") {
    return "The witness is following this because unmet needs often become clearer through what someone wished would have been noticed."
  }

  if (anchor.type === "fear") {
    return "The witness is following this because fear can quietly organize the whole interaction."
  }

  if (anchor.type === "repair") {
    return "The witness is following this because repair cannot become real until its conditions are named."
  }

  if (anchor.type === "pattern") {
    return "The witness is following this because repeated behavior often carries the clearest signal."
  }

  if (anchor.type === "behavior") {
    return "The witness is following this because behavior usually reveals meaning before language does."
  }

  return "The witness is following this because it appears to carry the strongest meaning right now."
}