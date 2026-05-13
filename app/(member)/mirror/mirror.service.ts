import { prisma } from "@/lib/prisma";

// ─── Types ─────────────────────────────────────────

export interface MirrorResponseDTO {
  id: string;
  userId: string;
  weekNumber: number;
  dayNumber: number;
  output: string;
  tier: "lite" | "full";
  createdAt: string;
}

// ─── Prompt building ───────────────────────────────

function buildPrompt(params: {
  prewaveResponses: string[];
  priorJourneyResponses: string[];
  currentDayResponses: string[];
  weekNumber: number;
  dayNumber: number;
  tier: "lite" | "full";
}) {
  const {
    prewaveResponses,
    priorJourneyResponses,
    currentDayResponses,
    weekNumber,
    dayNumber,
    tier,
  } = params;

  return `
You are the Resonance Mirror.

You reflect what is becoming visible in the user's journey.

Current position:
Week ${weekNumber}, Day ${dayNumber}
Mirror tier: ${tier}

You must use:
1. the user's pre-wave responses
2. the user's earlier journey reflections
3. the user's reflections from THIS CURRENT DAY

Your job is NOT to restate the same identity summary every day.
Your job is to notice:
- what is repeating
- what feels newly revealed today
- what tension is active now
- what seems to be shifting

WRITE LIKE THIS:

- grounded
- clear
- psychologically accurate
- emotionally precise
- not clinical
- not generic
- not mystical
- not repetitive

RULES:

- Do not summarize the whole person
- Do not give the same reflection every day
- Do not repeat broad traits unless today's material genuinely supports them
- Prioritize what is fresh, alive, specific, or newly clarified in today's reflections
- Start from one concrete emotional edge, image, phrase, or tension that appears in today's writing
- If an older pattern appears again, connect it briefly, then move to what is different now
- Name one real tension or contradiction if present
- Name one thing that feels newly revealed today
- Keep it concise but meaningful
- Write as though you truly heard the person, not as though you evaluated them

STRUCTURE:

- Do not use headings.
- Do not write “The mirror shows:”
- Do not write “Two questions:”
- Do not bold section titles.
- Let the reflection and the two questions flow naturally without labels.

1. Begin with the most alive specific thing from today's reflections
2. Name what it reveals underneath in plain, human language
3. Name one real tension or contradiction if present
4. Briefly distinguish what feels old versus what feels newly emerging today
5. Keep the reflection grounded and concise
6. End with exactly 2 precise questions that directly relate to what you just named

QUESTION RULES:

- Questions must reference the user's actual themes and wording energy
- Avoid phrases like "how do you feel" or "what does this mean to you"
- Ask something that makes the user pause and notice something real
- At least one question should point to the tension between what the user wants and what they protect

PRE-WAVE:
${prewaveResponses.length ? prewaveResponses.join("\n\n") : "None"}

EARLIER JOURNEY RESPONSES:
${priorJourneyResponses.length ? priorJourneyResponses.join("\n\n") : "None"}

CURRENT DAY RESPONSES:
${currentDayResponses.length ? currentDayResponses.join("\n\n") : "None"}
`;
}

// ─── API call ──────────────────────────────────────

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
        max_tokens: 850,
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
            (item: { type?: string; text?: string }) => item?.type === "text"
          )
          .map((item: { text?: string }) => item.text ?? "")
          .join("\n\n")
          .trim()
      : "";

    if (!text) {
      console.error("Mirror API returned no text:", data);
      return null;
    }

    return text;
  } catch (error) {
    console.error("Mirror API request failed:", error);
    return null;
  }
}

// ─── Main ──────────────────────────────────────────

export async function runMirrorSynthesis(
  userId: string,
  weekNumber: number,
  dayNumber: number,
  tier: "lite" | "full" = "full"
): Promise<MirrorResponseDTO | null> {
  const existing = await prisma.mirror_responses.findFirst({
    where: {
  user_id: userId,
  week_number: weekNumber,
  day_number: dayNumber,
  tier,
},
    select: {
      id: true,
      user_id: true,
      week_number: true,
      day_number: true,
      output: true,
      tier: true,
      created_at: true,
    },
  });

  if (existing) {
    return {
      id: existing.id,
      userId: existing.user_id,
      weekNumber: existing.week_number,
      dayNumber: existing.day_number,
      output: existing.output,
      tier: existing.tier as "lite" | "full",
      createdAt: existing.created_at.toISOString(),
    };
  }

  const mode: "lite" | "full" = tier;

  const [prewaveResponses, allJourneyCompletions] = await Promise.all([
    prisma.prewave_responses.findMany({
      where: { user_id: userId },
      orderBy: { question_index: "asc" },
      select: {
        response: true,
      },
    }),
    prisma.prompt_completions.findMany({
      where: {
        user_id: userId,
      },
      orderBy: { created_at: "asc" },
      select: {
        response: true,
        created_at: true,
        day_prompts: {
          select: {
            journey_days: {
              select: {
                day_number: true,
                journey_weeks: {
                  select: {
                    week_number: true,
                  },
                },
              },
            },
          },
        },
      },
    }),
  ]);

  const prewaveTexts = prewaveResponses
    .map((r) => r.response?.trim())
    .filter((value): value is string => Boolean(value))
    .slice(0, 6);

  const priorJourneyResponses = allJourneyCompletions
    .filter((c) => {
      const completionWeek =
        c.day_prompts?.journey_days?.journey_weeks?.week_number ?? null;
      const completionDay = c.day_prompts?.journey_days?.day_number ?? null;

      if (completionWeek === null || completionDay === null) return false;

      if (completionWeek < weekNumber) return true;
      if (completionWeek === weekNumber && completionDay < dayNumber) return true;

      return false;
    })
    .map((c) => c.response?.trim())
    .filter((value): value is string => Boolean(value))
    .slice(-24);

  const currentDayResponses = allJourneyCompletions
    .filter((c) => {
      const completionWeek =
        c.day_prompts?.journey_days?.journey_weeks?.week_number ?? null;
      const completionDay = c.day_prompts?.journey_days?.day_number ?? null;

      return completionWeek === weekNumber && completionDay === dayNumber;
    })
    .map((c) => c.response?.trim())
    .filter((value): value is string => Boolean(value))
    .slice(-8);

  if (
    prewaveTexts.length === 0 &&
    priorJourneyResponses.length === 0 &&
    currentDayResponses.length === 0
  ) {
    return null;
  }

  const prompt = buildPrompt({
    prewaveResponses: prewaveTexts,
    priorJourneyResponses,
    currentDayResponses,
    weekNumber,
    dayNumber,
    tier: mode,
  });

  const output = await callMirrorAPI(prompt);

  if (!output) {
    return null;
  }

  const saved = await prisma.mirror_responses.upsert({
  where: {
    user_id_week_number_day_number: {
      user_id: userId,
      week_number: weekNumber,
      day_number: dayNumber,
    },
  },
  update: {
    output,
    tier: mode,
    patterns_detected: [],
    contradictions: [],
    input_snapshot: {
      prewaveCount: prewaveTexts.length,
      priorJourneyCount: priorJourneyResponses.length,
      currentDayCount: currentDayResponses.length,
    },
  },
  create: {
    user_id: userId,
    week_number: weekNumber,
    day_number: dayNumber,
    output,
    patterns_detected: [],
    contradictions: [],
    input_snapshot: {
      prewaveCount: prewaveTexts.length,
      priorJourneyCount: priorJourneyResponses.length,
      currentDayCount: currentDayResponses.length,
    },
    tier: mode,
  },
  select: {
    id: true,
    user_id: true,
    week_number: true,
    day_number: true,
    output: true,
    tier: true,
    created_at: true,
  },
});

  return {
    id: saved.id,
    userId: saved.user_id,
    weekNumber: saved.week_number,
    dayNumber: saved.day_number,
    output: saved.output,
    tier: saved.tier as "lite" | "full",
    createdAt: saved.created_at.toISOString(),
  };
}

// ─── History ───────────────────────────────────────

export async function getMirrorHistory(userId: string) {
  const rows = await prisma.mirror_responses.findMany({
    where: { user_id: userId },
    orderBy: { created_at: "desc" },
    select: {
      id: true,
      user_id: true,
      week_number: true,
      day_number: true,
      output: true,
      tier: true,
      created_at: true,
    },
  });

  return rows.map((r) => ({
    id: r.id,
    userId: r.user_id,
    weekNumber: r.week_number,
    dayNumber: r.day_number,
    output: r.output,
    tier: r.tier as "lite" | "full",
    createdAt: r.created_at.toISOString(),
  }));
}