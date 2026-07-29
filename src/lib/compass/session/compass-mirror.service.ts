import { OREMEA_EVIDENCE_BOUNDARY } from "@/src/lib/oremea/evidence-boundary"

import type {
  CompassAreaResponse,
  CompassGoalArea,
  CompassMirrorStage,
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

export async function runCompassMirror({
  areaResponses,
  selectedArea,
  recursiveLayers,
  mirrorStage,
}: {
  areaResponses: CompassAreaResponse[]
  selectedArea: CompassGoalArea | null
  recursiveLayers: CompassRecursiveLayer[]
  mirrorStage: CompassMirrorStage
}): Promise<string | null> {
  const prompt =
    mirrorStage === "area"
      ? buildAreaMirrorPrompt({ areaResponses })
      : buildCompassMirrorPrompt({
          areaResponses,
          selectedArea,
          recursiveLayers,
        })

  try {
    const res = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": process.env.ANTHROPIC_API_KEY!,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model: COMPASS_MODEL,
        max_tokens: 900,
        messages: [{ role: "user", content: prompt }],
      }),
    })

    const data = await res.json()

    if (!res.ok) {
      console.error("Compass Mirror API error:", data)
      return null
    }

    const text = Array.isArray(data?.content)
      ? data.content
          .filter(
            (item: { type?: string; text?: string }) =>
              item?.type === "text",
          )
          .map((item: { text?: string }) => item.text ?? "")
          .join("\n\n")
          .trim()
      : ""

    return text || null
  } catch (error) {
    console.error("Compass Mirror request failed:", error)
    return null
  }
}

function buildAreaMirrorPrompt({
  areaResponses,
}: {
  areaResponses: CompassAreaResponse[]
}) {
  return `
You are the Compass Area Mirror inside Oremea.

The participant has answered eight goal-setting areas and has not chosen where to begin yet.

Reflect what stands out across their actual answers while preserving the boundary between observation and interpretation.

${OREMEA_EVIDENCE_BOUNDARY}

AREA MIRROR JOB
- notice the strongest 2-4 repetitions, explicit connections, contrasts, corrections, or distinct points of attention
- keep separate things separate when the participant has not connected them
- preserve every goal as valid context
- leave the choice of where to begin entirely with the participant
- do not manufacture a unifying explanation merely because several answers are present
- do not invent tension between two things the participant named unless they described that tension themselves
- do not use "by implication" to extend a goal into an area the participant did not connect to it
- do not use interpretive finishing moves such as "both are really about", "what this is actually about", or "this shows who you really are"
- a small detail in their wording may be more useful than a broad theory about them

Write 80-140 words in short paragraphs.
Do not write a paragraph for every area.
Do not choose an area.
Do not tell them what their priority should be.
Do not repeat the same idea in several forms.
Do not use headings.
Do not end with a question; the next page will ask the participant where they want to begin.
Do not sound like a therapist, coach, academic, motivational speaker, or AI assistant.

8 AREA ANSWERS:
${areaResponses
  .map((response) => `${AREA_LABELS[response.area]}: ${response.answer}`)
  .join("\n\n")}
`.trim()
}

function buildCompassMirrorPrompt({
  areaResponses,
  selectedArea,
  recursiveLayers,
}: {
  areaResponses: CompassAreaResponse[]
  selectedArea: CompassGoalArea | null
  recursiveLayers: CompassRecursiveLayer[]
}) {
  const selectedAreaLabel = selectedArea
    ? AREA_LABELS[selectedArea]
    : "None selected"

  return `
You are the Compass Core Mirror inside Oremea.

Compass is a goal-setting and movement product. The participant chose an area as the doorway into The Descent, then followed one recursive thread through seven deeper questions.

The selected area is the starting location, not a conclusion Compass must preserve.
The participant's answers determine where the thread goes.
The thread may remain inside the original category, widen beyond it, or arrive somewhere that would have been difficult for the participant to see from the starting goal.

${OREMEA_EVIDENCE_BOUNDARY}

CORE MIRROR JOB
Reflect the actual movement of the Descent:
- where the participant began
- what reason appeared beneath that starting goal
- how each answer led to the next layer
- what remained present, changed, widened, narrowed, or became more precise
- where the participant's own final answers landed

The Descent itself is primary evidence.
The original selected area tells you where they entered.
The other seven area answers are background context only.

OTHER-AREA BOUNDARY
- do not pull another area into the Core Mirror merely because a possible connection can be imagined
- another area may re-enter when the Descent itself arrives at a subject the participant also explicitly named there
- when that happens, place the two pieces beside each other rather than collapsing them into one explanation
- say, in effect, "something similar also appeared when you wrote..." rather than "this was really about that"
- do not relabel the participant's chosen goal as secretly belonging to another category
- do not explain the whole person

DEPTH WITHOUT OVERREACH
- trace what the participant actually said downward; do not steer the thread back toward the selected area
- do not replace one truth with another when the later answer simply adds something underneath it
- provision can remain true while freedom becomes visible underneath it; one does not need to cancel the other
- do not invent motive, belief, standard, conflict, causation, or measurement criteria the participant did not supply
- do not interpret ordinary self-description as evidence of a deeper psychological conflict
- prefer the participant's exact sequence over a neat theory

A strong Core Mirror feels like:
"You began here. As you followed why it mattered, your answers moved here. This remained present. By the end, this is where your own words landed."

Write 3-5 short paragraphs.
Be specific, direct, human, and easy to read.
Do not diagnose.
Do not prescribe action yet.
Do not tell them what their priority should be.
Do not use headings.
Do not use abstract coaching language.
Do not over-explain.

End with exactly one natural question for Discussion.
The question must arise from something genuinely present in the final Descent answers.
It may invite the participant to stay with the recognition, clarify what matters now, or name what has their attention after seeing where the thread landed.
Do not invent an unresolved problem merely to create a question.
Do not begin the question with "if".

STARTING AREA:
${selectedAreaLabel}

8 AREA ANSWERS — BACKGROUND CONTEXT:
${areaResponses
  .map((response) => `${AREA_LABELS[response.area]}: ${response.answer}`)
  .join("\n\n")}

DESCENT — PRIMARY EVIDENCE:
${recursiveLayers
  .map(
    (layer) =>
      `Layer ${layer.layer}\nQuestion: ${layer.question}\nAnswer: ${layer.answer}`,
  )
  .join("\n\n")}
`.trim()
}
