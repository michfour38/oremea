import { prisma } from "@/lib/prisma";

import { buildStoredWitnessAnchor } from "./witness-anchor-store";
import { getStrongestWitnessSignal } from "./witness-signal-engine";

type WitnessEntryInput = {
  cycleId: string;
  entryId: string;
  content: string;
};

export async function createWitnessAnchorFromEntry(input: WitnessEntryInput) {
  const signal = getStrongestWitnessSignal([
    {
      content: input.content,
    },
  ]);

  if (!signal) return null;

  const storedAnchor = buildStoredWitnessAnchor({
    sessionId: input.cycleId,
    signal,
  });

  return prisma.harmonize_witness_anchors.create({
    data: {
      cycle_id: input.cycleId,
      entry_id: input.entryId,
      anchor_type: storedAnchor.type,
      anchor_name: storedAnchor.anchor,
      confidence: storedAnchor.confidence,
      behavioral_markers: storedAnchor.behavioralMarkers,
      evidence: storedAnchor.evidence,
      strength: storedAnchor.strength,
      source: storedAnchor.source,
    },
  });
}