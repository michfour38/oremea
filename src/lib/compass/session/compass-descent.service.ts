import { OREMEA_EVIDENCE_BOUNDARY } from "@/src/lib/oremea/evidence-boundary"
import { MIRROR_AUTHORING_STANDARD } from "@/src/lib/oremea/mirror-authoring"

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
    if (layer === 1) {
      return `Why does ${selectedAreaLabel.toLowerCase()} matter to you right now?`
    }

    throw new Error("Compass Descent has no previous answer to follow.")
  }

  const priorDescent = recursiveLayers
    .map(
      (item) =>
        `Layer ${item.layer}\nQuestion: ${item.question}\nAnswer: ${item.answer}`,
    )
    .join("\n\n")

  const prompt = buildPrompt({
    layer,
    selectedAreaLabel,
    selectedAreaAnswer,
    sourceAnswer,
    priorDescent,
  })

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
      throw new Error("Mirror could not generate the next Descent question.")
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

    if (
      !parsed ||
      !isValidDescentQuestion(parsed, recursiveLayers, sourceAnswer)
    ) {
      throw new Error("Mirror returned a question outside the Descent boundary.")
    }

    return parsed
  } catch (error) {
    console.error("Compass Descent question request failed:", error)
    throw error
  }
}

function buildPrompt({
  layer,
  selectedAreaLabel,
  selectedAreaAnswer,
  sourceAnswer,
  priorDescent,
}: {
  layer: number
  selectedAreaLabel: string
  selectedAreaAnswer: string
  sourceAnswer: string
  priorDescent: string
}) {
  return `
You are Mirror asking the next question in The Descent inside Compass, Oremea's goal-setting product.

The Descent is seven consecutive why-questions. Each answer becomes the reason held by the next why-question.

${MIRROR_AUTHORING_STANDARD}

${OREMEA_EVIDENCE_BOUNDARY}

THE DESCENT JOB
- identify the thought or thoughts that directly answer the immediately previous why-question
- position is irrelevant: the direct answer may appear first, in the middle, or last
- a direct answer is the thought that most naturally completes "Because..."
- if several thoughts directly answer the question, hold them together as one compound answer
- use the full response to understand references and cadence, but follow only the direct answer as the inquiry thread
- ask one why-question beneath that answer

HUMAN WITHOUT LEADING
- sound as though Mirror heard the person, not as though software inserted their sentence into a template
- compress awkward clauses while preserving the participant's meaning
- empathy must come through accurate language and natural cadence
- preserve an emotion only when the participant explicitly names that emotion in the direct answer
- never infer or label frustration, hurt, exclusion, anger, grief, fear, relief, longing, pain, difficulty, or intensity from tone, punctuation, a rhetorical question, or surrounding context
- never add "so", "deeply", "painful", "hard to carry", or another intensifier the participant did not supply
- a rhetorical question may clarify a reference, but it is not evidence of an emotion

KEEP THE THREAD
- use only why
- the newest direct answer remains the subject
- preserve the participant's meaning and living language
- rhetorical questions, examples, commentary, blame, speculation, and side explanations must not become the next thread
- do not investigate why another person behaved as they did
- do not ask what the answer makes possible, what comes next, what they should do, or what future it creates
- do not diagnose, interpret the whole person, or supply the answer inside the question
- do not return to the original area once the participant's answer has moved deeper
- do not repeat the exact wording or opening structure of an earlier question when a natural alternative is available

RABBIT-HOLE GUARD
Do not ask for the cause of a feeling or belief merely because the answer contains one.
Do not ask why another person acted as they did.
Ask why the participant's direct answer mattered to them.

EXAMPLE
Previous question: "Why did feeling left out matter to you?"
Answer: "I felt like I didn't deserve what they had. Why wouldn't my parents just work smarter?"
Direct answer: "I felt like I didn't deserve what they had."
Context used only to resolve "they": the other kids.
Next question: "Why did feeling undeserving of what the other kids had matter to you?"
Do not ask: "Why was it so frustrating...?"
Do not ask: "Why did you feel...?"
Do not ask: "Why wouldn't your parents...?"

Return JSON only:
{"question":"..."}

CURRENT LAYER TO ASK: ${layer} of 7
STARTING AREA: ${selectedAreaLabel}
ORIGINAL CHOSEN-GOAL ANSWER:
${selectedAreaAnswer}

IMMEDIATELY PREVIOUS ANSWER:
${sourceAnswer}

EARLIER DESCENT CONTEXT:
${priorDescent || "None yet. This is Layer 1."}
`.trim()
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

function isValidDescentQuestion(
  question: string,
  recursiveLayers: CompassRecursiveLayer[],
  sourceAnswer: string,
): boolean {
  const normalized = question.trim().toLowerCase()
  const source = sourceAnswer.trim().toLowerCase()

  if (!normalized.startsWith("why") || !normalized.endsWith("?")) return false

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

  const changesThread = [
    "why did you feel",
    "why do you feel",
    "why did you believe",
    "why do you believe",
    "why did you think",
    "why do you think",
    "why did you conclude",
    "why did you react",
    "why wouldn't your",
    "why would your",
  ].some((phrase) => normalized.startsWith(phrase))

  const inferredLabels = [
    "frustrat",
    "hurt",
    "painful",
    "angry",
    "grief",
    "fear",
    "frighten",
    "relief",
    "longing",
    "hard to carry",
  ].some(
    (label) => normalized.includes(label) && !source.includes(label),
  )

  const inventedIntensity = [" so ", "deeply", "extremely"].some(
    (word) => normalized.includes(word) && !source.includes(word.trim()),
  )

  if (changesLens || changesThread || inferredLabels || inventedIntensity) {
    return false
  }

  return !recursiveLayers.some(
    (item) => item.question.trim().toLowerCase() === normalized,
  )
}
