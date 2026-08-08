import { prisma } from "@/lib/prisma";
import { getRunPromptCompletions } from "@/src/lib/resonance/resonance-run-data";

export type PromptType = "thread_prompt" | "mirror_exercise";

export type ResonancePromptDTO = {
  id: string;
  type: PromptType;
  promptOrder: number;
  label: string | null;
  content: string;
  isCompleted: boolean;
  isShared: boolean;
  isUnlocked: boolean;
  completionId: string | null;
  response: string | null;
  createdAt: string | null;
  updatedAt: string | null;
  canEdit: boolean;
};

export type CurrentDayContentParams = {
  phase: "CORE" | "INTEGRATION";
  weekNumber: number;
  dayNumber: number;
  userId?: string;
  runId?: string;
};

export type CurrentDayContentResult = {
  title: string;
  prompt: string;
  prompts: ResonancePromptDTO[];
  weekId: string | null;
  weekNumber: number;
  weekTitle: string;
  weekTheme: string;
  dayId: string | null;
  dayNumber: number;
  phase: "CORE" | "INTEGRATION";
};

const EDIT_WINDOW_MS = 10 * 60 * 1000;

function isWithinEditWindow(createdAt: Date | null | undefined): boolean {
  if (!createdAt) return false;
  return Date.now() - createdAt.getTime() <= EDIT_WINDOW_MS;
}

function applyGating(prompts: ResonancePromptDTO[]): ResonancePromptDTO[] {
  let allPreviousCompleted = true;

  return prompts.map((prompt) => {
    const isUnlocked = allPreviousCompleted;

    if (!prompt.isCompleted) {
      allPreviousCompleted = false;
    }

    return { ...prompt, isUnlocked };
  });
}

export async function getCurrentDayContent({
  phase,
  weekNumber,
  dayNumber,
  userId,
  runId,
}: CurrentDayContentParams): Promise<CurrentDayContentResult> {
  const week = await prisma.resonance_weeks.findFirst({
    where: {
      week_number: weekNumber,
      is_published: true,
    },
    include: {
      resonance_days: {
        where: {
          day_number: dayNumber,
        },
        include: {
          day_prompts: {
            where: {
              is_published: true,
            },
            orderBy: {
              prompt_order: "asc",
            },
            select: {
              id: true,
              type: true,
              prompt_order: true,
              label: true,
              content: true,
            },
          },
        },
      },
    },
  });

  if (!week || week.resonance_days.length === 0) {
    return {
      title: "No content available",
      prompt: "This day has not been configured yet.",
      prompts: [],
      weekId: null,
      weekNumber,
      weekTitle: "No content available",
      weekTheme: "",
      dayId: null,
      dayNumber,
      phase,
    };
  }

  const day = week.resonance_days[0];
  const promptIds = day.day_prompts.map((prompt) => prompt.id);

  const completionByPrompt =
    userId && runId
      ? await getRunPromptCompletions(runId, promptIds)
      : new Map();

  const prompts: ResonancePromptDTO[] = day.day_prompts.map((prompt) => {
    const completion = completionByPrompt.get(prompt.id) ?? null;

    return {
      id: prompt.id,
      type: prompt.type as PromptType,
      promptOrder: prompt.prompt_order,
      label: prompt.label,
      content: prompt.content,
      isCompleted: completion !== null,
      isShared: completion?.isShared ?? false,
      isUnlocked: true,
      completionId: completion?.id ?? null,
      response: completion?.response ?? null,
      createdAt: completion?.createdAt.toISOString() ?? null,
      updatedAt: completion?.updatedAt.toISOString() ?? null,
      canEdit: isWithinEditWindow(completion?.createdAt),
    };
  });

  const gatedPrompts = applyGating(prompts);
  const firstPrompt = gatedPrompts[0]?.content ?? "No prompt available";

  return {
    title: week.title,
    prompt: firstPrompt,
    prompts: gatedPrompts,
    weekId: week.id,
    weekNumber: week.week_number,
    weekTitle: week.title,
    weekTheme: week.theme,
    dayId: day.id,
    dayNumber: day.day_number,
    phase,
  };
}
