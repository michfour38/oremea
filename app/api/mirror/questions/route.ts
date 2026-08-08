import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";

import { prisma } from "@/lib/prisma";
import { OREMEA_EVIDENCE_BOUNDARY } from "@/src/lib/oremea/evidence-boundary";
import {
  getRunActiveDay,
  getRunGuidance,
  getRunPromptCompletions,
} from "@/src/lib/resonance/resonance-run-data";
import { getActiveResonanceRun } from "@/src/lib/resonance/resonance-week-run";

type PriorReflectionRow = {
  day_number: number;
  response: string;
};

type DailyMirrorSynthesis = {
  dailyMirror: string;
  questions: [string, string];
};

function dailyMirrorFromSnapshot(snapshot: unknown) {
  if (!snapshot || typeof snapshot !== "object" || Array.isArray(snapshot)) {
    return "";
  }

  const value = (snapshot as Record<string, unknown>).dailyMirror;
  return typeof value === "string" ? value.trim() : "";
}

function parseDailyMirror(output: string): DailyMirrorSynthesis | null {
  const mirror = output.match(/<mirror>\s*([\s\S]*?)\s*<\/mirror>/i)?.[1]?.trim();
  const questionOne = output
    .match(/<question_one>\s*([\s\S]*?)\s*<\/question_one>/i)?.[1]
    ?.trim();
  const questionTwo = output
    .match(/<question_two>\s*([\s\S]*?)\s*<\/question_two>/i)?.[1]
    ?.trim();

  if (!mirror || !questionOne || !questionTwo) return null;
  if (!questionOne.includes("?") || !questionTwo.includes("?")) return null;

  return {
    dailyMirror: mirror,
    questions: [questionOne, questionTwo],
  };
}

async function getPriorRunReflections(
  runId: string,
  weekNumber: number,
  dayNumber: number,
) {
  if (dayNumber <= 1) return [];

  const rows = await prisma.$queryRaw<PriorReflectionRow[]>`
    SELECT
      d."day_number",
      c."response"
    FROM "prompt_completions" c
    JOIN "day_prompts" p ON p."id" = c."prompt_id"
    JOIN "journey_days" d ON d."id" = p."day_id"
    JOIN "journey_weeks" w ON w."id" = d."week_id"
    WHERE c."run_id" = ${runId}::uuid
      AND w."week_number" = ${weekNumber}
      AND d."day_number" < ${dayNumber}
    ORDER BY d."day_number" ASC, p."prompt_order" ASC
  `;

  return rows
    .map((row) => row.response?.trim())
    .filter((value): value is string => Boolean(value))
    .slice(-24);
}

async function callDailyMirrorAPI(params: {
  reflections: string[];
  priorReflections: string[];
  dayNumber: number;
}) {
  const { reflections, priorReflections, dayNumber } = params;

  const prompt = `
You are the Resonance Daily Mirror.

Resonance means: Help me stay with myself.
The participant has completed Day ${dayNumber}. Your job is to read the whole day, reflect what is becoming visible, and then end with exactly TWO questions that arise from that reflection.

${OREMEA_EVIDENCE_BOUNDARY}

THIS IS A MIRROR, NOT A QUESTION GENERATOR.
The reflection is the main event. The two questions come at the end because the Mirror has already noticed something worth staying with.

MIRROR JOB
- read the participant's current-day reflections together, not as isolated answers
- notice repetition, contrast, sequence, behaviour, cues, choices, language changes, and tensions that are directly supported by what they wrote
- begin from the most alive, specific, revealing, or surprising detail in today's actual language
- connect details when the participant's own material supports the connection
- name a real pattern plainly when it is visible; do not dilute a clear observation into vague therapeutic language
- distinguish what appears to be recurring from what seems newly visible today
- notice where the participant describes one thing they want while their own behaviour or wording shows another movement, but only when that tension is actually present
- preserve paradox instead of resolving it for them
- where an interpretation goes beyond literal wording, make it visibly tentative rather than presenting it as fact
- write with enough substance that the participant can recognise the day from a new angle

VOICE
- grounded, intelligent, direct, human
- psychologically observant without diagnosing
- warm without soothing everything
- precise rather than polite
- no generic affirmations
- no coaching slogans
- no mystical filler
- no clinical language
- do not default to validation, belonging, safety, worth, boundaries, attachment, or nervous-system language unless the participant actually supplied that material
- do not turn every observation into a compliment
- do not explain the participant to themselves as though you know them better than they do

DEPTH
Write a substantial Daily Mirror, usually 5-8 paragraphs and roughly 450-700 words when today's material supports that depth. Do not pad thin material merely to hit a length. Use short quoted phrases from the participant only when they sharpen the observation.

QUESTION JOB
After the Mirror, ask exactly two questions.
- each question must grow directly from something the Mirror just named
- each must open an unresolved edge rather than merely ask the participant to repeat what they already said
- at least one should press gently but clearly on the strongest supported tension, contradiction, or self-observation in today's material when one exists
- avoid "how do you feel?" and "what does this mean to you?"
- do not smuggle an unsupported motive or diagnosis into the premise
- make the participant stop and look again

PRIOR DAYS IN THIS SAME VISIT
Use these only for continuity, recurrence, contrast, or change. Today's material remains foreground authority.
${priorReflections.length ? priorReflections.join("\n\n") : "None yet."}

TODAY'S PARTICIPANT REFLECTIONS
${reflections.join("\n\n")}

Return exactly this structure and nothing else:
<mirror>
Your substantial Daily Mirror reflection here.
</mirror>
<question_one>Your first precise question?</question_one>
<question_two>Your second precise question?</question_two>
`.trim();

  const res = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-api-key": process.env.ANTHROPIC_API_KEY!,
      "anthropic-version": "2023-06-01",
    },
    body: JSON.stringify({
      model: "claude-sonnet-4-5-20250929",
      max_tokens: 1500,
      messages: [{ role: "user", content: prompt }],
    }),
  });

  const data = await res.json();

  if (!res.ok) {
    console.error("Daily Mirror API error:", data);
    return null;
  }

  const text: string = Array.isArray(data?.content)
    ? data.content
        .filter((item: { type?: string; text?: string }) => item?.type === "text")
        .map((item: { text?: string }) => item.text ?? "")
        .join("\n")
        .trim()
    : "";

  return parseDailyMirror(text);
}

async function assertActiveCompletedDay(
  userId: string,
  weekNumber: number,
  dayNumber: number,
) {
  if (
    !Number.isInteger(weekNumber) ||
    weekNumber < 1 ||
    weekNumber > 10 ||
    !Number.isInteger(dayNumber) ||
    dayNumber < 1 ||
    dayNumber > 7
  ) {
    return null;
  }

  const activeRun = await getActiveResonanceRun(userId);
  if (!activeRun || activeRun.weekNumber !== weekNumber) return null;

  const currentDay = await getRunActiveDay(activeRun.id, weekNumber);
  if (currentDay !== dayNumber) return null;

  const day = await prisma.resonance_days.findFirst({
    where: {
      day_number: dayNumber,
      resonance_weeks: {
        week_number: weekNumber,
        is_published: true,
      },
    },
    select: {
      day_prompts: {
        where: { is_published: true },
        orderBy: { prompt_order: "asc" },
        select: { id: true },
      },
    },
  });

  if (!day || day.day_prompts.length === 0) return null;

  const promptIds = day.day_prompts.map((prompt) => prompt.id);
  const completions = await getRunPromptCompletions(activeRun.id, promptIds);

  if (promptIds.some((promptId) => !completions.has(promptId))) return null;

  const reflections = promptIds
    .map((promptId) => completions.get(promptId)?.response.trim() ?? "")
    .filter(Boolean);

  return reflections.length > 0
    ? { runId: activeRun.id, reflections }
    : null;
}

function guidancePayload(
  guidance: Awaited<ReturnType<typeof getRunGuidance>>,
) {
  const dailyMirror = guidance
    ? dailyMirrorFromSnapshot(guidance.inputSnapshot)
    : "";

  return {
    dailyMirror,
    questions:
      guidance && dailyMirror
        ? [guidance.questionOne, guidance.questionTwo]
        : [],
    answers:
      guidance && dailyMirror
        ? [guidance.answerOne ?? "", guidance.answerTwo ?? ""]
        : [],
    answered: Boolean(
      dailyMirror &&
        guidance?.answerOne?.trim() &&
        guidance.answerTwo?.trim(),
    ),
  };
}

export async function GET(request: Request) {
  const { userId } = await auth();

  if (!userId) {
    return NextResponse.json(
      { dailyMirror: "", questions: [], answers: [], answered: false },
      { status: 401 },
    );
  }

  const url = new URL(request.url);
  const weekNumber = Number(url.searchParams.get("weekNumber"));
  const dayNumber = Number(url.searchParams.get("dayNumber"));

  if (!weekNumber || !dayNumber) {
    return NextResponse.json(
      { dailyMirror: "", questions: [], answers: [], answered: false },
      { status: 400 },
    );
  }

  const activeRun = await getActiveResonanceRun(userId);
  if (!activeRun || activeRun.weekNumber !== weekNumber) {
    return NextResponse.json(
      { dailyMirror: "", questions: [], answers: [], answered: false },
      { status: 400 },
    );
  }

  const existing = await getRunGuidance(activeRun.id, dayNumber);
  return NextResponse.json(guidancePayload(existing));
}

export async function POST(request: Request) {
  const { userId } = await auth();

  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const url = new URL(request.url);
  const weekNumber = Number(url.searchParams.get("weekNumber"));
  const dayNumber = Number(url.searchParams.get("dayNumber"));

  if (!weekNumber || !dayNumber) {
    return NextResponse.json({ error: "Invalid params" }, { status: 400 });
  }

  const activeRun = await getActiveResonanceRun(userId);
  if (!activeRun || activeRun.weekNumber !== weekNumber) {
    return NextResponse.json(
      { error: "This Resonance run is not active" },
      { status: 400 },
    );
  }

  const existing = await getRunGuidance(activeRun.id, dayNumber);
  if (existing && dailyMirrorFromSnapshot(existing.inputSnapshot)) {
    return NextResponse.json(guidancePayload(existing));
  }

  const completedDay = await assertActiveCompletedDay(
    userId,
    weekNumber,
    dayNumber,
  );

  if (!completedDay) {
    return NextResponse.json(
      { error: "Complete the current day before opening today's Mirror" },
      { status: 400 },
    );
  }

  const priorReflections = await getPriorRunReflections(
    completedDay.runId,
    weekNumber,
    dayNumber,
  );

  const synthesis = await callDailyMirrorAPI({
    reflections: completedDay.reflections,
    priorReflections,
    dayNumber,
  });

  if (!synthesis) {
    return NextResponse.json(
      { error: "Today's Mirror could not be generated. Please try again." },
      { status: 500 },
    );
  }

  const inputSnapshot = JSON.stringify({
    type: "daily_mirror_2q",
    runId: completedDay.runId,
    reflections: completedDay.reflections,
    priorReflections,
    dailyMirror: synthesis.dailyMirror,
    questions: synthesis.questions,
  });

  if (existing) {
    await prisma.$executeRaw`
      UPDATE "resonance_day_guidance"
      SET
        "question_one" = ${synthesis.questions[0]},
        "question_two" = ${synthesis.questions[1]},
        "answer_one" = NULL,
        "answer_two" = NULL,
        "answered_at" = NULL,
        "input_snapshot" = ${inputSnapshot}::jsonb,
        "generated_at" = CURRENT_TIMESTAMP,
        "updated_at" = CURRENT_TIMESTAMP
      WHERE "run_id" = ${completedDay.runId}::uuid
        AND "day_number" = ${dayNumber}
    `;
  } else {
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
        ${weekNumber},
        ${dayNumber},
        ${completedDay.runId}::uuid,
        ${synthesis.questions[0]},
        ${synthesis.questions[1]},
        ${inputSnapshot}::jsonb,
        CURRENT_TIMESTAMP,
        CURRENT_TIMESTAMP,
        CURRENT_TIMESTAMP
      )
      ON CONFLICT ("run_id", "day_number") DO NOTHING
    `;
  }

  const created = await getRunGuidance(completedDay.runId, dayNumber);
  return NextResponse.json(guidancePayload(created));
}

export async function PATCH(request: Request) {
  const { userId } = await auth();

  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let body: {
    weekNumber?: unknown;
    dayNumber?: unknown;
    answerOne?: unknown;
    answerTwo?: unknown;
  };

  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }

  const weekNumber = Number(body.weekNumber);
  const dayNumber = Number(body.dayNumber);
  const answerOne =
    typeof body.answerOne === "string" ? body.answerOne.trim() : "";
  const answerTwo =
    typeof body.answerTwo === "string" ? body.answerTwo.trim() : "";

  if (!answerOne || !answerTwo) {
    return NextResponse.json(
      { error: "Answer both questions before continuing" },
      { status: 400 },
    );
  }

  const completedDay = await assertActiveCompletedDay(
    userId,
    weekNumber,
    dayNumber,
  );

  if (!completedDay) {
    return NextResponse.json(
      { error: "This Resonance day is not currently available" },
      { status: 400 },
    );
  }

  const guidance = await getRunGuidance(completedDay.runId, dayNumber);
  if (!guidance || !dailyMirrorFromSnapshot(guidance.inputSnapshot)) {
    return NextResponse.json(
      { error: "Open today's Mirror before answering its 2Q" },
      { status: 400 },
    );
  }

  await prisma.$executeRaw`
    UPDATE "resonance_day_guidance"
    SET
      "answer_one" = ${answerOne},
      "answer_two" = ${answerTwo},
      "answered_at" = CURRENT_TIMESTAMP,
      "updated_at" = CURRENT_TIMESTAMP
    WHERE "run_id" = ${completedDay.runId}::uuid
      AND "day_number" = ${dayNumber}
  `;

  return NextResponse.json({
    dailyMirror: dailyMirrorFromSnapshot(guidance.inputSnapshot),
    questions: [guidance.questionOne, guidance.questionTwo],
    answers: [answerOne, answerTwo],
    answered: true,
  });
}
