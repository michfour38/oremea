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
      : "What is it about that that matters to you?"
  }

  const priorDescent = recursiveLayers
    .map(
      (item) =>
        `Layer ${item.layer}\nQuestion: ${item.question}\nAnswer: ${item.answer}`,
    )
    .join("\n\n")

  const prompt = `
You write one question for The Descent inside Compass, Oremea's goal-setting product.

The Descent is a seven-layer recursive dig for the root reason beneath a participant's chosen goal.

The selected area is the doorway into the dig, not a category the later answers must remain inside.
The participant's immediately previous answer determines where the next question goes.

${OREMEA_EVIDENCE_BOUNDARY}

GOVERNING RULE
Every new layer follows the reason contained in the participant's immediately previous answer and asks naturally why THAT matters.

The Descent moves straight down one living thread:
chosen goal -> why it matters -> why that reason matters -> why that reason matters -> deeper -> deeper -> root.

A question that could follow almost any answer fails.
The question must name one concrete phrase, condition, choice, image, or consequence from the participant's immediately previous answer.
When the answer names both a desired condition and the pressure it would end, follow the desired condition unless the participant clearly made the pressure itself the active thread.
When the participant gives several concrete examples, ask what those examples would make possible together rather than repeating a generic "what matters about that?"

Do not switch lenses or introduce a new theme merely because the layer number changed.
Do not steer the participant back toward the original selected area when their own answer has moved somewhere else.
Do not use a fixed sequence of meaning, possibility, contrast, purpose, action, identity, or future-planning questions.
Do not ask what they should do next.
Do not coach, diagnose, motivate, interpret their psychology, or tell them what their answer means.
Do not supply the answer inside the question.
Do not introduce a value, identity, need, motive, tension, or conclusion they did not express.
Do not return a generic question such as "What is it about what you described that matters?" when the participant supplied language you can follow directly.

Use the participant's immediately previous answer as the active thread.
Earlier layers are context only: use them to preserve continuity and avoid circling back upward.

Write one natural conversational question that:
- clearly grows from the participant's last answer
- names the actual thing they just said
- asks beneath it, toward why that matters or what it would make possible
- sounds like a perceptive human continuing a conversation
- varies its phrasing naturally
- stays concise enough to sit directly above a text box

Useful natural forms include, only when they fit the participant's words:
- When you say ___, what would that give you room to be or do?
- Why does being able to ___ matter to you?
- What is it about ___ that matters so much to you?
- What would ___ make possible that matters here?
- What is underneath wanting ___?

Do not copy these forms mechanically.

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
        temperature: 0.4,
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
    return parsed || fallbackQuestion(layer, selectedAreaLabel, sourceAnswer)
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

function fallbackQuestion(
  layer: number,
  selectedAreaLabel: string,
  sourceAnswer: string,
): string {
  if (layer === 1) {
    return `Why does ${selectedAreaLabel.toLowerCase()} matter to you right now?`
  }

  const focus = extractFocusPhrase(sourceAnswer)

  return focus
    ? `When you say “${focus},” what would that give you room to be, do, or experience?`
    : "What would what you just described make possible for you?"
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
    return words.length <= 8 && part.length <= 64
  })

  if (concise) return concise

  const words = normalized.split(/\s+/).filter(Boolean)
  return words.slice(0, 8).join(" ").replace(/[.!?,;:]+$/, "") || null
}
