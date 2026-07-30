import { OREMEA_EVIDENCE_BOUNDARY } from "@/src/lib/oremea/evidence-boundary"

import type {
  CompassAreaResponse,
  CompassGoalArea,
  CompassRecursiveLayer,
} from "./session-types"

const AREA_LABELS: Record<CompassGoalArea, string> = {
  relationships: "Relationships",
  income: "Income",
  health: "Health",
  spirituality: "Spirituality",
  investments: "Investments",
  network: "Network",
  knowledge: "Knowledge",
  lifestyle: "Lifestyle",
}

const COMPASS_MODEL = "claude-sonnet-4-5-20250929"

export async function generateCompassDescentQuestion({
  layer,
  selectedArea,
  areaResponses,
  recursiveLayers,
  currentAnswer,
}: {
  layer: number
  selectedArea: CompassGoalArea
  areaResponses: CompassAreaResponse[]
  recursiveLayers: CompassRecursiveLayer[]
  currentAnswer?: string
}): Promise<string> {
  const selectedAreaLabel = AREA_LABELS[selectedArea]
  const selectedAreaAnswer =
    areaResponses.find((response) => response.area === selectedArea)?.answer.trim() ?? ""

  const previousLayer = recursiveLayers[recursiveLayers.length - 1]
  const sourceAnswer =
    currentAnswer?.trim() || previousLayer?.answer.trim() || selectedAreaAnswer

  if (!sourceAnswer) {
    return layer === 1
      ? `Why does ${selectedAreaLabel.toLowerCase()} matter to you right now?`
      : "Why does that matter to you?"
  }

  const priorDescent = recursiveLayers
    .map(
      (item) =>
        `Layer ${item.layer}\nQuestion: ${item.question}\nAnswer: ${item.answer}`,
    )
    .join("\n\n")

  const prompt = `
You write one question for The Descent inside Compass, Oremea's goal-setting product.

The Descent is a deliberately repetitive seven-question dig for the root reason beneath a participant's chosen goal.

The selected area is the doorway into the dig, not a category the later answers must remain inside.
The participant's immediately previous answer determines where the next question goes.

${OREMEA_EVIDENCE_BOUNDARY}

GOVERNING RULE
Every layer asks one clean why-question beneath the participant's immediately previous answer.

The Descent moves straight down one living thread:
chosen goal -> why it matters -> why that reason exists -> why that feeling or belief formed -> deeper -> deeper -> root.

The operation repeats. The sentence frame must follow the grammar and substance of the newest answer.
Do not confuse purposeful repetition with mechanically repeating "Why does it matter to you that..." at every layer.

FOLLOW THE KIND OF ANSWER GIVEN
- goal, condition, or outcome: ask why having or creating that is important
- present frustration or exhaustion: ask why they are tired of that specific experience
- past feeling: ask why they felt that way
- belief or conclusion: ask why they believed it, why it felt true, or why they reached that conclusion
- comparison or exclusion: ask why that experience produced the feeling or belief they just named
- an answer beginning with "because": follow the reason after "because", not the wording before it

QUESTION RULES
- keep the newest reason as the subject of the next question
- preserve the participant's actual language
- ask beneath the answer rather than asking them to justify that the answer matters
- use why throughout the seven layers; vary only enough to fit the answer naturally
- keep the question concise enough to sit directly above a text box

DO NOT CHANGE THE DIG INTO POSSIBILITY
- do not ask what the answer would make possible
- do not ask what it would give them room to be, do, or experience
- do not ask what comes next, what they should do, what they picture, or what future it creates
- do not ask about "weight", what something "carries", or abstract coaching language
- do not introduce identity, purpose, values, freedom, safety, meaning, tension, or another theme unless the participant just named it
- do not steer back toward the original area after the participant's answer has moved deeper
- do not coach, diagnose, motivate, interpret, or supply the answer inside the question
- do not use the same opening stem as the immediately previous question when the answer calls for a different grammatical why-question

Natural forms, chosen by the answer:
- Why is ___ so important to you?
- Why are you tired of ___?
- Why did you feel ___?
- Why did you feel like ___?
- Why did you believe ___?
- Why did ___ feel true to you?
- Why did ___ affect you that way?

EXAMPLE THREAD
Answer: "meeting all the needs and wants of my family"
Question: "Why is meeting all the needs and wants of your family so important to you?"

Answer: "because I'm tired of telling the kids I have no money"
Question: "Why are you tired of telling the kids you have no money?"
Do not ask: "Why does it matter to you that you're tired of telling them?"

Answer: "because that's what I constantly heard from my parents as a kid, and I always felt left out"
Question: "Why did hearing that from your parents make you feel left out?"

Answer: "I felt like I didn't deserve what the other kids had"
Question: "Why did you feel like you didn't deserve what the other kids had?"
Do not ask: "Why does it matter that you felt like you didn't deserve it?"

Return JSON only:
{"question":"..."}

CURRENT LAYER TO ASK: ${layer} of 7
STARTING AREA: ${selectedAreaLabel}
ORIGINAL CHOSEN-GOAL ANSWER:
${selectedAreaAnswer}

IMMEDIATELY PREVIOUS ANSWER — FOLLOW THIS THREAD:
${sourceAnswer}

EARLIER DESCENT CONTEXT:
${priorDescent || "None yet. This is Layer 1."}
`.trim()

  try {
    const response = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": process.env.ANTHROPIC_API_KEY!,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model: COMPASS_MODEL,
        max_tokens: 180,
        temperature: 0.2,
        messages: [{ role: "user", content: prompt }],
      }),
    })

    const data = await response.json()

    if (!response.ok) {
      console.error("Compass Descent question API error:", data)
      return fallbackQuestion(layer, selectedAreaLabel, sourceAnswer)
    }

    const raw = Array.isArray(data?.content)
      ? data.content
          .filter(
            (item: { type?: string; text?: string }) => item?.type === "text",
          )
          .map((item: { text?: string }) => item.text ?? "")
          .join("\n")
          .trim()
      : ""

    const parsed = parseQuestion(raw)
    return parsed && isRootDigQuestion(parsed, recursiveLayers)
      ? parsed
      : fallbackQuestion(layer, selectedAreaLabel, sourceAnswer)
  } catch (error) {
    console.error("Compass Descent question request failed:", error)
    return fallbackQuestion(layer, selectedAreaLabel, sourceAnswer)
  }
}

function parseQuestion(raw: string): string | null {
  if (!raw) return null

  const normalized = raw
    .replace(/^```json\s*/i, "")
    .replace(/^```\s*/i, "")
    .replace(/```$/i, "")
    .trim()

  try {
    const parsed = JSON.parse(normalized) as { question?: unknown }
    return typeof parsed.question === "string" && parsed.question.trim()
      ? parsed.question.trim()
      : null
  } catch {
    return null
  }
}

function isRootDigQuestion(
  question: string,
  recursiveLayers: CompassRecursiveLayer[],
): boolean {
  const normalized = question.trim().toLowerCase()
  if (!normalized) return false

  const changesLens = [
    "make possible",
    "give you room",
    "what would this create",
    "what would that create",
    "what comes next",
    "what do you picture",
    "what would it mean",
    "what does it mean",
    "what does this carry",
    "what does that carry",
    "how much weight",
  ].some((phrase) => normalized.includes(phrase))

  if (changesLens || !normalized.startsWith("why")) return false

  const previousQuestion =
    recursiveLayers[recursiveLayers.length - 1]?.question.trim().toLowerCase() ?? ""
  const mechanicalStems = [
    "why does it matter to you that",
    "why is it important to you that",
  ]

  return !mechanicalStems.some(
    (stem) => normalized.startsWith(stem) && previousQuestion.startsWith(stem),
  )
}

function fallbackQuestion(
  layer: number,
  selectedAreaLabel: string,
  sourceAnswer: string,
): string {
  const cleaned = sourceAnswer
    .trim()
    .replace(/^because\s+/i, "")
    .replace(/[.!?]+$/, "")

  const tiredMatch = cleaned.match(/^i(?:['’]m| am)\s+tired of\s+(.+)/i)
  if (tiredMatch) {
    return `Why are you tired of ${toSecondPerson(tiredMatch[1])}?`
  }

  const feltLikeMatch = cleaned.match(/^i(?:\s+always)?\s+felt like\s+(.+)/i)
  if (feltLikeMatch) {
    return `Why did you feel like ${toSecondPerson(feltLikeMatch[1])}?`
  }

  const feltMatch = cleaned.match(/^i(?:\s+always)?\s+felt\s+(.+)/i)
  if (feltMatch) {
    return `Why did you feel ${toSecondPerson(feltMatch[1])}?`
  }

  const beliefMatch = cleaned.match(/^i\s+(?:believed|thought)\s+(.+)/i)
  if (beliefMatch) {
    return `Why did you believe ${toSecondPerson(beliefMatch[1])}?`
  }

  const focus = extractFocusPhrase(cleaned)

  if (focus) {
    return `Why is ${toSecondPerson(focus)} so important to you?`
  }

  return layer === 1
    ? `Why does ${selectedAreaLabel.toLowerCase()} matter to you right now?`
    : "Why does that matter to you?"
}

function toSecondPerson(input: string): string {
  return input
    .trim()
    .replace(/\bi['’]m\b/gi, "you're")
    .replace(/\bi am\b/gi, "you are")
    .replace(/\bi['’]ve\b/gi, "you've")
    .replace(/\bi['’]d\b/gi, "you'd")
    .replace(/\bmy\b/gi, "your")
    .replace(/\bme\b/gi, "you")
    .replace(/\bi\b/gi, "you")
}

function extractFocusPhrase(input: string): string | null {
  const normalized = input.trim().replace(/\s+/g, " ")
  if (!normalized) return null

  const clauses = normalized
    .split(/[,;]|\s+[—–-]\s+/)
    .map((part) => part.trim().replace(/[.!?]+$/, ""))
    .filter(Boolean)

  const concise = clauses.find((part) => {
    const words = part.split(/\s+/).filter(Boolean)
    return words.length <= 12 && part.length <= 96
  })

  if (concise) return concise

  const words = normalized.split(/\s+/).filter(Boolean)
  return words.slice(0, 12).join(" ").replace(/[.!?,;:]+$/, "") || null
}
