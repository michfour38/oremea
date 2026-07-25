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

  const completedWeeks = rows
    .filter((row) => row.status === "completed")
    .map((row) => parseWeekNumber(row.product_key))
    .filter((weekNumber): weekNumber is number => weekNumber !== null)
    .sort((a, b) => a - b);

  const activeRows = rows
    .filter((row) => row.status === "active")
    .map((row) => parseWeekNumber(row.product_key))
    .filter((weekNumber): weekNumber is number => weekNumber !== null);

  if (activeRows.length > 1) {
    throw new Error("More than one Resonance week is active.");
  }

  const activeWeek = activeRows[0] ?? null;
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

  const productKey = productKeyForWeek(weekNumber);

  const result = await prisma.oremea_entitlements.updateMany({
    where: {
      user_id: userId,
      product_key: productKey,
      status: "active",
    },
    data: {
      status: "completed",
    },
  });

  if (result.count !== 1) {
    throw new Error("The active Resonance week could not be completed.");
  }
}
