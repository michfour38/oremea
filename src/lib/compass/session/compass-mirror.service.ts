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

The participant has answered eight goal-setting areas and has not chosen a focus yet.

Reflect what stands out across their actual answers while preserving the boundary between observation and interpretation.

Your job:
- notice the strongest 2-4 repetitions, explicit connections, contrasts, or distinct points of attention
- stay close to the participant's own language
- connect answers only when the participant supplied the connection or the relationship is directly supported by what they wrote
- keep separate things separate when the participant has not connected them
- preserve every goal as valid context
- leave the choice of focus entirely with the participant

Inference boundary:
- do not manufacture a unifying explanation merely because several answers are present
- do not invent a tension between two things the participant named unless they described that tension themselves
- do not turn a possible relationship into a factual explanation
- do not use "by implication" to extend a goal into an area the participant did not connect to it
- do not say "both are really about", "what this is actually about", "this shows who you really are", or similar interpretive finishing moves
- when a connection is plausible but not explicit, either leave it separate or phrase it lightly as a possibility without building further conclusions on it

Prefer recognition grounded in evidence:
- quote or closely echo a revealing phrase, correction, sequence, contrast, or repeated wording from the participant
- a small detail in their wording may be more useful than a broad theory about them
- a strong reflection may contain several separate observations that remain separate

Write 80-140 words.
Use short paragraphs.
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

Compass is a goal-setting and movement product. The participant chose their own area of focus and then answered the Descent questions.

Synthesize what became visible without deciding for them.

Use:
- all eight area answers as context
- the participant's selected area as authoritative focus
- every Descent answer

Look for:
- what kept showing up
- what gained weight as they went deeper
- connections with their other stated goals
- real tensions that remain active
- the clearest reality their own words now make visible

Several truths may coexist. Keep them together without forcing one explanation.

Write 3-5 short paragraphs.
Stay close to the participant's own wording.
Be specific, direct, human, and easy to read.
Do not diagnose.
Do not prescribe action yet.
Do not tell them what their priority should be.
Do not use headings.
Do not use abstract coaching language.
Do not over-explain.

End with exactly one natural question that gives the participant something real to respond to in Discussion. The question should arise from their own words and the strongest unresolved point or connection. Do not begin it with "if".

SELECTED AREA:
${selectedAreaLabel}

8 AREA ANSWERS:
${areaResponses
  .map((response) => `${AREA_LABELS[response.area]}: ${response.answer}`)
  .join("\n\n")}

DESCENT:
${recursiveLayers
  .map(
    (layer) =>
      `Layer ${layer.layer}\nQuestion: ${layer.question}\nAnswer: ${layer.answer}`,
  )
  .join("\n\n")}
`.trim()
}
