import { prisma } from "@/lib/prisma";

function parseQuestionsFromOutput(output: string) {
  return output
    .split("\n")
    .map((line) =>
      line
        .trim()
        .replace(/^[-•]\s*/, "")
        .replace(/^\d+[\).\s-]+/, "")
        .trim(),
    )
    .filter((line) => line.includes("?"))
    .slice(0, 2);
}

function questionsFromSnapshot(snapshot: unknown) {
  if (!snapshot || typeof snapshot !== "object" || Array.isArray(snapshot)) {
    return null;
  }

  const record = snapshot as Record<string, unknown>;
  const rawQuestions = record.questions;

  if (!Array.isArray(rawQuestions)) return null;

  const questions = rawQuestions
    .filter((value): value is string => typeof value === "string")
    .map((value) => value.trim())
    .filter(Boolean)
    .slice(0, 2);

  return questions.length === 2 ? questions : null;
}

type LegacyMirrorRow = {
  run_id: string;
  week_number: number;
  day_number: number;
  output: string;
  input_snapshot: unknown;
  created_at: Date;
};

export async function backfillLegacyResonanceGuidance(userId: string) {
  const legacyRows = await prisma.$queryRaw<LegacyMirrorRow[]>`
    SELECT
      "run_id",
      "week_number",
      "day_number",
      "output",
      "input_snapshot",
      "created_at"
    FROM "mirror_responses"
    WHERE "user_id" = ${userId}
      AND "tier" = 'lite'
  `;

  for (const row of legacyRows) {
    const questions =
      questionsFromSnapshot(row.input_snapshot) ??
      parseQuestionsFromOutput(row.output);

    if (questions.length !== 2) continue;

    const snapshot = JSON.stringify({
      type: "legacy_two_questions_backfill",
      source: "mirror_responses",
      originalSnapshot: row.input_snapshot,
    });

    await prisma.$executeRaw`
      INSERT INTO "resonance_day_guidance" (
        "user_id",
        "week_number",
        "day_number",
        "run_id",
        "question_one",
        "question_two",
        "input_snapshot",
        "generated_at",
        "created_at",
        "updated_at"
      )
      VALUES (
        ${userId},
        ${row.week_number},
        ${row.day_number},
        ${row.run_id}::uuid,
        ${questions[0]},
        ${questions[1]},
        ${snapshot}::jsonb,
        ${row.created_at},
        CURRENT_TIMESTAMP,
        CURRENT_TIMESTAMP
      )
      ON CONFLICT ("run_id", "day_number") DO NOTHING
    `;
  }
}
