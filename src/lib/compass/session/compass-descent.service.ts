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
Every layer asks why the participant's immediately previous answer matters.

The Descent moves straight down one living thread:
chosen goal -> why it matters -> why that reason matters -> why that reason matters -> deeper -> deeper -> root.

This repetition is intentional. Do not escape the repetition by changing the lens. The seven questions serve the purpose of digging beneath each new reason until the root becomes visible.

QUESTION RULES
- name the actual phrase, condition, relationship, outcome, or reason the participant just gave
- ask why that specific thing matters or why it is important to them
- follow the newest reason in the answer, especially the reason after words such as "because", "so that", or "which means"
- when the answer contains several examples, ask why having, meeting, creating, or experiencing those things matters to them
- when the answer names both a desired condition and a pressure it would end, follow whichever one the participant made central in the wording
- keep the question concise and natural enough to sit directly above a text box

DO NOT CHANGE THE DIG INTO POSSIBILITY
- do not ask what the answer would make possible
- do not ask what it would give them room to be, do, or experience
- do not ask what comes next, what they should do, what they picture, or what future it creates
- do not ask about "weight", what something "carries", or abstract coaching language
- do not introduce identity, purpose, values, freedom, safety, meaning, tension, or another theme unless the participant just named it
- do not vary the question merely to sound clever or less repetitive
- do not steer back toward the original area after the participant's answer has moved deeper
- do not coach, diagnose, motivate, interpret, or supply the answer inside the question

Natural forms:
- Why is ___ so important to you?
- Why does ___ matter to you?
- What is it about ___ that matters to you?
- Why does it matter to you that ___?

Use the form that fits the participant's actual wording. Reusing one of these forms across layers is correct when it keeps the dig clean.

Example:
Previous answer: "meeting all the needs and wants of my family"
Correct next question: "Why is meeting all the needs and wants of your family so important to you?"
Incorrect next question: "What would meeting all the needs and wants of your family make possible for you?"

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
    return parsed && isRootDigQuestion(parsed)
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

function isRootDigQuestion(question: string): boolean {
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

  if (changesLens) return false

  return (
    normalized.includes("why") ||
    normalized.includes("matter") ||
    normalized.includes("important") ||
    normalized.includes("underneath")
  )
}

function fallbackQuestion(
  layer: number,
  selectedAreaLabel: string,
  sourceAnswer: string,
): string {
  const focus = extractFocusPhrase(sourceAnswer)

  if (focus) {
    return `Why is “${focus}” so important to you?`
  }

  return layer === 1
    ? `Why does ${selectedAreaLabel.toLowerCase()} matter to you right now?`
    : "Why does that matter to you?"
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
