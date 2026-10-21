import type { Prisma } from "@prisma/client";
import { randomUUID } from "node:crypto";
import { prisma } from "@/lib/prisma";
import { EMPTY_RECOGNITION_MEMORY, readRecognitionMemory } from "./recognition-conversation";

/** Clear derived memory copies; never erase the participant's archived transcript. */
export async function mutateRecognitionMemoryCopies({ userId, clear, turnIndex, quote }: {
  userId: string; clear: boolean; turnIndex: number | null; quote: string | null;
}) {
  return prisma.$transaction(async (transaction) => {
    // Serialize new-chat copies, memory edits and generation commits in this order.
    await transaction.$executeRaw`SELECT pg_advisory_xact_lock(hashtext(${`recognition-thread-lifecycle:${userId}`}))`;
    await transaction.$executeRaw`SELECT pg_advisory_xact_lock(hashtext(${`recognition-thread:${userId}`}))`;
    const threads = await transaction.recognition_threads.findMany({
      where: { user_id: userId },
      select: { id: true, status: true, memory_snapshot: true },
    });
    let active = EMPTY_RECOGNITION_MEMORY;
    for (const thread of threads) {
      const current = readRecognitionMemory(thread.memory_snapshot);
      // A quote copied to another chat can have a different local turn index.
      const next = clear ? EMPTY_RECOGNITION_MEMORY : {
        version: 1 as const,
        anchors: current.anchors.filter((anchor) =>
          !(typeof quote === "string" && turnIndex !== null && anchor.quote === quote)),
      };
      await transaction.recognition_threads.updateMany({
        where: { id: thread.id, user_id: userId },
        // A revision marks even an empty-to-empty clear, so generation already
        // in flight cannot reintroduce excerpts from its earlier prompt context.
        data: { memory_snapshot: { ...next, _privacyRevision: randomUUID() } as Prisma.InputJsonValue },
      });
      if (thread.status === "active") active = next;
    }
    return active;
  });
}
