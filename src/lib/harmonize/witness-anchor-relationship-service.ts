import { prisma } from "@/lib/prisma"

import { buildWitnessAnchorRelationships } from "./witness-anchor-relationships"
import { normalizeStoredWitnessAnchor } from "./witness-anchor-normalize"

export async function rebuildWitnessAnchorRelationships(cycleId: string) {
  const anchors = await prisma.harmonize_witness_anchors.findMany({
    where: {
      cycle_id: cycleId,
    },
    orderBy: {
      created_at: "asc",
    },
  })

  await prisma.harmonize_anchor_relationships.deleteMany({
    where: {
      source_anchor: {
        cycle_id: cycleId,
      },
    },
  })

  const relationships = buildWitnessAnchorRelationships(
    anchors.map(normalizeStoredWitnessAnchor),
  )

  if (relationships.length === 0) return []

  await prisma.harmonize_anchor_relationships.createMany({
    data: relationships.map((relationship) => ({
      source_anchor_id: relationship.sourceAnchorId,
      target_anchor_id: relationship.targetAnchorId,
      relationship_type: relationship.relationship,
      reason: relationship.reason,
    })),
  })

  return relationships
}