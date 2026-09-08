import { randomUUID } from "node:crypto";

import { prisma } from "@/lib/prisma";
import { isCompassOwner } from "@/src/lib/compass/compass-access";
import {
  getOremeaOwnerResetUserIds,
  hasOremeaOwnerAccess,
} from "@/src/lib/oremea/owner-recovery";
import { isRecognitionOwner } from "@/src/lib/recognition/recognition-conversation-access";

export const PRODUCT_TEST_TARGETS = [
  {
    key: "recognition",
    label: "Recognition",
    href: "https://recognition.oremea.com/begin",
    kind: "recognition",
  },
  {
    key: "compass",
    label: "Compass",
    href: "https://compass.oremea.com/begin",
    kind: "compass",
  },
  {
    key: "resonance-hearth",
    label: "Resonance · The Hearth",
    href: "https://resonance.oremea.com/resonance",
    kind: "resonance",
    weekNumber: 1,
  },
  {
    key: "resonance-mirror",
    label: "Resonance · Mirror",
    href: "https://resonance.oremea.com/resonance",
    kind: "resonance",
    weekNumber: 2,
  },
  {
    key: "resonance-garden",
    label: "Resonance · Garden",
    href: "https://resonance.oremea.com/resonance",
    kind: "resonance",
    weekNumber: 3,
  },
  {
    key: "resonance-bearing",
    label: "Resonance · Bearing",
    href: "https://resonance.oremea.com/resonance",
    kind: "resonance",
    weekNumber: 4,
  },
  {
    key: "resonance-pulse",
    label: "Resonance · Pulse",
    href: "https://resonance.oremea.com/resonance",
    kind: "resonance",
    weekNumber: 5,
  },
  {
    key: "resonance-shadow",
    label: "Resonance · Shadow",
    href: "https://resonance.oremea.com/resonance",
    kind: "resonance",
    weekNumber: 6,
  },
  {
    key: "resonance-forge",
    label: "Resonance · Forge",
    href: "https://resonance.oremea.com/resonance",
    kind: "resonance",
    weekNumber: 7,
  },
  {
    key: "resonance-vision",
    label: "Resonance · Vision",
    href: "https://resonance.oremea.com/resonance",
    kind: "resonance",
    weekNumber: 8,
  },
  {
    key: "resonance-gathering",
    label: "Resonance · Gathering",
    href: "https://resonance.oremea.com/resonance",
    kind: "resonance",
    weekNumber: 9,
  },
  {
    key: "resonance-becoming",
    label: "Resonance · Becoming",
    href: "https://resonance.oremea.com/resonance",
    kind: "resonance",
    weekNumber: 10,
  },
  {
    key: "the-current",
    label: "The Current · Oremea",
    href: "https://www.oremea.com/current",
    kind: "current",
  },
] as const;

export type ProductTestTarget = (typeof PRODUCT_TEST_TARGETS)[number];
export type ProductTestResetKey = ProductTestTarget["key"];

export function isProductTestOwner(userId: string) {
  return isRecognitionOwner(userId) || isCompassOwner(userId);
}

export async function hasProductTestOwnerAccess(userId: string) {
  return isProductTestOwner(userId) || (await hasOremeaOwnerAccess(userId));
}

export function getProductTestTarget(value: unknown): ProductTestTarget | null {
  if (typeof value !== "string") return null;
  return PRODUCT_TEST_TARGETS.find((target) => target.key === value) ?? null;
}

async function resetRecognition(userIds: string[]) {
  const deleted = await prisma.recognition_threads.deleteMany({
    where: { user_id: { in: userIds } },
  });

  return { deletedThreads: deleted.count };
}

async function resetCompass(userIds: string[]) {
  return prisma.$transaction(async (transaction) => {
    const dailyGoals = await transaction.compass_daily_goals.deleteMany({
      where: { user_id: { in: userIds } },
    });
    const sessions = await transaction.compass_sessions.deleteMany({
      where: { user_id: { in: userIds } },
    });

    return {
      deletedDailyGoals: dailyGoals.count,
      deletedSessions: sessions.count,
    };
  });
}

async function resetCurrent(userIds: string[]) {
  return prisma.$transaction(async (transaction) => {
    const invitations = await transaction.current_invitations.deleteMany({
      where: { user_id: { in: userIds } },
    });
    const qualifications = await transaction.current_qualifications.deleteMany({
      where: { user_id: { in: userIds } },
    });

    return {
      deletedInvitations: invitations.count,
      deletedQualifications: qualifications.count,
    };
  });
}

type ResonanceRunRow = {
  id: string;
  run_number: number;
};

async function resetResonance(userId: string, weekNumber: number) {
  if (!Number.isInteger(weekNumber) || weekNumber < 1 || weekNumber > 10) {
    throw new Error("Invalid Resonance room.");
  }

  return prisma.$transaction(async (transaction) => {
    const lockKey = `owner-product-test-reset:${userId}`;
    await transaction.$queryRaw`
      SELECT pg_advisory_xact_lock(hashtext(${lockKey}))
    `;

    // Remove completed/active Resonance history from the participant-facing
    // chronology without deleting purchase records. This keeps a fresh room
    // from inheriting prior test reflections while preserving the rows.
    await transaction.resonance_week_runs.updateMany({
      where: {
        user_id: userId,
        status: { in: ["active", "completed"] },
      },
      data: {
        status: "preserved",
        updated_at: new Date(),
      },
    });

    const existing = await transaction.$queryRaw<ResonanceRunRow[]>`
      SELECT "id", "run_number"
      FROM "resonance_week_runs"
      WHERE "user_id" = ${userId}
        AND "week_number" = ${weekNumber}
        AND "status" <> 'cancelled'
      ORDER BY "run_number" DESC
      LIMIT 1
    `;

    let runId = existing[0]?.id ?? null;
    let createdOwnerTestRun = false;

    if (!runId) {
      const purchaseReference = `owner-test:${weekNumber}:${randomUUID()}`;
      const created = await transaction.$queryRaw<ResonanceRunRow[]>`
        INSERT INTO "resonance_week_runs" (
          "user_id",
          "week_number",
          "run_number",
          "status",
          "purchase_source",
          "purchase_reference",
          "purchased_at",
          "started_at",
          "completed_at",
          "created_at",
          "updated_at"
        )
        SELECT
          ${userId},
          ${weekNumber},
          COALESCE(MAX("run_number"), 0) + 1,
          'active',
          'owner_test_reset',
          ${purchaseReference},
          CURRENT_TIMESTAMP,
          CURRENT_TIMESTAMP,
          NULL,
          CURRENT_TIMESTAMP,
          CURRENT_TIMESTAMP
        FROM "resonance_week_runs"
        WHERE "user_id" = ${userId}
          AND "week_number" = ${weekNumber}
        RETURNING "id", "run_number"
      `;

      runId = created[0]?.id ?? null;
      createdOwnerTestRun = true;
    }

    if (!runId) {
      throw new Error("A clean Resonance test run could not be opened.");
    }

    await transaction.$executeRaw`
      DELETE FROM "prompt_analyses"
      WHERE "completion_id" IN (
        SELECT "id" FROM "prompt_completions" WHERE "run_id" = ${runId}::uuid
      )
    `;
    await transaction.$executeRaw`
      DELETE FROM "prompt_reactions"
      WHERE "completion_id" IN (
        SELECT "id" FROM "prompt_completions" WHERE "run_id" = ${runId}::uuid
      )
    `;
    await transaction.$executeRaw`
      DELETE FROM "prompt_completions" WHERE "run_id" = ${runId}::uuid
    `;
    await transaction.$executeRaw`
      DELETE FROM "resonance_day_guidance" WHERE "run_id" = ${runId}::uuid
    `;
    await transaction.$executeRaw`
      DELETE FROM "journey_day_continues" WHERE "run_id" = ${runId}::uuid
    `;
    await transaction.$executeRaw`
      DELETE FROM "mirror_responses" WHERE "run_id" = ${runId}::uuid
    `;
    await transaction.mirror_feedback.deleteMany({
      where: {
        user_id: userId,
        week_number: weekNumber,
      },
    });

    await transaction.resonance_week_runs.update({
      where: { id: runId },
      data: {
        status: "active",
        started_at: new Date(),
        completed_at: null,
        updated_at: new Date(),
      },
    });

    return {
      runId,
      weekNumber,
      createdOwnerTestRun,
    };
  });
}

export async function resetProductTestState({
  userId,
  target,
}: {
  userId: string;
  target: ProductTestTarget;
}) {
  if (!(await hasProductTestOwnerAccess(userId))) {
    throw new Error("OWNER_TEST_RESET_FORBIDDEN");
  }

  if (target.kind === "resonance") {
    return resetResonance(userId, target.weekNumber);
  }

  const ownerUserIds = await getOremeaOwnerResetUserIds(userId);

  if (target.kind === "recognition") {
    return resetRecognition(ownerUserIds);
  }

  if (target.kind === "compass") {
    return resetCompass(ownerUserIds);
  }

  return resetCurrent(ownerUserIds);
}
