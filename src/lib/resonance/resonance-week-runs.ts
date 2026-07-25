import { prisma } from "@/lib/prisma";

export type ResonanceWeekRunStatus = "active" | "completed" | "cancelled";

export type ResonanceWeekRun = {
  id: string;
  userId: string;
  weekNumber: number;
  runNumber: number;
  status: ResonanceWeekRunStatus;
  purchaseSource: string | null;
  purchaseReference: string | null;
  purchasedAt: Date | null;
  startedAt: Date;
  completedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
};

type RunRow = {
  id: string;
  user_id: string;
  week_number: number;
  run_number: number;
  status: string;
  purchase_source: string | null;
  purchase_reference: string | null;
  purchased_at: Date | null;
  started_at: Date;
  completed_at: Date | null;
  created_at: Date;
  updated_at: Date;
};

function mapRun(row: RunRow): ResonanceWeekRun {
  return {
    id: row.id,
    userId: row.user_id,
    weekNumber: row.week_number,
    runNumber: row.run_number,
    status: row.status as ResonanceWeekRunStatus,
    purchaseSource: row.purchase_source,
    purchaseReference: row.purchase_reference,
    purchasedAt: row.purchased_at,
    startedAt: row.started_at,
    completedAt: row.completed_at,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function assertWeekNumber(weekNumber: number) {
  if (!Number.isInteger(weekNumber) || weekNumber < 1 || weekNumber > 10) {
    throw new Error("Invalid Resonance week.");
  }
}

export async function getActiveResonanceRun(
  userId: string,
): Promise<ResonanceWeekRun | null> {
  const rows = await prisma.$queryRaw<RunRow[]>`
    SELECT *
    FROM "resonance_week_runs"
    WHERE "user_id" = ${userId}
      AND "status" = 'active'
    ORDER BY "started_at" DESC
    LIMIT 1
  `;

  return rows[0] ? mapRun(rows[0]) : null;
}

export async function getResonanceWeekRuns(
  userId: string,
  weekNumber?: number,
): Promise<ResonanceWeekRun[]> {
  if (weekNumber !== undefined) {
    assertWeekNumber(weekNumber);

    const rows = await prisma.$queryRaw<RunRow[]>`
      SELECT *
      FROM "resonance_week_runs"
      WHERE "user_id" = ${userId}
        AND "week_number" = ${weekNumber}
      ORDER BY "run_number" ASC
    `;

    return rows.map(mapRun);
  }

  const rows = await prisma.$queryRaw<RunRow[]>`
    SELECT *
    FROM "resonance_week_runs"
    WHERE "user_id" = ${userId}
    ORDER BY "started_at" ASC, "week_number" ASC, "run_number" ASC
  `;

  return rows.map(mapRun);
}

export async function createPurchasedResonanceRun(params: {
  userId: string;
  weekNumber: number;
  purchaseSource: string;
  purchaseReference: string;
  purchasedAt?: Date;
}): Promise<ResonanceWeekRun> {
  const {
    userId,
    weekNumber,
    purchaseSource,
    purchaseReference,
    purchasedAt = new Date(),
  } = params;

  assertWeekNumber(weekNumber);

  if (!purchaseReference.trim()) {
    throw new Error("A purchase reference is required to open a Resonance run.");
  }

  const existing = await prisma.$queryRaw<RunRow[]>`
    SELECT *
    FROM "resonance_week_runs"
    WHERE "purchase_reference" = ${purchaseReference}
    LIMIT 1
  `;

  if (existing[0]) {
    if (
      existing[0].user_id !== userId ||
      existing[0].week_number !== weekNumber
    ) {
      throw new Error("This purchase reference is already attached elsewhere.");
    }

    return mapRun(existing[0]);
  }

  const active = await getActiveResonanceRun(userId);
  if (active) {
    throw new Error("Complete the active Resonance week before opening another.");
  }

  const rows = await prisma.$queryRaw<RunRow[]>`
    INSERT INTO "resonance_week_runs" (
      "user_id",
      "week_number",
      "run_number",
      "status",
      "purchase_source",
      "purchase_reference",
      "purchased_at",
      "started_at",
      "created_at",
      "updated_at"
    )
    SELECT
      ${userId},
      ${weekNumber},
      COALESCE(MAX("run_number"), 0) + 1,
      'active',
      ${purchaseSource},
      ${purchaseReference},
      ${purchasedAt},
      ${purchasedAt},
      ${purchasedAt},
      ${purchasedAt}
    FROM "resonance_week_runs"
    WHERE "user_id" = ${userId}
      AND "week_number" = ${weekNumber}
    RETURNING *
  `;

  const created = rows[0];
  if (!created) {
    throw new Error("The Resonance run could not be created.");
  }

  return mapRun(created);
}

export async function completeResonanceRun(
  userId: string,
  runId: string,
): Promise<ResonanceWeekRun> {
  const completedAt = new Date();

  const rows = await prisma.$queryRaw<RunRow[]>`
    UPDATE "resonance_week_runs"
    SET
      "status" = 'completed',
      "completed_at" = ${completedAt},
      "updated_at" = ${completedAt}
    WHERE "id" = ${runId}::uuid
      AND "user_id" = ${userId}
      AND "status" = 'active'
    RETURNING *
  `;

  const completed = rows[0];
  if (!completed) {
    throw new Error("The active Resonance run could not be completed.");
  }

  return mapRun(completed);
}

export async function getComparableResonanceRuns(
  userId: string,
  weekNumber: number,
): Promise<ResonanceWeekRun[]> {
  assertWeekNumber(weekNumber);

  const rows = await prisma.$queryRaw<RunRow[]>`
    SELECT *
    FROM "resonance_week_runs"
    WHERE "user_id" = ${userId}
      AND "week_number" = ${weekNumber}
      AND "status" = 'completed'
    ORDER BY "run_number" ASC
  `;

  return rows.map(mapRun);
}
