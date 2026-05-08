import { prisma } from "@/lib/prisma";

export type EntryMirrorType = "female" | "male" | "neutral";

export interface EntryMirrorQuestion {
  key: string;
  text: string;
}

export interface EntryMirrorOutputDTO {
  id: string;
  sessionId: string;
  output: string;
  questions: string[];
  themesDetected: string[];
  tensionsDetected: string[];
  createdAt: string;
}

const ENTRY_QUESTIONS: Record<EntryMirrorType, EntryMirrorQuestion[]> = {
  female: [
    {
      key: "past_connections_common",
      text: "What do your past connections have in common — before things go wrong?",
    },
    {
      key: "early_ignored_signal",
      text: "What did you feel early… that you later ignored?",
    },
    {
      key: "fastest_pull",
      text: "What kind of energy pulls you in fastest?",
    },
    {
      key: "adjusting_point",
      text: "At what point do you start adjusting to keep the connection?",
    },
    {
      key: "slightly_off_response",
      text: "What do you do when something feels slightly off?",
    },
    {
      key: "speak_or_wait",
      text: "Do you speak early… or wait and hope it resolves?",
    },
    {
      key: "maintaining",
      text: "What are you trying to maintain — connection, potential, or peace?",
    },
    {
      key: "avoid_saying",
      text: "What do you avoid saying when something matters?",
    },
    {
      key: "quiet_or_clear",
      text: "What feels easier — staying quiet or being clear?",
    },
    {
      key: "protecting_from_feeling",
      text: "What are you trying not to feel?",
    },
    {
      key: "acted_earlier",
      text: "What would change if you acted earlier?",
    },
    {
      key: "notice_sooner",
      text: "What would you need to notice sooner?",
    },
    {
      key: "no_longer_explain",
      text: "What would you no longer explain away?",
    },
    {
      key: "first_clarity",
      text: "What would you choose if you trusted your first clarity?",
    },
  ],

  male: [
    {
      key: "initial_attraction",
      text: "What initially attracts you — looks, energy, attention, ease?",
    },
    {
      key: "know_interested",
      text: "When do you know you’re interested?",
    },
    {
      key: "interest_shift",
      text: "When do you start losing interest?",
    },
    {
      key: "what_changes",
      text: "What changes — in them, or in you?",
    },
    {
      key: "needing_space",
      text: "At what point do you start needing space?",
    },
    {
      key: "pressure_point",
      text: "What makes you feel pressured, even if nothing is said?",
    },
    {
      key: "when_real",
      text: "When things get more real, what happens inside you?",
    },
    {
      key: "consistent_or_pull_back",
      text: "Do you stay consistent… or do you start pulling back?",
    },
    {
      key: "harder_than_should",
      text: "What feels harder than it should — consistency, emotional openness, responsibility, or clarity?",
    },
    {
      key: "avoided_conversation",
      text: "What conversations do you delay or avoid?",
    },
    {
      key: "should_say",
      text: "What do you know you should say… but don’t?",
    },
    {
      key: "vague_or_direct",
      text: "What feels easier — staying vague, or being direct?",
    },
    {
      key: "consistent_after_attraction",
      text: "What would it look like to stay consistent after attraction?",
    },
    {
      key: "clear_early",
      text: "What would it take to be clear early instead of vague later?",
    },
    {
      key: "responsibility_point",
      text: "Where do you need to take responsibility instead of stepping back?",
    },
    {
      key: "pulling_back",
      text: "What are you actually avoiding by not showing up fully?",
    },
  ],

  neutral: [
    {
      key: "beneath_surface",
      text: "What do your past connections have in common — beneath the surface?",
    },
    {
      key: "right_early",
      text: "What tends to feel right early on?",
    },
    {
      key: "early_notice",
      text: "What do you notice… but don’t act on?",
    },
    {
      key: "realise_off",
      text: "When do you realise something is off?",
    },
    {
      key: "override",
      text: "What do you tend to override early?",
    },
    {
      key: "explain_away",
      text: "What do you explain away?",
    },
    {
      key: "tell_yourself_to_stay",
      text: "What do you tell yourself to stay?",
    },
    {
      key: "role_in_connection",
      text: "What role do you tend to take in connection?",
    },
    {
      key: "move_style",
      text: "Do you move toward, adapt, observe, lead, stabilise, or withdraw?",
    },
    {
      key: "unclear_response",
      text: "When things become unclear, what do you do?",
    },
    {
      key: "consistency_over_time",
      text: "How consistent is your behaviour over time?",
    },
    {
      key: "allow_continue",
      text: "What do you allow to continue longer than you should?",
    },
    {
      key: "manage_or_address",
      text: "What feels easier to manage than to address?",
    },
    {
      key: "clarity_vs_connection",
      text: "Where do you prioritise connection over clarity?",
    },
    {
      key: "act_earlier",
      text: "What would it look like to act earlier?",
    },
    {
      key: "trusted_first_clarity",
      text: "What would change if you trusted your first clarity?",
    },
    {
      key: "stop_negotiating",
      text: "What would you stop negotiating?",
    },
  ],
};

export function getEntryMirrorQuestions(entryType: EntryMirrorType) {
  return ENTRY_QUESTIONS[entryType];
}

function buildEntryMirrorPrompt(params: {
  entryType: EntryMirrorType;
  firstName?: string | null;
  responses: {
    questionText: string;
    response: string;
  }[];
}) {
  const { entryType, firstName, responses } = params;

  return `
You are the Oremea Entry Mirror.

You reflect from the user's entry reflection answers only.

Entry path: ${entryType}
First name: ${firstName || "Unknown"}

This is not a quiz.
This is not an archetype test.
This is not therapy.
This is not diagnosis.
This is not advice.

Your job is to reflect what is actually present in the user's own responses.

You must use only:
1. the user's entry reflection answers
2. repeated emotional language
3. tension, contradiction, avoidance, clarity, attraction, protection, or choice that appears in the answers

Do not compress.
Do not categorize the person.
Do not assign a fixed type.
Do not use generic relationship advice.
Do not pretend to know more than the answers support.
Do not say "you are the kind of person who..."
Do not make claims that are not grounded in their actual words.

WRITE LIKE THIS:

- grounded
- precise
- emotionally accurate
- non-clinical
- non-mystical
- non-generic
- human
- restrained
- direct without being harsh

PROTECT THIS LINE AT ALL COSTS:

Write as though you truly heard the person, not as though you evaluated them.

WHAT TO NOTICE:

- what repeats across their answers
- what they name directly
- what they seem to circle around without fully naming
- where attraction and clarity may separate
- where connection and self-protection may conflict
- where they appear to stay, withdraw, adapt, delay, override, pursue, soften, defend, or wait
- where their own wording carries emotional weight

STRUCTURE:

Use clear section headings.

The output must have exactly these sections:

1. What your answers seem to reveal
2. The tension underneath
3. What may be repeating
4. Two questions worth staying with

SECTION RULES:

"What your answers seem to reveal"
- Start from one specific repeated signal or emotional edge in their answers.
- Reference their actual wording energy.
- Do not flatter.
- Do not overstate.

"The tension underneath"
- Name one real tension or contradiction if present.
- Use phrases like:
  - "Your responses suggest..."
  - "There appears to be..."
  - "One possible tension is..."
  - "A pattern that may be present is..."
- Never use certainty where the answers do not support it.

"What may be repeating"
- Name the possible relational loop.
- Make it concrete.
- Keep it grounded in their answers.
- Do not give a generic pattern.

"Two questions worth staying with"
- End with exactly 2 precise questions.
- The questions must directly relate to what you reflected.
- At least one question must point to the tension between what the user wants and what they protect.
- Avoid "how do you feel" and "what does this mean to you".

USER RESPONSES:

${responses
  .map(
    (item, index) => `
Question ${index + 1}: ${item.questionText}
Answer ${index + 1}: ${item.response}
`
  )
  .join("\n")}
`;
}

async function callEntryMirrorAPI(prompt: string): Promise<string | null> {
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
      console.error("Entry Mirror API error:", data);
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
      console.error("Entry Mirror API returned no text:", data);
      return null;
    }

    return text;
  } catch (error) {
    console.error("Entry Mirror API request failed:", error);
    return null;
  }
}

function extractQuestionsFromOutput(output: string) {
  return output
    .split("\n")
    .map((line) => line.trim())
    .filter((line) => line.endsWith("?"))
    .slice(-2);
}

export async function generateEntryMirror(params: {
  sessionId: string;
}): Promise<EntryMirrorOutputDTO | null> {
  const session = await prisma.entry_mirror_sessions.findUnique({
    where: { id: params.sessionId },
    select: {
      id: true,
      entry_type: true,
      lead_id: true,
      entry_leads: {
        select: {
          first_name: true,
          email: true,
        },
      },
      entry_mirror_responses: {
        orderBy: { response_order: "asc" },
        select: {
          question_text: true,
          response: true,
        },
      },
      entry_mirror_outputs: {
        orderBy: { created_at: "desc" },
        take: 1,
        select: {
          id: true,
          session_id: true,
          output: true,
          questions: true,
          themes_detected: true,
          tensions_detected: true,
          created_at: true,
        },
      },
    },
  });

  if (!session) return null;

  const existing = session.entry_mirror_outputs[0];

  if (existing) {
    return {
      id: existing.id,
      sessionId: existing.session_id,
      output: existing.output,
      questions: existing.questions,
      themesDetected: existing.themes_detected,
      tensionsDetected: existing.tensions_detected,
      createdAt: existing.created_at.toISOString(),
    };
  }

  const cleanResponses = session.entry_mirror_responses
    .map((item) => ({
      questionText: item.question_text.trim(),
      response: item.response.trim(),
    }))
    .filter((item) => item.questionText.length > 0 && item.response.length > 0);

  if (cleanResponses.length < 8) {
    console.error("Entry Mirror requires at least 8 completed responses.");
    return null;
  }

  const entryType = ["female", "male", "neutral"].includes(session.entry_type)
    ? (session.entry_type as EntryMirrorType)
    : "neutral";

  const prompt = buildEntryMirrorPrompt({
    entryType,
    firstName: session.entry_leads.first_name,
    responses: cleanResponses,
  });

  const output = await callEntryMirrorAPI(prompt);

  if (!output) return null;

  const questions = extractQuestionsFromOutput(output);

  const saved = await prisma.entry_mirror_outputs.create({
    data: {
      session_id: session.id,
      output,
      questions,
      themes_detected: [],
      tensions_detected: [],
      input_snapshot: {
        entryType,
        leadId: session.lead_id,
        responseCount: cleanResponses.length,
        questionTexts: cleanResponses.map((item) => item.questionText),
      },
    },
    select: {
      id: true,
      session_id: true,
      output: true,
      questions: true,
      themes_detected: true,
      tensions_detected: true,
      created_at: true,
    },
  });

  await prisma.entry_mirror_sessions.update({
    where: { id: session.id },
    data: {
      status: "completed",
      completed_at: new Date(),
      mirror_generated_at: new Date(),
    },
  });

  return {
    id: saved.id,
    sessionId: saved.session_id,
    output: saved.output,
    questions: saved.questions,
    themesDetected: saved.themes_detected,
    tensionsDetected: saved.tensions_detected,
    createdAt: saved.created_at.toISOString(),
  };
}