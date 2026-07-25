import { prisma } from "@/lib/prisma";

export type RunPromptCompletion = {
  id: string;
  promptId: string;
  response: string;
  isShared: boolean;
  createdAt: Date;
  updatedAt: Date;
};

export type RunGuidance = {
  id: string;
  questionOne: string;
  questionTwo: string;
  answerOne: string | null;
  answerTwo: string | null;
  generatedAt: Date;
};

export type RunMirror = {
  id: string;
  userId: string;
  weekNumber: number;
  dayNumber: number;
  tier: string;
  output: string;
  createdAt: Date;
};

type CompletionRow = {
  id: string;
  prompt_id: string;
  response: string;
  is_shared: boolean;
  created_at: Date;
  updated_at: Date;
};

type GuidanceRow = {
  id: string;
  question_one: string;
  question_two: string;
  answer_one: string | null;
  answer_two: string | null;
  generated_at: Date;
};

type MirrorRow = {
  id: string;
  user_id: string;
  week_number: number;
  day_number: number;
  tier: string;
  output: string;
  created_at: Date;
};

export async function getRunPromptCompletions(
  runId: string,
  promptIds: string[],
): Promise<Map<string, RunPromptCompletion>> {
  if (promptIds.length === 0) return new Map();

  const rows = await prisma.$queryRaw<CompletionRow[]>`
    SELECT
      "id",
      "prompt_id",
      "response",
      "is_shared",
      "created_at",
      "updated_at"
    FROM "prompt_completions"
    WHERE "run_id" = ${runId}::uuid
      AND "prompt_id" = ANY(${promptIds}::uuid[])
  `;

  return new Map(
    rows.map((row) => [
      row.prompt_id,
      {
        id: row.id,
        promptId: row.prompt_id,
        response: row.response,
        isShared: row.is_shared,
        createdAt: row.created_at,
        updatedAt: row.updated_at,
      },
    ]),
  );
}

export async function getRunContinuedDays(runId: string): Promise<Set<number>> {
  const rows = await prisma.$queryRaw<{ day_number: number }[]>`
    SELECT "day_number"
    FROM "journey_day_continues"
    WHERE "run_id" = ${runId}::uuid
  `;

  return new Set(rows.map((row) => row.day_number));
}

export async function getRunGuidance(
  runId: string,
  dayNumber: number,
): Promise<RunGuidance | null> {
  const rows = await prisma.$queryRaw<GuidanceRow[]>`
    SELECT
      "id",
      "question_one",
      "question_two",
      "answer_one",
      "answer_two",
      "generated_at"
    FROM "resonance_day_guidance"
    WHERE "run_id" = ${runId}::uuid
      AND "day_number" = ${dayNumber}
    LIMIT 1
  `;

  const row = rows[0];
  if (!row) return null;

  return {
    id: row.id,
    questionOne: row.question_one,
    questionTwo: row.question_two,
    answerOne: row.answer_one,
    answerTwo: row.answer_two,
    generatedAt: row.generated_at,
  };
}

export async function getRunMirror(
  runId: string,
  dayNumber = 7,
): Promise<RunMirror | null> {
  const rows = await prisma.$queryRaw<MirrorRow[]>`
    SELECT
      "id",
      "user_id",
      "week_number",
      "day_number",
      "tier",
      "output",
      "created_at"
    FROM "mirror_responses"
    WHERE "run_id" = ${runId}::uuid
      AND "day_number" = ${dayNumber}
    LIMIT 1
  `;

  const row = rows[0];
  if (!row) return null;

  return {
    id: row.id,
    userId: row.user_id,
    weekNumber: row.week_number,
    dayNumber: row.day_number,
    tier: row.tier,
    output: row.output,
    createdAt: row.created_at,
  };
}
