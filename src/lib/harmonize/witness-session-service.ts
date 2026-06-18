import { prisma } from "@/lib/prisma"

import { normalizeStoredWitnessAnchor } from "./witness-anchor-normalize"
import { buildWitnessSessionState } from "./witness-session-state"

export async function getWitnessSessionState(cycleId: string) {
  const anchors = await prisma.harmonize_witness_anchors.findMany({
    where: {
      cycle_id: cycleId,
    },
    orderBy: {
      strength: "desc",
    },
  })

  return buildWitnessSessionState({
    sessionId: cycleId,
    anchors: anchors.map(normalizeStoredWitnessAnchor),
  })
}