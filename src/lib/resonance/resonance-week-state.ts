import { prisma } from "@/lib/prisma";

const RESONANCE_WEEK_PREFIX = "resonance-week:";
const RESONANCE_WEEK_COUNT = 10;

export type ResonanceWeekState = {
  activeWeek: number | null;
  completedWeeks: number[];
  availableWeeks: number[];
};

function productKeyForWeek(weekNumber: number) {
  return `${RESONANCE_WEEK_PREFIX}${weekNumber}`;
}

function parseWeekNumber(productKey: string) {
  if (!productKey.startsWith(RESONANCE_WEEK_PREFIX)) return null;

  const weekNumber = Number(productKey.slice(RESONANCE_WEEK_PREFIX.length));

  return Number.isInteger(weekNumber) &&
    weekNumber >= 1 &&
    weekNumber <= RESONANCE_WEEK_COUNT
    ? weekNumber
    : null;
}

function assertValidWeekNumber(weekNumber: number) {
  if (
    !Number.isInteger(weekNumber) ||
    weekNumber < 1 ||
    weekNumber > RESONANCE_WEEK_COUNT
  ) {
    throw new Error("Invalid Resonance week.");
  }
}

type LegacyActivity = {
  weekNumber: number;
  occurredAt: Date;
};

async function getLegacyResonanceProgress(userId: string) {
  const [continues, completions, mirrors] = await Promise.all([
    prisma.resonance_day_continues.findMany({
      where: { user_id: userId },
      select: {
        week_number: true,
        day_number: true,
        continued_at: true,
      },
    }),
    prisma.prompt_completions.findMany({
      where: { user_id: userId },
      select: {
        created_at: true,
        updated_at: true,
        day_prompts: {
          select: {
            resonance_days: {
              select: {
                resonance_weeks: {
                  select: { week_number: true },
                },
              },
            },
          },
        },
      },
    }),
    prisma.mirror_responses.findMany({
      where: { user_id: userId },
      select: {
        week_number: true,
        created_at: true,
      },
    }),
  ]);

  const completedWeeks = new Set(
    continues
      .filter((row) => row.day_number === 7)
      .map((row) => row.week_number)
      .filter(
        (weekNumber) =>
          weekNumber >= 1 && weekNumber <= RESONANCE_WEEK_COUNT,
      ),
  );

  const activity: LegacyActivity[] = [];

  for (const row of continues) {
    if (
      row.week_number >= 1 &&
      row.week_number <= RESONANCE_WEEK_COUNT
    ) {
      activity.push({
        weekNumber: row.week_number,
        occurredAt: row.continued_at,
      });
    }
  }

  for (const row of completions) {
    const weekNumber =
      row.day_prompts?.resonance_days?.resonance_weeks?.week_number ?? null;

    if (
      weekNumber !== null &&
      weekNumber >= 1 &&
      weekNumber <= RESONANCE_WEEK_COUNT
    ) {
      activity.push({
        weekNumber,
        occurredAt:
          row.updated_at.getTime() > row.created_at.getTime()
            ? row.updated_at
            : row.created_at,
      });
    }
  }

  for (const row of mirrors) {
    if (
      row.week_number >= 1 &&
      row.week_number <= RESONANCE_WEEK_COUNT
    ) {
      activity.push({
        weekNumber: row.week_number,
        occurredAt: row.created_at,
      });
    }
  }

  const latestIncompleteActivity = activity
    .filter((row) => !completedWeeks.has(row.weekNumber))
    .sort((a, b) => b.occurredAt.getTime() - a.occurredAt.getTime())[0];

  return {
    completedWeeks: Array.from(completedWeeks),
    activeWeek: latestIncompleteActivity?.weekNumber ?? null,
  };
}

export async function getResonanceWeekState(
  userId: string,
): Promise<ResonanceWeekState> {
  const rows = await prisma.oremea_entitlements.findMany({
    where: {
      user_id: userId,
      product_key: {
        startsWith: RESONANCE_WEEK_PREFIX,
      },
    },
    orderBy: {
      updated_at: "asc",
    },
    select: {
      product_key: true,
      status: true,
    },
  });

  const explicitCompletedWeeks = rows
    .filter((row) => row.status === "completed")
    .map((row) => parseWeekNumber(row.product_key))
    .filter((weekNumber): weekNumber is number => weekNumber !== null);

  const activeRows = rows
    .filter((row) => row.status === "active")
    .map((row) => parseWeekNumber(row.product_key))
    .filter((weekNumber): weekNumber is number => weekNumber !== null);

  if (activeRows.length > 1) {
    throw new Error("More than one Resonance week is active.");
  }

  const legacy = await getLegacyResonanceProgress(userId);

  const completedWeeks = Array.from(
    new Set([...explicitCompletedWeeks, ...legacy.completedWeeks]),
  ).sort((a, b) => a - b);

  const explicitActiveWeek = activeRows[0] ?? null;

  // Legacy active inference is only used before the participant has entered the
  // new week-selection system. Once a resonance-week entitlement exists, the
  // explicit ledger owns active-week state.
  const activeWeek =
    explicitActiveWeek ?? (rows.length === 0 ? legacy.activeWeek : null);

  const completedSet = new Set(completedWeeks);

  const availableWeeks = activeWeek
    ? []
    : Array.from({ length: RESONANCE_WEEK_COUNT }, (_, index) => index + 1).filter(
        (weekNumber) => !completedSet.has(weekNumber),
      );

  return {
    activeWeek,
    completedWeeks,
    availableWeeks,
  };
}

export async function activateResonanceWeek(
  userId: string,
  weekNumber: number,
) {
  assertValidWeekNumber(weekNumber);

  const week = await prisma.resonance_weeks.findUnique({
    where: { week_number: weekNumber },
    select: {
      week_number: true,
      is_published: true,
    },
  });

  if (!week?.is_published) {
    throw new Error("This Resonance week is not available.");
  }

  const state = await getResonanceWeekState(userId);

  if (state.completedWeeks.includes(weekNumber)) {
    throw new Error("This Resonance week is already complete.");
  }

  if (state.activeWeek !== null && state.activeWeek !== weekNumber) {
    throw new Error("Another Resonance week is already active.");
  }

  const productKey = productKeyForWeek(weekNumber);

  await prisma.oremea_entitlements.upsert({
    where: {
      user_id_product_key: {
        user_id: userId,
        product_key: productKey,
      },
    },
    update: {
      status: "active",
      source: "resonance_week_selection",
      source_reference: String(weekNumber),
      revoked_at: null,
      expires_at: null,
    },
    create: {
      user_id: userId,
      product_key: productKey,
      status: "active",
      source: "resonance_week_selection",
      source_reference: String(weekNumber),
    },
  });

  return weekNumber;
}

export async function completeResonanceWeek(
  userId: string,
  weekNumber: number,
) {
  assertValidWeekNumber(weekNumber);

  const state = await getResonanceWeekState(userId);

  if (state.activeWeek !== weekNumber) {
    throw new Error("This Resonance week is not active.");
  }

  const productKey = productKeyForWeek(weekNumber);

  await prisma.oremea_entitlements.upsert({
    where: {
      user_id_product_key: {
        user_id: userId,
        product_key: productKey,
      },
    },
    update: {
      status: "completed",
      source: "resonance_week_completion",
      source_reference: String(weekNumber),
      revoked_at: null,
      expires_at: null,
    },
    create: {
      user_id: userId,
      product_key: productKey,
      status: "completed",
      source: "resonance_week_completion",
      source_reference: String(weekNumber),
    },
  });
}
