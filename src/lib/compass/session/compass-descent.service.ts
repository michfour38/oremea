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

The Descent is seven consecutive why-questions. Each answer becomes the reason examined by the next why-question.

The selected area begins the descent. After that, the participant's immediately previous answer is the only thread to follow.

${OREMEA_EVIDENCE_BOUNDARY}

GOVERNING RULE
Ask why the participant's newest direct answer matters to them.

The operation remains the same across all seven layers:
chosen goal -> why it matters -> why that answer matters -> why the newest answer matters -> deeper -> deeper -> root.

Vary the wording naturally so the descent does not become seven mechanical repetitions of the same sentence frame. Variation must never change the target or begin a different inquiry.

IDENTIFY THE DIRECT ANSWER FIRST
- separate the response into distinct thoughts
- identify the thought or thoughts that directly answer the immediately previous why-question
- position is irrelevant: the direct answer may appear first, in the middle, or last
- a direct answer is the thought that most naturally completes "Because..."
- if several thoughts directly answer the question, keep them together as one compound answer

TREAT AS CONTEXT, NOT A NEW THREAD
- rhetorical questions
- examples
- commentary
- blame or speculation about another person
- side explanations
- secondary thoughts that do not directly answer the previous why-question

QUESTION RULES
- use only why
- keep the newest direct answer as the subject of the next question
- ask why that answer mattered or was important to the participant
- preserve the participant's language
- remain neutral
- do not add emotional intensity, certainty, significance, pain, depth, causation, or meaning the participant did not state
- keep the question concise enough to sit directly above a text box
- do not repeat the same opening and structure used by the immediately previous question

DO NOT CREATE A RABBIT HOLE
- do not ask why the participant felt, believed, thought, concluded, or reacted that way
- do not investigate why another person behaved as they did
- do not select a rhetorical question or side comment and turn it into the next inquiry
- do not interpret what lies underneath the answer
- do not decide which belief, cause, theme, or emotional direction should be explored
- do not introduce identity, purpose, values, freedom, safety, meaning, tension, or another theme unless the participant named it as the direct answer

DO NOT CHANGE THE DIG INTO POSSIBILITY
- do not ask what the answer would make possible
- do not ask what it would give them room to be, do, or experience
- do not ask what comes next, what they should do, what they picture, or what future it creates
- do not ask about weight, what something carries, or abstract coaching language
- do not coach, diagnose, motivate, or supply the answer inside the question

NATURAL NEUTRAL FORMS
- Why does ___ matter to you?
- Why is ___ important to you?
- Why did it matter to you that ___?
- Why was it important to you that ___?
- Why does that matter to you?
- Why is that important to you?

EXAMPLE THREAD
Previous question: "Why does meeting all the needs and wants of your family matter to you?"
Answer: "Because I'm tired of telling the kids I have no money for things."
Next question: "Why is it important to you that you no longer have to tell the kids there is no money for things?"

Previous question: "Why is that important to you?"
Answer: "Because that is what I constantly heard from my parents as a kid. I always felt left out."
Direct compound answer: "That is what I constantly heard from my parents as a kid; I always felt left out."
Next question: "Why did hearing that and feeling left out matter to you?"

Previous question: "Why did that matter to you?"
Answer: "Why wouldn't my parents just work smarter? I felt like I didn't deserve what the other kids had."
Direct answer: "I felt like I didn't deserve what the other kids had."
Context to ignore: "Why wouldn't my parents just work smarter?"
Next question: "Why did it matter to you that you felt like you didn't deserve what the other kids had?"
Do not ask: "Why wouldn't your parents work smarter?"
Do not ask: "Why did you feel like you didn't deserve what they had?"

Return JSON only:
{"question":"..."}

CURRENT LAYER TO ASK: ${layer} of 7
STARTING AREA: ${selectedAreaLabel}
ORIGINAL CHOSEN-GOAL ANSWER:
${selectedAreaAnswer}

IMMEDIATELY PREVIOUS ANSWER — EXTRACT ITS DIRECT ANSWER AND FOLLOW ONLY THAT:
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
  if (!normalized || !normalized.startsWith("why")) return false

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

  if (changesLens || changesThread) return false

  const previousQuestions = recursiveLayers.map((item) =>
    item.question.trim().toLowerCase(),
  )

  if (previousQuestions.includes(normalized)) return false

  const repeatedStems = [
    "why does it matter to you that",
    "why is it important to you that",
    "why did it matter to you that",
    "why was it important to you that",
    "why does that matter to you",
    "why is that important to you",
  ]

  return !repeatedStems.some(
    (stem) =>
      normalized.startsWith(stem) &&
      previousQuestions.some((previous) => previous.startsWith(stem)),
  )
}

function fallbackQuestion(
  layer: number,
  selectedAreaLabel: string,
  sourceAnswer: string,
): string {
  const directAnswer = extractDirectAnswer(sourceAnswer)

  if (!directAnswer) {
    return layer === 1
      ? `Why does ${selectedAreaLabel.toLowerCase()} matter to you right now?`
      : genericWhyQuestion(layer)
  }

  const clause = toSecondPerson(directAnswer)
  const pastTense = /^(you\s+(?:felt|heard|were|had|believed|thought|wanted|needed)|it\s+(?:felt|was|made))/i.test(
    clause,
  )

  if (pastTense) {
    return layer % 2 === 0
      ? `Why was it important to you that ${lowercaseFirst(clause)}?`
      : `Why did it matter to you that ${lowercaseFirst(clause)}?`
  }

  return layer % 2 === 0
    ? `Why is it important to you that ${lowercaseFirst(clause)}?`
    : `Why does it matter to you that ${lowercaseFirst(clause)}?`
}

function extractDirectAnswer(input: string): string {
  const normalized = input.trim().replace(/\s+/g, " ")
  if (!normalized) return ""

  const fragments = normalized
    .match(/[^.!?]+[.!?]?/g)
    ?.map((part) => part.trim())
    .filter(Boolean) ?? [normalized]

  const statements = fragments
    .filter((part) => !part.endsWith("?"))
    .filter((part) => !/^(why|what|how|when|where|who|would|could|should)\b/i.test(part))
    .map((part) => part.replace(/^because\s+/i, "").replace(/[.!?]+$/, "").trim())
    .filter(Boolean)

  const directStatements = statements.filter((part) =>
    /^(i\b|i['’]m\b|i am\b|i['’]ve\b|i have\b|i felt\b|i feel\b|i want\b|i need\b|i care\b|i believe\b|i thought\b|i was\b|my\b|me\b|it made me\b|that made me\b)/i.test(
      part,
    ),
  )

  const selected = directStatements.length > 0 ? directStatements : statements
  return selected.join("; ")
}

function genericWhyQuestion(layer: number): string {
  const questions = [
    "Why does this matter to you right now?",
    "Why is that important to you?",
    "Why does that matter to you?",
    "Why is that important?",
    "Why does that matter?",
    "Why is that important to you here?",
    "Why does that matter beneath everything else you have named?",
  ]

  return questions[layer - 1] ?? questions[questions.length - 1]
}

function lowercaseFirst(input: string): string {
  return input ? input.charAt(0).toLowerCase() + input.slice(1) : input
}

function toSecondPerson(input: string): string {
  return input
    .trim()
    .replace(/^because\s+/i, "")
    .replace(/\bi['’]m\b/gi, "you're")
    .replace(/\bi am\b/gi, "you are")
    .replace(/\bi['’]ve\b/gi, "you've")
    .replace(/\bi['’]d\b/gi, "you'd")
    .replace(/\bmy\b/gi, "your")
    .replace(/\bme\b/gi, "you")
    .replace(/\bi\b/gi, "you")
}
