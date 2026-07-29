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

Do not switch lenses or introduce a new theme merely because the layer number changed.
Do not steer the participant back toward the original selected area when their own answer has moved somewhere else.
Do not use a fixed sequence of meaning, possibility, contrast, purpose, action, identity, or future-planning questions.
Do not ask what they should do next.
Do not coach, diagnose, motivate, interpret their psychology, or tell them what their answer means.
Do not supply the answer inside the question.
Do not introduce a value, identity, need, motive, tension, or conclusion they did not express.

Use the participant's immediately previous answer as the active thread.
Earlier layers are context only: use them to preserve continuity and avoid circling back upward.

Write one natural conversational question that:
- clearly grows from the participant's last answer
- acknowledges the actual thing they just said by naming it naturally where useful
- asks beneath it, toward why that matters to them
- sounds like a perceptive human continuing a conversation
- varies its phrasing naturally instead of repeating "why does that matter?"
- stays concise enough to sit directly above a text box

Useful natural forms include, only when they fit the participant's words:
- Why does being able to ___ matter to you?
- What is it about ___ that matters so much to you?
- When you say ___, what makes that important to you?
- What would ___ give you that matters here?
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
      return fallbackQuestion(layer, selectedAreaLabel)
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
    return parsed || fallbackQuestion(layer, selectedAreaLabel)
  } catch (error) {
    console.error("Compass Descent question request failed:", error)
    return fallbackQuestion(layer, selectedAreaLabel)
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

function fallbackQuestion(layer: number, selectedAreaLabel: string): string {
  return layer === 1
    ? `Why does ${selectedAreaLabel.toLowerCase()} matter to you right now?`
    : "What is it about what you just described that matters to you?"
}
