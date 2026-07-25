import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";

import { prisma } from "@/lib/prisma";
import { getResonanceWeekState } from "@/src/lib/resonance/resonance-week-state";

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
You are generating exactly TWO guiding reflection questions.

Use only the user's reflections below.

Rules:
- Do not summarize.
- Do not generate a Mirror synthesis.
- Return exactly two questions.
- Each question must be specific to the user's reflections.
- No generic self-help language.

REFLECTIONS:
${reflections.join("\n\n")}
`;

  const res = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-api-key": process.env.ANTHROPIC_API_KEY!,
      "anthropic-version": "2023-06-01",
    },
    body: JSON.stringify({
      model: "claude-sonnet-4-20250514",
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

  const state = await getResonanceWeekState(userId);
  if (state.activeWeek !== weekNumber) return null;

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
        select: {
          id: true,
          prompt_completions: {
            where: { user_id: userId },
            select: { response: true },
          },
        },
      },
    },
  });

  if (!day || day.day_prompts.length === 0) return null;

  const allPromptsCompleted = day.day_prompts.every(
    (prompt) => prompt.prompt_completions.length > 0,
  );

  if (!allPromptsCompleted) return null;

  const reflections = day.day_prompts
    .flatMap((prompt) => prompt.prompt_completions)
    .map((completion) => completion.response?.trim())
    .filter((value): value is string => Boolean(value));

  return reflections.length > 0 ? reflections : null;
}

export async function GET(request: Request) {
  const { userId } = await auth();

  if (!userId) {
    return NextResponse.json({ questions: [] }, { status: 401 });
  }

  const url = new URL(request.url);
  const weekNumber = Number(url.searchParams.get("weekNumber"));
  const dayNumber = Number(url.searchParams.get("dayNumber"));

  if (!weekNumber || !dayNumber) {
    return NextResponse.json({ questions: [] }, { status: 400 });
  }

  const existing = await prisma.resonance_day_guidance.findUnique({
    where: {
      user_id_week_number_day_number: {
        user_id: userId,
        week_number: weekNumber,
        day_number: dayNumber,
      },
    },
    select: {
      question_one: true,
      question_two: true,
    },
  });

  return NextResponse.json({
    questions: existing ? [existing.question_one, existing.question_two] : [],
  });
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

  const existing = await prisma.resonance_day_guidance.findUnique({
    where: {
      user_id_week_number_day_number: {
        user_id: userId,
        week_number: weekNumber,
        day_number: dayNumber,
      },
    },
    select: {
      question_one: true,
      question_two: true,
    },
  });

  if (existing) {
    return NextResponse.json({
      questions: [existing.question_one, existing.question_two],
    });
  }

  const reflections = await assertActiveCompletedDay(
    userId,
    weekNumber,
    dayNumber,
  );

  if (!reflections) {
    return NextResponse.json(
      { error: "Complete the current day before generating questions" },
      { status: 400 },
    );
  }

  const questions = await callQuestionAPI(reflections);

  if (!questions) {
    return NextResponse.json(
      { error: "Could not generate questions" },
      { status: 500 },
    );
  }

  await prisma.resonance_day_guidance.create({
    data: {
      user_id: userId,
      week_number: weekNumber,
      day_number: dayNumber,
      question_one: questions[0],
      question_two: questions[1],
      input_snapshot: {
        type: "two_questions",
        reflections,
        questions,
      },
    },
  });

  return NextResponse.json({ questions });
}
