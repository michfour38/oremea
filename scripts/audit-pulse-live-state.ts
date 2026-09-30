import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  const activeRuns = await prisma.resonance_week_runs.count({
    where: { week_number: 5, status: "active" },
  });

  const totalRuns = await prisma.resonance_week_runs.count({
    where: { week_number: 5 },
  });

  const activeRunRows = await prisma.resonance_week_runs.findMany({
    where: { week_number: 5, status: "active" },
    select: { id: true },
  });

  const activeRunIds = activeRunRows.map((run) => run.id);
  const activeRunCompletions = activeRunIds.length
    ? await prisma.prompt_completions.count({
        where: { run_id: { in: activeRunIds } },
      })
    : 0;

  const pulseWeek = await prisma.resonance_weeks.findUnique({
    where: { week_number: 5 },
    include: {
      resonance_days: {
        include: {
          day_prompts: {
            where: { is_published: true },
            select: { id: true, prompt_order: true },
          },
        },
      },
    },
  });

  const activePromptIds =
    pulseWeek?.resonance_days.flatMap((day) => day.day_prompts.map((prompt) => prompt.id)) ?? [];
  const activePromptCompletions = activePromptIds.length
    ? await prisma.prompt_completions.count({
        where: { prompt_id: { in: activePromptIds } },
      })
    : 0;

  console.log(
    JSON.stringify({
      pulse: {
        activeRuns,
        totalRuns,
        activeRunCompletions,
        activePromptCompletions,
      },
    }),
  );
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
