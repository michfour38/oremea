import { prisma } from "@/lib/prisma";

const RESONANCE_WEEK_PREFIX = "resonance-week:";

type JourneyReflection = {
  journeyPosition: number;
  weekNumber: number;
  weekTitle: string;
  weekTheme: string;
  dayNumber: number;
  promptOrder: number;
  response: string;
};

type GuidanceContext = {
  journeyPosition: number;
  weekNumber: number;
  dayNumber: number;
  questionOne: string;
  questionTwo: string;
  answerOne: string | null;
  answerTwo: string | null;
};

type PriorMirrorContext = {
  journeyPosition: number;
  weekNumber: number;
  output: string;
};

function parseWeekNumber(productKey: string) {
  if (!productKey.startsWith(RESONANCE_WEEK_PREFIX)) return null;

  const weekNumber = Number(productKey.slice(RESONANCE_WEEK_PREFIX.length));
  return Number.isInteger(weekNumber) && weekNumber >= 1 && weekNumber <= 10
    ? weekNumber
    : null;
}

async function getJourneyWeekOrder(userId: string, currentWeekNumber: number) {
  const [weekEntitlements, legacyDaySevenContinues, priorWeeklyMirrors] =
    await Promise.all([
      prisma.oremea_entitlements.findMany({
        where: {
          user_id: userId,
          status: "completed",
          product_key: { startsWith: RESONANCE_WEEK_PREFIX },
        },
        orderBy: { updated_at: "asc" },
        select: {
          product_key: true,
          updated_at: true,
        },
      }),
      prisma.resonance_day_continues.findMany({
        where: {
          user_id: userId,
          day_number: 7,
        },
        orderBy: { continued_at: "asc" },
        select: {
          week_number: true,
          continued_at: true,
        },
      }),
      prisma.mirror_responses.findMany({
        where: {
          user_id: userId,
          day_number: 7,
          tier: "full",
        },
        orderBy: { created_at: "asc" },
        select: {
          week_number: true,
          created_at: true,
        },
      }),
    ]);

  const completedAtByWeek = new Map<number, Date>();

  for (const row of priorWeeklyMirrors) {
    if (row.week_number === currentWeekNumber) continue;
    completedAtByWeek.set(row.week_number, row.created_at);
  }

  for (const row of legacyDaySevenContinues) {
    if (row.week_number === currentWeekNumber) continue;

    const existing = completedAtByWeek.get(row.week_number);
    if (!existing || row.continued_at > existing) {
      completedAtByWeek.set(row.week_number, row.continued_at);
    }
  }

  for (const row of weekEntitlements) {
    const weekNumber = parseWeekNumber(row.product_key);
    if (weekNumber === null || weekNumber === currentWeekNumber) continue;
    completedAtByWeek.set(weekNumber, row.updated_at);
  }

  const completedWeeks = Array.from(completedAtByWeek.entries())
    .sort((a, b) => a[1].getTime() - b[1].getTime())
    .map(([weekNumber]) => weekNumber);

  return [...completedWeeks, currentWeekNumber];
}

async function getJourneyReflections(
  userId: string,
  journeyWeekOrder: number[],
): Promise<JourneyReflection[]> {
  const weekPosition = new Map(
    journeyWeekOrder.map((weekNumber, index) => [weekNumber, index + 1]),
  );

  const completions = await prisma.prompt_completions.findMany({
    where: {
      user_id: userId,
      day_prompts: {
        resonance_days: {
          resonance_weeks: {
            week_number: { in: journeyWeekOrder },
          },
        },
      },
    },
    select: {
      response: true,
      created_at: true,
      day_prompts: {
        select: {
          prompt_order: true,
          resonance_days: {
            select: {
              day_number: true,
              resonance_weeks: {
                select: {
                  week_number: true,
                  title: true,
                  theme: true,
                },
              },
            },
          },
        },
      },
    },
  });

  return completions
    .map((completion) => {
      const week = completion.day_prompts.resonance_days.resonance_weeks;
      const response = completion.response.trim();
      const journeyPosition = weekPosition.get(week.week_number);

      if (!response || journeyPosition === undefined) return null;

      return {
        journeyPosition,
        weekNumber: week.week_number,
        weekTitle: week.title,
        weekTheme: week.theme,
        dayNumber: completion.day_prompts.resonance_days.day_number,
        promptOrder: completion.day_prompts.prompt_order,
        response,
        createdAt: completion.created_at,
      };
    })
    .filter(
      (
        reflection,
      ): reflection is JourneyReflection & { createdAt: Date } => reflection !== null,
    )
    .sort((a, b) => {
      if (a.journeyPosition !== b.journeyPosition) {
        return a.journeyPosition - b.journeyPosition;
      }
      if (a.dayNumber !== b.dayNumber) return a.dayNumber - b.dayNumber;
      if (a.promptOrder !== b.promptOrder) return a.promptOrder - b.promptOrder;
      return a.createdAt.getTime() - b.createdAt.getTime();
    })
    .map(({ createdAt: _createdAt, ...reflection }) => reflection);
}

async function getGuidanceContext(
  userId: string,
  journeyWeekOrder: number[],
): Promise<GuidanceContext[]> {
  const weekPosition = new Map(
    journeyWeekOrder.map((weekNumber, index) => [weekNumber, index + 1]),
  );

  const rows = await prisma.resonance_day_guidance.findMany({
    where: {
      user_id: userId,
      week_number: { in: journeyWeekOrder },
    },
    orderBy: [{ generated_at: "asc" }, { day_number: "asc" }],
    select: {
      week_number: true,
      day_number: true,
      question_one: true,
      question_two: true,
      answer_one: true,
      answer_two: true,
    },
  });

  return rows
    .map((row) => {
      const journeyPosition = weekPosition.get(row.week_number);
      if (journeyPosition === undefined) return null;

      return {
        journeyPosition,
        weekNumber: row.week_number,
        dayNumber: row.day_number,
        questionOne: row.question_one,
        questionTwo: row.question_two,
        answerOne: row.answer_one?.trim() || null,
        answerTwo: row.answer_two?.trim() || null,
      };
    })
    .filter((row): row is GuidanceContext => row !== null)
    .sort((a, b) => {
      if (a.journeyPosition !== b.journeyPosition) {
        return a.journeyPosition - b.journeyPosition;
      }
      return a.dayNumber - b.dayNumber;
    });
}

async function getPriorMirrorContext(
  userId: string,
  journeyWeekOrder: number[],
  currentWeekNumber: number,
): Promise<PriorMirrorContext[]> {
  const weekPosition = new Map(
    journeyWeekOrder.map((weekNumber, index) => [weekNumber, index + 1]),
  );

  const rows = await prisma.mirror_responses.findMany({
    where: {
      user_id: userId,
      day_number: 7,
      tier: "full",
      week_number: {
        in: journeyWeekOrder.filter((week) => week !== currentWeekNumber),
      },
    },
    orderBy: { created_at: "asc" },
    select: {
      week_number: true,
      output: true,
    },
  });

  return rows
    .map((row) => {
      const journeyPosition = weekPosition.get(row.week_number);
      if (journeyPosition === undefined || !row.output.trim()) return null;

      return {
        journeyPosition,
        weekNumber: row.week_number,
        output: row.output.trim(),
      };
    })
    .filter((row): row is PriorMirrorContext => row !== null)
    .sort((a, b) => a.journeyPosition - b.journeyPosition);
}

function buildReflectionTimeline(
  reflections: JourneyReflection[],
  journeyWeekOrder: number[],
) {
  return journeyWeekOrder
    .map((weekNumber, index) => {
      const weekReflections = reflections.filter(
        (reflection) => reflection.weekNumber === weekNumber,
      );

      if (weekReflections.length === 0) return null;

      const first = weekReflections[0];
      const body = weekReflections
        .map(
          (reflection) =>
            `[Day ${reflection.dayNumber} · Reflection ${reflection.promptOrder}]\n${reflection.response}`,
        )
        .join("\n\n");

      return `JOURNEY POSITION ${index + 1}\nWeek ${weekNumber}: ${first.weekTitle}\nTheme: ${first.weekTheme}\n\n${body}`;
    })
    .filter((value): value is string => Boolean(value))
    .join("\n\n---\n\n");
}

function buildGuidanceContext(guidance: GuidanceContext[]) {
  if (guidance.length === 0) return "None yet.";

  return guidance
    .map((row) => {
      const answers = [
        row.answerOne ? `Participant answer 1: ${row.answerOne}` : null,
        row.answerTwo ? `Participant answer 2: ${row.answerTwo}` : null,
      ]
        .filter(Boolean)
        .join("\n");

      return `[Journey position ${row.journeyPosition} · Week ${row.weekNumber} · Day ${row.dayNumber}]\nQ1: ${row.questionOne}\nQ2: ${row.questionTwo}${answers ? `\n${answers}` : ""}`;
    })
    .join("\n\n");
}

function buildPriorMirrorContext(mirrors: PriorMirrorContext[]) {
  if (mirrors.length === 0) return "None yet.";

  return mirrors
    .map(
      (mirror) =>
        `[Journey position ${mirror.journeyPosition} · Week ${mirror.weekNumber}]\n${mirror.output}`,
    )
    .join("\n\n---\n\n");
}

function buildPrompt(params: {
  journeyWeekOrder: number[];
  reflections: JourneyReflection[];
  guidance: GuidanceContext[];
  priorMirrors: PriorMirrorContext[];
  currentWeekNumber: number;
}) {
  const {
    journeyWeekOrder,
    reflections,
    guidance,
    priorMirrors,
    currentWeekNumber,
  } = params;

  const reflectionTimeline = buildReflectionTimeline(
    reflections,
    journeyWeekOrder,
  );
  const guidanceContext = buildGuidanceContext(guidance);
  const mirrorContext = buildPriorMirrorContext(priorMirrors);

  return `
You are the Resonance Mirror.

Resonance means: Help me stay with myself.

This Mirror closes one completed Resonance week while looking across the participant's entire Resonance journey so far.

The numbered weeks are thematic rooms, not chronological stages. The participant chooses their own week order. Treat JOURNEY POSITION as the true chronology.

The week closing now is Week ${currentWeekNumber}.
The journey order so far is: ${journeyWeekOrder.map((week) => `Week ${week}`).join(" → ")}.

EVIDENCE HIERARCHY
1. Participant reflections are primary evidence.
2. Any participant-written answers to 2Q are also primary evidence.
3. Generated 2Q questions and previous Mirrors are continuity context only. Read them to avoid repetition, notice what has already been asked or reflected, and see where the participant's later language differs from earlier framing.
4. Never treat a generated question or a previous Mirror statement as proof about the participant.

YOUR TASK
Reflect the longitudinal structure already present in the participant's own words.

Look across the whole journey for:
- subjects, values, needs, relationships, conditions, or questions that remain present across different weeks
- language that changes, becomes more precise, softens, strengthens, widens, or narrows over time
- something the participant once described one way and later describes with greater distinction
- what repeatedly matters to them, based on what they actually say matters
- clarity that persists across changing circumstances
- conditions under which they describe losing contact with clarity, second-guessing, circling, or being pulled away from what they know
- recurring relationships or dependencies the participant explicitly describes
- changes in how the participant describes their own participation
- several truths that remain true at the same time
- what becomes newly visible in the week closing now when placed beside the earlier journey

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
- Use grounded phrasing such as “you describe,” “you return to,” “across these weeks,” or “there may be” when interpretation is involved.
- Preserve the participant's authority over what the pattern means.
- Avoid diagnosis, readiness judgments, psychological labels, coaching, prescriptions, or advice.
- Intensity, repetition, punctuation, and emotional wording do not establish importance unless the participant identifies importance themselves.

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
Give particular attention to what the newly completed week adds, clarifies, or changes in relation to what came before.
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

export async function runResonanceWeeklyMirror(
  userId: string,
  weekNumber: number,
  dayNumber: number,
) {
  if (dayNumber !== 7) return null;

  const existing = await prisma.mirror_responses.findFirst({
    where: {
      user_id: userId,
      week_number: weekNumber,
      day_number: 7,
      tier: "full",
    },
  });

  if (existing) return existing;

  const journeyWeekOrder = await getJourneyWeekOrder(userId, weekNumber);
  const [reflections, guidance, priorMirrors] = await Promise.all([
    getJourneyReflections(userId, journeyWeekOrder),
    getGuidanceContext(userId, journeyWeekOrder),
    getPriorMirrorContext(userId, journeyWeekOrder, weekNumber),
  ]);

  const currentWeekReflectionCount = reflections.filter(
    (reflection) => reflection.weekNumber === weekNumber,
  ).length;

  if (currentWeekReflectionCount === 0) return null;

  const prompt = buildPrompt({
    journeyWeekOrder,
    reflections,
    guidance,
    priorMirrors,
    currentWeekNumber: weekNumber,
  });

  const output = await callMirrorAPI(prompt);
  if (!output) return null;

  const participant2QAnswerCount = guidance.reduce(
    (count, row) =>
      count + Number(Boolean(row.answerOne)) + Number(Boolean(row.answerTwo)),
    0,
  );

  return prisma.mirror_responses.upsert({
    where: {
      user_id_week_number_day_number: {
        user_id: userId,
        week_number: weekNumber,
        day_number: 7,
      },
    },
    update: {
      output,
      tier: "full",
      patterns_detected: [],
      contradictions: [],
      input_snapshot: {
        type: "resonance_weekly_cumulative_mirror",
        evidenceSource: "participant_reflections_and_participant_2q_answers",
        continuityContext: "generated_2q_and_prior_mirrors",
        currentWeekNumber: weekNumber,
        journeyWeekOrder,
        totalReflectionCount: reflections.length,
        guidanceDayCount: guidance.length,
        participant2QAnswerCount,
        priorMirrorCount: priorMirrors.length,
      },
    },
    create: {
      user_id: userId,
      week_number: weekNumber,
      day_number: 7,
      output,
      tier: "full",
      patterns_detected: [],
      contradictions: [],
      input_snapshot: {
        type: "resonance_weekly_cumulative_mirror",
        evidenceSource: "participant_reflections_and_participant_2q_answers",
        continuityContext: "generated_2q_and_prior_mirrors",
        currentWeekNumber: weekNumber,
        journeyWeekOrder,
        totalReflectionCount: reflections.length,
        guidanceDayCount: guidance.length,
        participant2QAnswerCount,
        priorMirrorCount: priorMirrors.length,
      },
    },
  });
}
