import { prisma } from "@/lib/prisma";

import { getActiveResonanceRun } from "@/src/lib/resonance/resonance-week-run";
import { getRunMirror } from "@/src/lib/resonance/resonance-run-data";

type JourneyRun = {
  id: string;
  weekNumber: number;
  runNumber: number;
  journeyPosition: number;
};

type ReflectionRow = {
  run_id: string;
  week_number: number;
  run_number: number;
  week_title: string;
  week_theme: string;
  day_number: number;
  prompt_order: number;
  response: string;
  created_at: Date;
};

type GuidanceRow = {
  run_id: string;
  week_number: number;
  run_number: number;
  day_number: number;
  question_one: string;
  question_two: string;
  answer_one: string | null;
  answer_two: string | null;
  generated_at: Date;
};

type MirrorRow = {
  run_id: string;
  week_number: number;
  run_number: number;
  output: string;
  created_at: Date;
};

type SavedMirrorRow = {
  id: string;
  user_id: string;
  week_number: number;
  day_number: number;
  tier: string;
  output: string;
  created_at: Date;
};

async function getJourneyRuns(userId: string, currentRunId: string) {
  const rows = await prisma.$queryRaw<
    Array<{
      id: string;
      week_number: number;
      run_number: number;
      status: string;
      started_at: Date;
      completed_at: Date | null;
    }>
  >`
    SELECT
      "id",
      "week_number",
      "run_number",
      "status",
      "started_at",
      "completed_at"
    FROM "resonance_week_runs"
    WHERE "user_id" = ${userId}
      AND ("status" = 'completed' OR "id" = ${currentRunId}::uuid)
    ORDER BY
      CASE WHEN "status" = 'completed' THEN 0 ELSE 1 END,
      COALESCE("completed_at", "started_at") ASC,
      "started_at" ASC
  `;

  const ordered = rows.filter(
    (row) => row.status === "completed" || row.id === currentRunId,
  );

  return ordered.map(
    (row, index): JourneyRun => ({
      id: row.id,
      weekNumber: row.week_number,
      runNumber: row.run_number,
      journeyPosition: index + 1,
    }),
  );
}

async function getJourneyReflections(runs: JourneyRun[]) {
  if (runs.length === 0) return [];

  const runIds = runs.map((run) => run.id);
  const positionByRun = new Map(runs.map((run) => [run.id, run.journeyPosition]));

  const rows = await prisma.$queryRaw<ReflectionRow[]>`
    SELECT
      pc."run_id",
      r."week_number",
      r."run_number",
      rw."title" AS "week_title",
      rw."theme" AS "week_theme",
      rd."day_number",
      dp."prompt_order",
      pc."response",
      pc."created_at"
    FROM "prompt_completions" pc
    JOIN "resonance_week_runs" r ON r."id" = pc."run_id"
    JOIN "day_prompts" dp ON dp."id" = pc."prompt_id"
    JOIN "journey_days" rd ON rd."id" = dp."day_id"
    JOIN "journey_weeks" rw ON rw."id" = rd."week_id"
    WHERE pc."run_id" = ANY(${runIds}::uuid[])
    ORDER BY pc."created_at" ASC
  `;

  return rows
    .map((row) => ({
      journeyPosition: positionByRun.get(row.run_id) ?? 0,
      runId: row.run_id,
      weekNumber: row.week_number,
      runNumber: row.run_number,
      weekTitle: row.week_title,
      weekTheme: row.week_theme,
      dayNumber: row.day_number,
      promptOrder: row.prompt_order,
      response: row.response.trim(),
      createdAt: row.created_at,
    }))
    .filter((row) => row.journeyPosition > 0 && row.response)
    .sort((a, b) => {
      if (a.journeyPosition !== b.journeyPosition) {
        return a.journeyPosition - b.journeyPosition;
      }
      if (a.dayNumber !== b.dayNumber) return a.dayNumber - b.dayNumber;
      if (a.promptOrder !== b.promptOrder) return a.promptOrder - b.promptOrder;
      return a.createdAt.getTime() - b.createdAt.getTime();
    });
}

async function getGuidanceContext(runs: JourneyRun[]) {
  if (runs.length === 0) return [];

  const runIds = runs.map((run) => run.id);
  const positionByRun = new Map(runs.map((run) => [run.id, run.journeyPosition]));

  const rows = await prisma.$queryRaw<GuidanceRow[]>`
    SELECT
      g."run_id",
      r."week_number",
      r."run_number",
      g."day_number",
      g."question_one",
      g."question_two",
      g."answer_one",
      g."answer_two",
      g."generated_at"
    FROM "resonance_day_guidance" g
    JOIN "resonance_week_runs" r ON r."id" = g."run_id"
    WHERE g."run_id" = ANY(${runIds}::uuid[])
    ORDER BY g."generated_at" ASC, g."day_number" ASC
  `;

  return rows
    .map((row) => ({
      journeyPosition: positionByRun.get(row.run_id) ?? 0,
      weekNumber: row.week_number,
      runNumber: row.run_number,
      dayNumber: row.day_number,
      questionOne: row.question_one,
      questionTwo: row.question_two,
      answerOne: row.answer_one?.trim() || null,
      answerTwo: row.answer_two?.trim() || null,
    }))
    .filter((row) => row.journeyPosition > 0)
    .sort((a, b) => {
      if (a.journeyPosition !== b.journeyPosition) {
        return a.journeyPosition - b.journeyPosition;
      }
      return a.dayNumber - b.dayNumber;
    });
}

async function getPriorMirrorContext(runs: JourneyRun[], currentRunId: string) {
  const priorRuns = runs.filter((run) => run.id !== currentRunId);
  if (priorRuns.length === 0) return [];

  const runIds = priorRuns.map((run) => run.id);
  const positionByRun = new Map(runs.map((run) => [run.id, run.journeyPosition]));

  const rows = await prisma.$queryRaw<MirrorRow[]>`
    SELECT
      m."run_id",
      r."week_number",
      r."run_number",
      m."output",
      m."created_at"
    FROM "mirror_responses" m
    JOIN "resonance_week_runs" r ON r."id" = m."run_id"
    WHERE m."run_id" = ANY(${runIds}::uuid[])
      AND m."day_number" = 7
      AND m."tier" = 'full'
    ORDER BY m."created_at" ASC
  `;

  return rows
    .map((row) => ({
      journeyPosition: positionByRun.get(row.run_id) ?? 0,
      weekNumber: row.week_number,
      runNumber: row.run_number,
      output: row.output.trim(),
    }))
    .filter((row) => row.journeyPosition > 0 && row.output)
    .sort((a, b) => a.journeyPosition - b.journeyPosition);
}

function buildReflectionTimeline(
  reflections: Awaited<ReturnType<typeof getJourneyReflections>>,
  runs: JourneyRun[],
) {
  return runs
    .map((run) => {
      const runReflections = reflections.filter(
        (reflection) => reflection.runId === run.id,
      );

      if (runReflections.length === 0) return null;

      const first = runReflections[0];
      const body = runReflections
        .map(
          (reflection) =>
            `[Day ${reflection.dayNumber} · Reflection ${reflection.promptOrder}]\n${reflection.response}`,
        )
        .join("\n\n");

      return `JOURNEY POSITION ${run.journeyPosition}\nWeek ${run.weekNumber} · Run ${run.runNumber}: ${first.weekTitle}\nTheme: ${first.weekTheme}\n\n${body}`;
    })
    .filter((value): value is string => Boolean(value))
    .join("\n\n---\n\n");
}

function buildGuidanceContext(
  guidance: Awaited<ReturnType<typeof getGuidanceContext>>,
) {
  if (guidance.length === 0) return "None yet.";

  return guidance
    .map((row) => {
      const answers = [
        row.answerOne ? `Participant answer 1: ${row.answerOne}` : null,
        row.answerTwo ? `Participant answer 2: ${row.answerTwo}` : null,
      ]
        .filter(Boolean)
        .join("\n");

      return `[Journey position ${row.journeyPosition} · Week ${row.weekNumber} · Run ${row.runNumber} · Day ${row.dayNumber}]\nQ1: ${row.questionOne}\nQ2: ${row.questionTwo}${answers ? `\n${answers}` : ""}`;
    })
    .join("\n\n");
}

function buildPriorMirrorContext(
  mirrors: Awaited<ReturnType<typeof getPriorMirrorContext>>,
) {
  if (mirrors.length === 0) return "None yet.";

  return mirrors
    .map(
      (mirror) =>
        `[Journey position ${mirror.journeyPosition} · Week ${mirror.weekNumber} · Run ${mirror.runNumber}]\n${mirror.output}`,
    )
    .join("\n\n---\n\n");
}

function buildPrompt(params: {
  runs: JourneyRun[];
  reflections: Awaited<ReturnType<typeof getJourneyReflections>>;
  guidance: Awaited<ReturnType<typeof getGuidanceContext>>;
  priorMirrors: Awaited<ReturnType<typeof getPriorMirrorContext>>;
  currentWeekNumber: number;
  currentRunNumber: number;
}) {
  const {
    runs,
    reflections,
    guidance,
    priorMirrors,
    currentWeekNumber,
    currentRunNumber,
  } = params;

  const reflectionTimeline = buildReflectionTimeline(reflections, runs);
  const guidanceContext = buildGuidanceContext(guidance);
  const mirrorContext = buildPriorMirrorContext(priorMirrors);

  const journeyOrder = runs
    .map((run) => `Week ${run.weekNumber} · Run ${run.runNumber}`)
    .join(" → ");

  return `
You are the Resonance Mirror.

Resonance means: Help me stay with myself.

This Mirror closes one Resonance run while looking across the participant's entire completed Resonance journey and the run closing now.

The numbered weeks are thematic rooms, not chronological stages. A participant may return to the same room through a later purchase. Treat JOURNEY POSITION as the true chronology. A later run of the same week is a new visit and must remain distinct from the earlier visit.

The run closing now is Week ${currentWeekNumber} · Run ${currentRunNumber}.
The journey order so far is: ${journeyOrder}.

EVIDENCE HIERARCHY
1. Participant reflections are primary evidence.
2. Any participant-written answers to 2Q are also primary evidence.
3. Generated 2Q questions and previous Mirrors are continuity context only. Read them to avoid repetition, notice what has already been asked or reflected, and see where the participant's later language differs from earlier framing.
4. Never treat a generated question or a previous Mirror statement as proof about the participant.

YOUR TASK
Reflect the longitudinal structure already present in the participant's own words.

Look across the whole journey for:
- subjects, values, needs, relationships, conditions, or questions that remain present across different journey positions
- language that changes, becomes more precise, softens, strengthens, widens, or narrows over time
- what the participant explicitly says matters
- clarity that persists across changing circumstances
- conditions under which they describe losing contact with clarity, second-guessing, circling, or being pulled away from what they know
- recurring relationships or dependencies the participant explicitly describes
- changes in how the participant describes their own participation
- several truths that remain true at the same time
- what becomes newly visible in the run closing now when placed beside earlier journey positions
- when this is a return to a previously visited week, what is the same, different, more precise, newly present, or less prominent in the participant's own language

CONTINUITY CHECK
Before writing, read all earlier generated 2Q and prior Mirrors below.
Avoid simply restating a previous Mirror.
Avoid asking or implicitly re-answering questions already covered unless the participant's newer words materially change the picture.
Where an earlier Mirror framed something one way and the participant's later words support a more precise framing, privilege the participant's later words.

EVIDENCE AND AUTHORITY
- Participant language is authoritative about what they say, want, value, choose, notice, or know.
- Repetition is evidence of recurrence, not proof of meaning.
- A change in wording is evidence of changed wording. Describe what changed before assigning significance to it.
- Several truths can coexist. Do not manufacture contradiction merely because two different statements are both present.
- Distinguish direct statements from interpretation.
- Preserve the participant's authority over what the pattern means.
- Avoid diagnosis, readiness judgments, psychological labels, coaching, prescriptions, or advice.
- Intensity, repetition, punctuation, and emotional wording do not establish importance unless the participant identifies importance themselves.
- Never label difference between runs as improvement, regression, healing, progress, or failure unless the participant explicitly uses that language about themselves.

WRITING
- grounded
- clear
- emotionally precise
- human rather than clinical
- specific rather than generic
- spacious enough to hold complexity
- proportionate to the available evidence

Write a cumulative reflection of roughly 6 to 10 short paragraphs.
Begin with what becomes most visible when the journey is viewed as a whole.
Show meaningful continuity and change across actual journey positions.
Give particular attention to what the newly completed run adds, clarifies, or changes in relation to what came before.
End with a grounded statement of what is now available for the participant to see in their own account.

Do not use headings in the final Mirror.
Do not write “The mirror shows.”
Do not end with questions. Daily 2Q already holds the questioning function.

PRIMARY EVIDENCE — PARTICIPANT REFLECTION TIMELINE
${reflectionTimeline}

2Q CONTEXT
Generated questions are continuity context. Any participant answers shown beneath them are participant evidence.
${guidanceContext}

PRIOR MIRROR CONTEXT
Use only to curb repetition and understand what has already been reflected. Do not use these outputs as evidence about the participant.
${mirrorContext}
`;
}

async function callMirrorAPI(prompt: string): Promise<string | null> {
  try {
    const res = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": process.env.ANTHROPIC_API_KEY!,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model: "claude-sonnet-4-20250514",
        max_tokens: 1400,
        messages: [{ role: "user", content: prompt }],
      }),
    });

    const data = await res.json();

    if (!res.ok) {
      console.error("Mirror API error:", data);
      return null;
    }

    const text = Array.isArray(data?.content)
      ? data.content
          .filter(
            (item: { type?: string; text?: string }) => item?.type === "text",
          )
          .map((item: { text?: string }) => item.text ?? "")
          .join("\n\n")
          .trim()
      : "";

    return text || null;
  } catch (error) {
    console.error("Mirror API request failed:", error);
    return null;
  }
}

export async function runResonanceRunWeeklyMirror(
  userId: string,
  weekNumber: number,
  dayNumber: number,
) {
  if (dayNumber !== 7) return null;

  const activeRun = await getActiveResonanceRun(userId);
  if (!activeRun || activeRun.weekNumber !== weekNumber) return null;

  const existing = await getRunMirror(activeRun.id, 7);
  if (existing?.tier === "full") return existing;

  const runs = await getJourneyRuns(userId, activeRun.id);
  const [reflections, guidance, priorMirrors] = await Promise.all([
    getJourneyReflections(runs),
    getGuidanceContext(runs),
    getPriorMirrorContext(runs, activeRun.id),
  ]);

  const currentRunReflectionCount = reflections.filter(
    (reflection) => reflection.runId === activeRun.id,
  ).length;

  if (currentRunReflectionCount === 0) return null;

  const prompt = buildPrompt({
    runs,
    reflections,
    guidance,
    priorMirrors,
    currentWeekNumber: activeRun.weekNumber,
    currentRunNumber: activeRun.runNumber,
  });

  const output = await callMirrorAPI(prompt);
  if (!output) return null;

  const participant2QAnswerCount = guidance.reduce(
    (count, row) =>
      count + Number(Boolean(row.answerOne)) + Number(Boolean(row.answerTwo)),
    0,
  );

  const inputSnapshot = JSON.stringify({
    type: "resonance_run_cumulative_mirror",
    evidenceSource: "participant_reflections_and_participant_2q_answers",
    continuityContext: "generated_2q_and_prior_mirrors",
    currentRunId: activeRun.id,
    currentWeekNumber: activeRun.weekNumber,
    currentRunNumber: activeRun.runNumber,
    journeyRuns: runs.map((run) => ({
      runId: run.id,
      weekNumber: run.weekNumber,
      runNumber: run.runNumber,
      journeyPosition: run.journeyPosition,
    })),
    totalReflectionCount: reflections.length,
    currentRunReflectionCount,
    guidanceDayCount: guidance.length,
    participant2QAnswerCount,
    priorMirrorCount: priorMirrors.length,
  });

  const saved = await prisma.$queryRaw<SavedMirrorRow[]>`
    INSERT INTO "mirror_responses" (
      "user_id",
      "week_number",
      "day_number",
      "run_id",
      "input_snapshot",
      "output",
      "patterns_detected",
      "contradictions",
      "created_at",
      "tier"
    )
    VALUES (
      ${userId},
      ${activeRun.weekNumber},
      7,
      ${activeRun.id}::uuid,
      ${inputSnapshot}::jsonb,
      ${output},
      ARRAY[]::text[],
      ARRAY[]::text[],
      CURRENT_TIMESTAMP,
      'full'
    )
    ON CONFLICT ("run_id", "day_number")
    DO UPDATE SET
      "input_snapshot" = EXCLUDED."input_snapshot",
      "output" = EXCLUDED."output",
      "patterns_detected" = ARRAY[]::text[],
      "contradictions" = ARRAY[]::text[],
      "tier" = 'full'
    RETURNING
      "id",
      "user_id",
      "week_number",
      "day_number",
      "tier",
      "output",
      "created_at"
  `;

  return saved[0] ?? null;
}
