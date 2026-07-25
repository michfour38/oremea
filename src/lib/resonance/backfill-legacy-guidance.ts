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

export async function backfillLegacyResonanceGuidance(userId: string) {
  const [legacyRows, existingGuidance] = await Promise.all([
    prisma.mirror_responses.findMany({
      where: {
        user_id: userId,
        tier: "lite",
      },
      select: {
        week_number: true,
        day_number: true,
        output: true,
        input_snapshot: true,
        created_at: true,
      },
    }),
    prisma.resonance_day_guidance.findMany({
      where: { user_id: userId },
      select: {
        week_number: true,
        day_number: true,
      },
    }),
  ]);

  if (legacyRows.length === 0) return;

  const existingKeys = new Set(
    existingGuidance.map((row) => `${row.week_number}-${row.day_number}`),
  );

  for (const row of legacyRows) {
    const key = `${row.week_number}-${row.day_number}`;
    if (existingKeys.has(key)) continue;

    const questions =
      questionsFromSnapshot(row.input_snapshot) ??
      parseQuestionsFromOutput(row.output);

    if (questions.length !== 2) continue;

    await prisma.resonance_day_guidance.upsert({
      where: {
        user_id_week_number_day_number: {
          user_id: userId,
          week_number: row.week_number,
          day_number: row.day_number,
        },
      },
      update: {},
      create: {
        user_id: userId,
        week_number: row.week_number,
        day_number: row.day_number,
        question_one: questions[0],
        question_two: questions[1],
        input_snapshot: {
          type: "legacy_two_questions_backfill",
          source: "mirror_responses",
          originalSnapshot: row.input_snapshot,
        },
        generated_at: row.created_at,
      },
    });

    existingKeys.add(key);
  }
}
