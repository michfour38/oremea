import type { StoredWitnessAnchor } from "./witness-anchor-store";

export type AnchorRelationshipType =
  | "supports"
  | "reveals"
  | "depends_on"
  | "contradicts"
  | "intensifies"
  | "softens";

export type WitnessAnchorRelationship = {
  sourceAnchorId: string;
  targetAnchorId: string;
  relationship: AnchorRelationshipType;
  reason: string;
};

export function buildWitnessAnchorRelationships(
  anchors: StoredWitnessAnchor[],
): WitnessAnchorRelationship[] {
  const relationships: WitnessAnchorRelationship[] = [];

  for (const source of anchors) {
    for (const target of anchors) {
      if (source.id === target.id) continue;

      if (source.type === "behavior" && target.type === "meaning") {
        relationships.push({
          sourceAnchorId: source.id,
          targetAnchorId: target.id,
          relationship: "reveals",
          reason: "Behavior often reveals the meaning the person could not name directly.",
        });
      }

      if (source.type === "expectation" && target.type === "need") {
        relationships.push({
          sourceAnchorId: source.id,
          targetAnchorId: target.id,
          relationship: "reveals",
          reason: "Expectations often reveal the need underneath them.",
        });
      }

      if (source.type === "fear" && target.type === "repair") {
        relationships.push({
          sourceAnchorId: source.id,
          targetAnchorId: target.id,
          relationship: "depends_on",
          reason: "Repair must understand the fear it is trying not to repeat.",
        });
      }

      if (source.anchor === target.anchor && source.id !== target.id) {
        relationships.push({
          sourceAnchorId: source.id,
          targetAnchorId: target.id,
          relationship: "supports",
          reason: "The same anchor appeared more than once in the witness trail.",
        });
      }
    }
  }

  return relationships;
}