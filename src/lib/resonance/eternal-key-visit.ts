import { randomUUID } from "node:crypto";

import { ETERNAL_OREMEA_KEY } from "@/lib/auth/account-access";
import { prisma } from "@/lib/prisma";
import { lockResonanceAccount } from "./resonance-account-lock";
import { uuidSchema } from "./visit-payment-contract";

/**
 * Opens a Resonance room for an Eternal Oremea Key holder without creating a
 * purchase, visit credit, or redemption row. The key is an entitlement, not
 * commerce. Existing paid credits therefore remain untouched while the key is
 * active and are still there if the key is ever revoked.
 */
export async function redeemEternalKeyVisit(
  userId: string,
  weekNumber: number,
  requestId: string,
) {
  uuidSchema.parse(requestId);
  if (!Number.isInteger(weekNumber) || weekNumber < 1 || weekNumber > 10) {
    throw new Error("Invalid room.");
  }

  return prisma.$transaction(async (tx) => {
    await lockResonanceAccount(tx, userId);

    const purchaseReference = `eternal-key:${requestId}`;
    const existingRun = await tx.resonance_week_runs.findFirst({
      where: {
        user_id: userId,
        purchase_source: "eternal_key",
        purchase_reference: purchaseReference,
      },
      select: { id: true },
    });
    if (existingRun) return existingRun.id;

    const eternalKey = await tx.oremea_entitlements.findUnique({
      where: {
        user_id_product_key: {
          user_id: userId,
          product_key: ETERNAL_OREMEA_KEY,
        },
      },
      select: {
        status: true,
        granted_at: true,
        expires_at: true,
        revoked_at: true,
      },
    });
    if (
      !eternalKey ||
      eternalKey.status !== "active" ||
      eternalKey.revoked_at ||
      eternalKey.expires_at
    ) {
      throw new Error("Eternal Oremea Key access is not active.");
    }

    const room = await tx.resonance_weeks.findUnique({
      where: { week_number: weekNumber },
      select: { is_published: true },
    });
    if (!room?.is_published) throw new Error("This room is not available.");

    const active = await tx.resonance_week_runs.findFirst({
      where: { user_id: userId, status: "active" },
      select: { id: true },
    });
    if (active) {
      throw new Error("Complete the active visit before opening another.");
    }

    const previous = await tx.resonance_week_runs.aggregate({
      where: { user_id: userId, week_number: weekNumber },
      _max: { run_number: true },
    });
    const runId = randomUUID();

    await tx.resonance_week_runs.create({
      data: {
        id: runId,
        user_id: userId,
        week_number: weekNumber,
        run_number: (previous._max.run_number ?? 0) + 1,
        status: "active",
        purchase_source: "eternal_key",
        purchase_reference: purchaseReference,
        purchased_at: eternalKey.granted_at,
        started_at: new Date(),
      },
    });

    return runId;
  });
}
