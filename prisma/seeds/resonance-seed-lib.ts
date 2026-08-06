import type { PrismaClient } from "@prisma/client";

import {
  RESONANCE_CONTENT,
  getResonanceWeekSeed,
  type ResonancePromptSeed,
} from "./resonance-content";

async function seedPrompt(
  prisma: PrismaClient,
  dayId: string,
  expected: ResonancePromptSeed,
) {
  const candidates = await prisma.day_prompts.findMany({
    where: {
      day_id: dayId,
      prompt_order: expected.prompt_order,
    },
    orderBy: [{ is_published: "desc" }, { created_at: "asc" }],
  });

  const exactMatch = candidates.find(
    (candidate) =>
      candidate.content === expected.content &&
      candidate.type === expected.type,
  );

  let activePromptId: string;

  if (exactMatch) {
    const activePrompt = await prisma.day_prompts.update({
      where: { id: exactMatch.id },
      data: {
        type: expected.type,
        label: expected.label,
        content: expected.content,
        is_published: true,
      },
      select: { id: true },
    });

    activePromptId = activePrompt.id;
  } else {
    const activePrompt = await prisma.day_prompts.create({
      data: {
        day_id: dayId,
        prompt_order: expected.prompt_order,
        type: expected.type,
        label: expected.label,
        content: expected.content,
        is_published: true,
      },
      select: { id: true },
    });

    activePromptId = activePrompt.id;
  }

  const supersededIds = candidates
    .filter((candidate) => candidate.id !== activePromptId)
    .map((candidate) => candidate.id);

  if (supersededIds.length > 0) {
    await prisma.day_prompts.updateMany({
      where: { id: { in: supersededIds } },
      data: { is_published: false },
    });
  }
}

export async function seedResonanceWeek(
  prisma: PrismaClient,
  weekNumber: number,
) {
  const seed = getResonanceWeekSeed(weekNumber);

  const room = await prisma.rooms.upsert({
    where: { slug: seed.slug },
    update: {
      name: seed.title,
      week_number: seed.week_number,
      theme: seed.theme,
      is_integration: seed.is_integration,
    },
    create: {
      slug: seed.slug,
      name: seed.title,
      week_number: seed.week_number,
      theme: seed.theme,
      is_integration: seed.is_integration,
    },
  });

  const week = await prisma.resonance_weeks.upsert({
    where: { week_number: seed.week_number },
    update: {
      room_id: room.id,
      title: seed.title,
      theme: seed.theme,
      is_published: true,
    },
    create: {
      room_id: room.id,
      week_number: seed.week_number,
      title: seed.title,
      theme: seed.theme,
      is_published: true,
    },
  });

  for (const daySeed of seed.days) {
    const day = await prisma.resonance_days.upsert({
      where: {
        week_id_day_number: {
          week_id: week.id,
          day_number: daySeed.day_number,
        },
      },
      update: {},
      create: {
        week_id: week.id,
        day_number: daySeed.day_number,
      },
    });

    for (const promptSeed of daySeed.prompts) {
      await seedPrompt(prisma, day.id, promptSeed);
    }

    const expectedOrders = daySeed.prompts.map((prompt) => prompt.prompt_order);

    await prisma.day_prompts.updateMany({
      where: {
        day_id: day.id,
        prompt_order: { notIn: expectedOrders },
        is_published: true,
      },
      data: { is_published: false },
    });
  }

  const expectedDayNumbers = seed.days.map((day) => day.day_number);
  const unexpectedDays = await prisma.resonance_days.findMany({
    where: {
      week_id: week.id,
      day_number: { notIn: expectedDayNumbers },
    },
    select: { id: true },
  });

  if (unexpectedDays.length > 0) {
    await prisma.day_prompts.updateMany({
      where: {
        day_id: { in: unexpectedDays.map((day) => day.id) },
        is_published: true,
      },
      data: { is_published: false },
    });
  }

  console.log(
    `Seeded Week ${seed.week_number}: ${seed.title} (${seed.days.length} days)`,
  );
}

export async function seedAllResonance(prisma: PrismaClient) {
  for (const seed of RESONANCE_CONTENT) {
    await seedResonanceWeek(prisma, seed.week_number);
  }
}
