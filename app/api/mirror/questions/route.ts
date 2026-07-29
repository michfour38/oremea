import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";

import { prisma } from "@/lib/prisma";
import { OREMEA_EVIDENCE_BOUNDARY } from "@/src/lib/oremea/evidence-boundary";
import {
  getRunContinuedDays,
  getRunGuidance,
  getRunPromptCompletions,
} from "@/src/lib/resonance/resonance-run-data";
import { getActiveResonanceRun } from "@/src/lib/resonance/resonance-week-run";

function parseQuestions(output: string) {
  return output
    .split("\n")
    .map((line: string) =>
      line
        .trim()
        .replace(/^[-•]\s*/, "")
        .replace(/^\d+[\).\s-]+/, "")
        .trim(),
    )
    .filter((line: string) => line.includes("?"))
    .slice(0, 2);
}

async function callQuestionAPI(reflections: string[]) {
  const prompt = `
You are generating exactly TWO Resonance guiding reflection questions.

Resonance means: Help me stay with myself.
Use only the participant's reflections from the day that just closed.

${OREMEA_EVIDENCE_BOUNDARY}

QUESTION JOB
- begin from what is fresh, alive, specific, corrected, contrasted, or newly visible in today's actual writing
- let a precise phrase or distinction in their language guide the question before reaching for a broad pattern
- ask what helps the participant notice more of what is already present
- when two truths are both present, allow both to remain present instead of manufacturing a contradiction
- ask about a tension only when the participant's own writing actually supports that tension
- do not insert a motive, diagnosis, hidden need, identity, causal explanation, or conclusion into the question
- do not make the question prove an interpretation the model invented
- do not summarize the participant before asking
- do not generate a Mirror synthesis
- do not coach toward action; Resonance stays with recognition
- do not use generic self-help language
- do not ask "how do you feel?" or "what does this mean to you?"

Return exactly two questions and nothing else.
Each question must be specific to the participant's actual reflections.
Each question should open one clear doorway rather than contain several questions at once.

TODAY'S PARTICIPANT REFLECTIONS:
${reflections.join("\n\n")}
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
      max_tokens: 350,
      messages: [{ role: "user", content: prompt }],
    }),
  });

  const data = await res.json();

  if (!res.ok) {
    console.error("2Q API error:", data);
    return null;
  }

  const text: string = Array.isArray(data?.content)
    ? data.content
        .filter((item: { type?: string; text?: string }) => item?.type === "text")
        .map((item: { text?: string }) => item.text ?? "")
        .join("\n")
        .trim()
    : "";

  const questions = parseQuestions(text);
  return questions.length === 2 ? questions : null;
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

  const completedDays = await getRunContinuedDays(activeRun.id);
  let currentDay: number | null = null;

  for (let candidate = 1; candidate <= 7; candidate += 1) {
    if (!completedDays.has(candidate)) {
      currentDay = candidate;
      break;
    }
  }

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
  return {
    questions: guidance
      ? [guidance.questionOne, guidance.questionTwo]
      : [],
    answers: guidance
      ? [guidance.answerOne ?? "", guidance.answerTwo ?? ""]
      : [],
    answered: Boolean(
      guidance?.answerOne?.trim() && guidance?.answerTwo?.trim(),
    ),
  };
}

export async function GET(request: Request) {
  const { userId } = await auth();

  if (!userId) {
    return NextResponse.json({ questions: [], answers: [], answered: false }, { status: 401 });
  }

  const url = new URL(request.url);
  const weekNumber = Number(url.searchParams.get("weekNumber"));
  const dayNumber = Number(url.searchParams.get("dayNumber"));

  if (!weekNumber || !dayNumber) {
    return NextResponse.json({ questions: [], answers: [], answered: false }, { status: 400 });
  }

  const activeRun = await getActiveResonanceRun(userId);
  if (!activeRun || activeRun.weekNumber !== weekNumber) {
    return NextResponse.json({ questions: [], answers: [], answered: false }, { status: 400 });
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
  if (existing) {
    return NextResponse.json(guidancePayload(existing));
  }

  const completedDay = await assertActiveCompletedDay(
    userId,
    weekNumber,
    dayNumber,
  );

  if (!completedDay) {
    return NextResponse.json(
      { error: "Complete the current day before generating questions" },
      { status: 400 },
    );
  }

  const questions = await callQuestionAPI(completedDay.reflections);

  if (!questions) {
    return NextResponse.json(
      { error: "Could not generate questions" },
      { status: 500 },
    );
  }

  const inputSnapshot = JSON.stringify({
    type: "two_questions",
    runId: completedDay.runId,
    reflections: completedDay.reflections,
    questions,
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
      ${weekNumber},
      ${dayNumber},
      ${completedDay.runId}::uuid,
      ${questions[0]},
      ${questions[1]},
      ${inputSnapshot}::jsonb,
      CURRENT_TIMESTAMP,
      CURRENT_TIMESTAMP,
      CURRENT_TIMESTAMP
    )
    ON CONFLICT ("run_id", "day_number") DO NOTHING
  `;

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
  const answerOne = typeof body.answerOne === "string" ? body.answerOne.trim() : "";
  const answerTwo = typeof body.answerTwo === "string" ? body.answerTwo.trim() : "";

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
  if (!guidance) {
    return NextResponse.json(
      { error: "Generate today's 2Q before answering it" },
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
    questions: [guidance.questionOne, guidance.questionTwo],
    answers: [answerOne, answerTwo],
    answered: true,
  });
}
