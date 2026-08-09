import { OREMEA_EVIDENCE_BOUNDARY } from "@/src/lib/oremea/evidence-boundary"
import { MIRROR_AUTHORING_STANDARD } from "@/src/lib/oremea/mirror-authoring"
import {
  MEANING_MOVEMENT_STANDARD,
  isMeaningAnswerForm,
  isMeaningDirection,
  isMeaningMovement,
} from "@/src/lib/oremea/meaning-movement"

import type {
  CompassAreaResponse,
  CompassGoalArea,
  CompassRecursiveLayer,
} from "./session-types"
import {
  isCompassDescentHistoryAction,
  type CompassDescentAttempt,
  type CompassDescentDecision,
  type CompassDescentHistoryAction,
} from "./compass-descent.types"

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
const MAX_DESCENT_QUESTION_WORDS = 28

const CONCISE_DESCENT_QUESTION_STANDARD = `
CONCISE DESCENT QUESTION STANDARD — TIGHTEN WITHOUT FLATTENING
- write one immediately understandable question, normally 12–24 words and never more than ${MAX_DESCENT_QUESTION_WORDS} words
- use one grammatical spine that a participant can understand in one read
- compress the participant's wording into faithful human synthesis; do not mechanically preserve every clause
- preserve distinct supplied meanings when they operate together through cause, contrast, qualification, or accountability
- every distinct meaning in the latest answer must survive the tightening; never select one clause and discard the others
- preserve supplied timing and contrast when they change the meaning, including now/later and before/after relationships
- use a short parallel list when several supplied meanings belong together
- remove duplicated subjects, filler, and scaffolding such as "your state of"
- never paste the participant's complete answer inside "Why does it matter to you that..."
- never replace a specific compound answer with a generic abstraction or "this" merely to make the question shorter
- never stack a because-clause, dash-clause, and with/where-clause into one question
- faithful synthesis may name an explicit relationship concisely: "said you would and did" can become "keeping your commitment"
- these are behavioural rules, not a fixed sentence; phrase each question naturally from the participant's immediately preceding answer
`.trim()

type DecisionValidationContext = {
  layer: number
  sourceAnswer: string
  evidenceText: string
  currentQuestion: string
  recursiveLayers: CompassRecursiveLayer[]
  attempts: CompassDescentAttempt[]
}

export async function generateCompassDescentQuestion({
  layer,
  selectedArea,
  areaResponses,
  recursiveLayers,
}: {
  layer: number
  selectedArea: CompassGoalArea
  areaResponses: CompassAreaResponse[]
  recursiveLayers: CompassRecursiveLayer[]
}): Promise<string> {
  const selectedAreaLabel = AREA_LABELS[selectedArea]
  const selectedAreaAnswer =
    areaResponses.find((response) => response.area === selectedArea)?.answer.trim() ?? ""

  const previousLayer = recursiveLayers[recursiveLayers.length - 1]
  const sourceAnswer = previousLayer?.answer.trim() || selectedAreaAnswer

  if (!sourceAnswer) {
    return `Why is ${selectedAreaLabel.toLowerCase()} important to you?`
  }

  const prompt = buildQuestionPrompt({
    layer,
    selectedAreaLabel,
    selectedAreaAnswer,
    recursiveLayers,
    sourceAnswer,
  })

  const priorQuestions = recursiveLayers.map((item) => item.question)
  const evidenceText = [
    selectedAreaAnswer,
    ...recursiveLayers.map((item) => item.answer),
  ].join("\n")

  try {
    return await callMirrorWithRepair({
      prompt,
      maxTokens: 240,
      validate: (value) => {
        const question = parseQuestion(value)
        validateCompassQuestion({
          question,
          sourceAnswer,
          evidenceText,
          priorQuestions,
        })
        return question
      },
    })
  } catch {
    return buildSafeWhyQuestion({
      sourceAnswer,
      evidenceText,
      priorQuestions,
    })
  }
}

export async function evaluateCompassDescentAnswer({
  layer,
  selectedArea,
  areaResponses,
  recursiveLayers,
  currentQuestion,
  currentAnswer,
  attempts,
}: {
  layer: number
  selectedArea: CompassGoalArea
  areaResponses: CompassAreaResponse[]
  recursiveLayers: CompassRecursiveLayer[]
  currentQuestion: string
  currentAnswer: string
  attempts: CompassDescentAttempt[]
}): Promise<CompassDescentDecision> {
  const selectedAreaLabel = AREA_LABELS[selectedArea]
  const selectedAreaAnswer =
    areaResponses.find((response) => response.area === selectedArea)?.answer.trim() ?? ""

  const sourceAnswer =
    recursiveLayers[recursiveLayers.length - 1]?.answer.trim() || selectedAreaAnswer

  const prompt = buildDecisionPrompt({
    layer,
    selectedAreaLabel,
    selectedAreaAnswer,
    recursiveLayers,
    sourceAnswer,
    currentQuestion,
    currentAnswer,
    attempts,
  })

  try {
    return await callMirrorWithRepair({
      prompt,
      maxTokens: 520,
      validate: (value) =>
        validateCompassDescentDecision(value, {
          layer,
          sourceAnswer: currentAnswer,
          evidenceText: [
            selectedAreaAnswer,
            ...recursiveLayers.map((item) => item.answer),
            currentAnswer,
          ].join("\n"),
          currentQuestion,
          recursiveLayers,
          attempts,
        }),
    })
  } catch (error) {
    console.error(
      "Compass Descent decision recovered after Mirror failure:",
      error instanceof Error ? error.message : "Unknown Mirror failure.",
    )

    return recoverCompassDescentDecision({
      layer,
      selectedArea,
      areaResponses,
      recursiveLayers,
      currentQuestion,
      currentAnswer,
      attempts,
    })
  }
}

async function recoverCompassDescentDecision({
  layer,
  selectedArea,
  areaResponses,
  recursiveLayers,
  currentQuestion,
  currentAnswer,
  attempts,
}: {
  layer: number
  selectedArea: CompassGoalArea
  areaResponses: CompassAreaResponse[]
  recursiveLayers: CompassRecursiveLayer[]
  currentQuestion: string
  currentAnswer: string
  attempts: CompassDescentAttempt[]
}): Promise<CompassDescentDecision> {
  const answer = currentAnswer.trim()
  const normalizedAnswer = normalizeComparisonText(answer)
  const isUncertaintyOnly = isOnlyUncertaintyAnswer(answer)
  const isCorrection =
    recursiveLayers.length > 0 &&
    /^(?:no\b|actually\b|correction\b|that(?:'s| is) not what i meant\b|i meant\b)/i.test(
      answer,
    )
  const isExactRepetition = [
    ...recursiveLayers.map((item) => item.answer),
    ...attempts.map((item) => item.answer),
  ].some((item) => normalizeComparisonText(item) === normalizedAnswer)

  const movement: CompassDescentDecision["movement"] = isUncertaintyOnly
    ? "uncertainty_only"
    : isCorrection
      ? "correction"
      : isExactRepetition
        ? "repetition"
        : "new_meaning"
  const historyAction = expectedHistoryAction({
    movement,
    hasAcceptedLayer: recursiveLayers.length > 0,
  })
  const substantiveAnswer = isUncertaintyOnly ? null : answer

  if (historyAction === "stay") {
    return {
      direction: "self_to_self",
      movement,
      answerForm: "other",
      substantiveAnswer,
      historyAction,
      advanceLayer: false,
      question: currentQuestion,
    }
  }

  if (layer === 7 && historyAction === "append") {
    return {
      direction: "self_to_self",
      movement,
      answerForm: "meaning",
      substantiveAnswer,
      historyAction,
      advanceLayer: true,
      question: null,
    }
  }

  const recoveredLayers = buildRecoveredLayers({
    layer,
    recursiveLayers,
    currentQuestion,
    answer,
    historyAction,
  })
  const priorQuestions = [
    ...recoveredLayers.map((item) => item.question),
    ...attempts.map((item) => item.question),
  ]

  let question: string

  try {
    question = await generateCompassDescentQuestion({
      layer: historyAction === "append" ? layer + 1 : layer,
      selectedArea,
      areaResponses,
      recursiveLayers: recoveredLayers,
    })
  } catch {
    question = buildCompassRecoveryWhyQuestion({
      sourceAnswer: answer,
      priorQuestions,
    })
  }

  return {
    direction: "self_to_self",
    movement,
    answerForm: "meaning",
    substantiveAnswer,
    historyAction,
    advanceLayer: historyAction === "append",
    question,
  }
}

function buildRecoveredLayers({
  layer,
  recursiveLayers,
  currentQuestion,
  answer,
  historyAction,
}: {
  layer: number
  recursiveLayers: CompassRecursiveLayer[]
  currentQuestion: string
  answer: string
  historyAction: CompassDescentHistoryAction
}): CompassRecursiveLayer[] {
  const recoveredLayer: CompassRecursiveLayer = {
    layer,
    question: currentQuestion,
    answer,
    detectedValueWords: [],
    detectedReasonWords: [],
  }

  if (historyAction === "replace_previous") {
    return [...recursiveLayers.slice(0, -1), recoveredLayer]
  }

  return [...recursiveLayers, recoveredLayer]
}

function normalizeComparisonText(value: string): string {
  return value
    .trim()
    .toLowerCase()
    .replace(/[’']/g, "'")
    .replace(/[^a-z0-9']+/g, " ")
    .replace(/\s+/g, " ")
}

function isOnlyUncertaintyAnswer(value: string): boolean {
  return /^(?:(?:i|we)\s+)?(?:(?:(?:do|did)\s+not|don't|didn't)\s+(?:know|understand)|(?:am|are)?\s*(?:not\s+sure|unsure|uncertain|unclear))(?:\s+(?:yet|really))?[.!?]*$/i.test(
    value.trim().replace(/[’]/g, "'"),
  )
}

function buildQuestionPrompt({
  layer,
  selectedAreaLabel,
  selectedAreaAnswer,
  recursiveLayers,
  sourceAnswer,
}: {
  layer: number
  selectedAreaLabel: string
  selectedAreaAnswer: string
  recursiveLayers: CompassRecursiveLayer[]
  sourceAnswer: string
}) {
  const priorDescent = formatPriorDescent(recursiveLayers)

  return `
You are Mirror writing the next question in The Descent inside Compass.

Compass begins with a chosen goal. The goal remains the spine of the Descent.
Each accepted answer becomes the subject of the next why.
The repetition is intentional.
The four directions decide what the why follows. They never change the inquiry into possibility, interpretation, planning, or another form.
Never pull the participant back into "now", "today", "here", "currently", or present-time analysis.
Mention the goal only when it is needed to keep the participant's own thread identifiable.

${MIRROR_AUTHORING_STANDARD}

${OREMEA_EVIDENCE_BOUNDARY}

${MEANING_MOVEMENT_STANDARD}

${CONCISE_DESCENT_QUESTION_STANDARD}

COMPASS DESCENT QUESTION POLICY — WHY ONLY
- every participant-facing Descent question must begin with the exact word "Why"
- every question must remain semantically equivalent to asking why the participant's supplied answer matters, is important, or is significant
- natural grammatical forms include "Why is...", "Why does...", "Why did...", "Why was...", and "Why would..."
- variation may change the grammar or the supplied subject; it may never change the inquiry
- the monotony is part of the method; never escape it by asking what becomes possible, what something allows, what it creates, what would change, how it affects them, or where it leads
- do not begin with What, How, Which, When, Where, Who, or Can
- never use "carry so much weight"
- do not investigate why an external circumstance happened
- do not investigate another person's motives
- when a memory appears, ask why the participant-supplied experience mattered
- when another person's action toward the participant appears, ask why what the participant received or experienced mattered to them
- when the participant names an inner feeling, belief, value, identity, need, or judgment, ask why that supplied meaning matters
- when the participant names what they want for another person, ask why that supplied intended experience matters
- do not move into possibility, planning, strategy, repair, action, coaching, or execution
- preserve the participant's living language and do not add emotion or intensity
- name or faithfully synthesize the immediately preceding answer as the subject; never substitute "this", "that", "it", or "your answer" when the answer contains substantive meaning
- every content premise in the question must come from the immediately preceding answer
- neutral inquiry words may open importance or significance; they may not supply deserving, worth, safety, love, identity, control, pressure, shame, or another construct the participant has not supplied

Examples of form, not templates:
- Why did receiving as little as possible matter to you?
- Why is freedom to create from within important to you?
- Why does their knowing they are loved matter to you?

Return JSON only:
{"question":"..."}

LAYER TO ASK: ${layer} of 7
SELECTED AREA: ${selectedAreaLabel}
GOAL SPINE:
${selectedAreaAnswer}

LATEST ACCEPTED ANSWER:
${sourceAnswer}

ACCEPTED DESCENT:
${priorDescent || "None yet."}
`.trim()
}

function buildDecisionPrompt({
  layer,
  selectedAreaLabel,
  selectedAreaAnswer,
  recursiveLayers,
  sourceAnswer,
  currentQuestion,
  currentAnswer,
  attempts,
}: {
  layer: number
  selectedAreaLabel: string
  selectedAreaAnswer: string
  recursiveLayers: CompassRecursiveLayer[]
  sourceAnswer: string
  currentQuestion: string
  currentAnswer: string
  attempts: CompassDescentAttempt[]
}) {
  const priorDescent = formatPriorDescent(recursiveLayers)
  const uncountedAttempts = attempts
    .map(
      (attempt, index) =>
        `Attempt ${index + 1}\nQuestion: ${attempt.question}\nAnswer: ${attempt.answer}\nMovement: ${attempt.movement}\nDirection: ${attempt.direction}`,
    )
    .join("\n\n")

  return `
You are the Meaning Movement Engine and Mirror author for The Descent inside Compass.

The goal remains the spine of every layer.
The present goal is the trigger, not the destination of the inquiry.
Never pull the participant back into "now", "today", "here", "currently", or present-time analysis.
A goal may be named to preserve the relationship between an emerging memory or meaning and what the participant wants to create.

${MIRROR_AUTHORING_STANDARD}

${OREMEA_EVIDENCE_BOUNDARY}

${MEANING_MOVEMENT_STANDARD}

${CONCISE_DESCENT_QUESTION_STANDARD}

COMPASS HISTORY ACTION
Choose exactly one:
- append: a genuine new movement in meaning occurred; this answer becomes the next accepted layer
- stay: uncertainty without an answer or semantic repetition occurred; the layer does not advance
- replace_previous: the participant explicitly corrected the immediately previous accepted answer; replace it and do not advance

Required consistency:
- new_meaning, uncertainty_with_answer, and compound_meaning use append
- repetition and uncertainty_only use stay
- correction uses replace_previous when an accepted layer exists; otherwise use stay
- advanceLayer is true only for append
- substantiveAnswer is null only for uncertainty_only
- if this is Layer 7 and historyAction is append, question must be null
- otherwise question must contain exactly one participant-facing question

COMPASS QUESTION POLICY — WHY ONLY
Every next question begins with the exact word "Why".
Every next question asks why the participant's supplied answer matters, is important, or is significant.
The immediately preceding answer becomes the subject. The subject changes as the participant answers. The inquiry does not.
When the answer contains substantive meaning, name or faithfully synthesize it; never replace it with "this", "that", "it", or "your answer".

Allowed grammatical movement:
- Why did receiving as little as possible matter to you?
- Why was being seen as grateful significant to you?
- Why would their knowing they are loved matter to you?

These are examples of form, not templates.

Hard boundaries:
- do not begin with What, How, Which, When, Where, Who, or Can
- do not ask what becomes possible, what the answer allows, what it creates, what would change, how it affects them, or where it leads
- do not investigate the factual cause of an external circumstance
- do not ask why another person acted as they did
- do not return to present-time reflection
- do not move into possibility, planning, action, repair, coaching, or execution
- do not validate or contradict a self-judgment
- do not infer an unspoken emotion, motive, identity, deserving, worth, safety, love, control, pressure, shame, or meaning
- every content premise in the question must come from the immediately preceding answer; neutral why-language may open importance but may not provide meaning
- do not use "carry so much weight"
- do not change the inquiry merely to avoid rhetorical repetition; the repetition is intentional
- do not repeat an identical full question
- a correction replaces; it does not count
- different wording with the same meaning does not count
- "I don't know" alone does not count
- "I don't know, maybe..." counts only when a substantive answer follows
- when a response contains both a circumstance and what it came to mean, follow the supplied meaning with why
- when the response contains only a circumstance, ask why that participant-supplied circumstance mattered; never ask why the circumstance occurred
- when a real answer is followed by a rhetorical question about another person, follow the real answer and ignore the rhetorical question as a thread
- when two genuine answers share one deeper meaning, hold them together and ask why that supplied shared meaning matters
- when two genuine answers pull in different directions, stay on the layer and ask why both supplied reasons matter without choosing one for the participant

FOUR-DIRECTION ROUTING — CHOOSE THE SUBJECT OF WHY
- others_to_others: ask why the participant's observation matters to them in relation to the goal
- others_to_self: ask why what the participant received, experienced, or heard mattered to them
- self_to_self: ask why the participant's supplied feeling, belief, identity, judgment, value, need, or conclusion matters
- self_to_others: ask why the participant's supplied intended experience for others matters

Return JSON only:
{
  "direction":"others_to_others|others_to_self|self_to_self|self_to_others",
  "movement":"new_meaning|repetition|correction|uncertainty_only|uncertainty_with_answer|compound_meaning",
  "answerForm":"meaning|memory|external_circumstance|strategy|desired_outcome|emotion|value|identity|obligation|prevention|comparison|self_judgment|inherited_rule|other",
  "substantiveAnswer":"participant's substantive answer or null",
  "historyAction":"append|stay|replace_previous",
  "advanceLayer":true,
  "question":"next question or null"
}

CURRENT LAYER: ${layer} of 7
SELECTED AREA: ${selectedAreaLabel}
GOAL SPINE:
${selectedAreaAnswer}

LATEST ACCEPTED ANSWER BEFORE THIS RESPONSE:
${sourceAnswer}

CURRENT QUESTION:
${currentQuestion}

CURRENT RESPONSE:
${currentAnswer}

UNCOUNTED ATTEMPTS ON THIS SAME LAYER:
${uncountedAttempts || "None."}

ACCEPTED DESCENT:
${priorDescent || "None yet."}
`.trim()
}

function formatPriorDescent(recursiveLayers: CompassRecursiveLayer[]) {
  return recursiveLayers
    .map(
      (item) =>
        `Layer ${item.layer}\nQuestion: ${item.question}\nAnswer: ${item.answer}`,
    )
    .join("\n\n")
}

async function callMirrorWithRepair<T>({
  prompt,
  maxTokens,
  validate,
}: {
  prompt: string
  maxTokens: number
  validate: (value: unknown) => T
}): Promise<T> {
  let validationError = ""

  for (let attempt = 0; attempt < 3; attempt += 1) {
    const repair =
      attempt === 0
        ? ""
        : `\n\nYour previous response was rejected for this reason:\n${validationError}\nReturn corrected JSON only.`

    const raw = await callClaude(`${prompt}${repair}`, maxTokens)

    try {
      const parsed = parseJson(raw)
      return validate(parsed)
    } catch (error) {
      validationError =
        error instanceof Error ? error.message : "The response was invalid."
    }
  }

  throw new Error(validationError || "Mirror could not form a valid Descent response.")
}

async function callClaude(prompt: string, maxTokens: number): Promise<string> {
  const response = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-api-key": process.env.ANTHROPIC_API_KEY!,
      "anthropic-version": "2023-06-01",
    },
    body: JSON.stringify({
      model: COMPASS_MODEL,
      max_tokens: maxTokens,
      temperature: 0.15,
      messages: [{ role: "user", content: prompt }],
    }),
  })

  const data = await response.json()

  if (!response.ok) {
    console.error("Compass Descent API error:", data)
    throw new Error("Mirror could not generate the next Descent movement.")
  }

  return Array.isArray(data?.content)
    ? data.content
        .filter(
          (item: { type?: string; text?: string }) => item?.type === "text",
        )
        .map((item: { text?: string }) => item.text ?? "")
        .join("\n")
        .trim()
    : ""
}

function parseJson(raw: string): unknown {
  if (!raw) throw new Error("Mirror returned an empty response.")

  const normalized = raw
    .replace(/^```json\s*/i, "")
    .replace(/^```\s*/i, "")
    .replace(/```$/i, "")
    .trim()

  return JSON.parse(normalized)
}

function parseQuestion(value: unknown): string {
  if (
    !value ||
    typeof value !== "object" ||
    typeof (value as { question?: unknown }).question !== "string"
  ) {
    throw new Error("Mirror did not return a question.")
  }

  return (value as { question: string }).question.trim()
}

export function validateCompassDescentDecision(
  value: unknown,
  context: DecisionValidationContext,
): CompassDescentDecision {
  if (!value || typeof value !== "object") {
    throw new Error("The Descent decision must be an object.")
  }

  const candidate = value as Record<string, unknown>

  if (!isMeaningDirection(candidate.direction)) {
    throw new Error("The Descent direction is invalid.")
  }

  if (!isMeaningMovement(candidate.movement)) {
    throw new Error("The Descent movement is invalid.")
  }

  if (!isMeaningAnswerForm(candidate.answerForm)) {
    throw new Error("The Descent answer form is invalid.")
  }

  if (!isCompassDescentHistoryAction(candidate.historyAction)) {
    throw new Error("The Descent history action is invalid.")
  }

  const expectedAction = expectedHistoryAction({
    movement: candidate.movement,
    hasAcceptedLayer: context.recursiveLayers.length > 0,
  })

  if (candidate.historyAction !== expectedAction) {
    throw new Error(
      `Movement ${candidate.movement} requires historyAction ${expectedAction}.`,
    )
  }

  const advanceLayer = candidate.advanceLayer === true

  if (advanceLayer !== (candidate.historyAction === "append")) {
    throw new Error("advanceLayer must be true only when historyAction is append.")
  }

  const substantiveAnswer =
    typeof candidate.substantiveAnswer === "string" &&
    candidate.substantiveAnswer.trim()
      ? candidate.substantiveAnswer.trim()
      : null

  if (candidate.movement === "uncertainty_only" && substantiveAnswer) {
    throw new Error("uncertainty_only cannot contain a substantive answer.")
  }

  if (candidate.movement !== "uncertainty_only" && !substantiveAnswer) {
    throw new Error("A substantive answer is required for this movement.")
  }

  const question =
    typeof candidate.question === "string" && candidate.question.trim()
      ? candidate.question.trim()
      : null

  const finishesDescent =
    context.layer === 7 && candidate.historyAction === "append"

  if (finishesDescent && question) {
    throw new Error("Layer 7 must not generate another Descent question.")
  }

  if (!finishesDescent && !question) {
    throw new Error("A next question is required while the Descent continues.")
  }

  let resolvedQuestion = question

  if (question) {
    const decisionEvidenceText = [
      context.evidenceText,
      substantiveAnswer,
    ]
      .filter(Boolean)
      .join("\n")
    const priorQuestions = [
      ...context.recursiveLayers.map((item) => item.question),
      ...context.attempts.map((item) => item.question),
      context.currentQuestion,
    ]
    const questionSource = substantiveAnswer || context.sourceAnswer

    validateCompassQuestion({
      question,
      sourceAnswer: questionSource,
      priorQuestions,
      evidenceText: decisionEvidenceText,
    })
  }

  return {
    direction: candidate.direction,
    movement: candidate.movement,
    answerForm: candidate.answerForm,
    substantiveAnswer,
    historyAction: candidate.historyAction,
    advanceLayer,
    question: resolvedQuestion,
  }
}

function buildSafeWhyQuestion({
  sourceAnswer,
  evidenceText,
  priorQuestions,
}: {
  sourceAnswer: string
  evidenceText: string
  priorQuestions: string[]
}): string {
  const sourceFragments = extractWhyFragments(sourceAnswer)
  const compoundSubject = buildQuotedCompoundSubject(sourceFragments)
  const subject =
    sourceFragments.length <= 1 ? extractSafeWhySubject(sourceAnswer) : ""
  const candidates = [
    ...(compoundSubject
      ? [
          `Why do ${compoundSubject} matter to you?`,
          `Why are ${compoundSubject} important to you?`,
          `Why are ${compoundSubject} significant to you?`,
        ]
      : []),
    ...(subject
      ? [
          `Why does ${subject} matter to you?`,
          `Why is ${subject} important to you?`,
          `Why is ${subject} significant to you?`,
        ]
      : []),
    ...(!hasSubstantiveWhySubject(sourceAnswer)
      ? [
          "Why does this matter to you?",
          "Why is this important to you?",
          "Why is this significant to you?",
        ]
      : []),
  ]

  for (const candidate of candidates) {
    try {
      validateCompassQuestion({
        question: candidate,
        sourceAnswer,
        evidenceText,
        priorQuestions,
      })
      return candidate
    } catch {
      // Try the next deterministic Why form.
    }
  }

  throw new Error(
    "Compass could not form a distinct evidence-grounded Why question.",
  )
}

export function buildCompassRecoveryWhyQuestion({
  sourceAnswer,
  priorQuestions,
}: {
  sourceAnswer: string
  priorQuestions: string[]
}): string {
  return buildSafeWhyQuestion({
    sourceAnswer,
    evidenceText: sourceAnswer,
    priorQuestions,
  })
}

function extractWhyFragments(sourceAnswer: string): string[] {
  return sourceAnswer
    .split(/\n|[,;:]+|[.!?]+|\s+[—–-]\s+/)
    .map((item) =>
      item
        .trim()
        .replace(/^[\s"'“”‘’()[\]{}]+/, "")
        .replace(/[\s"'“”‘’()[\]{}]+$/, "")
        .replace(
          /^(?:it means|that means|this means|meaning|because|and|but|so|then)\s+/i,
          "",
        )
        .replace(
          /\s+so\s+(?:they|he|she|we|you)(?:['’]re|\s+are)\s+in\s+practice$/i,
          "",
        )
        .replace(/\bnot\s+still\s+needing\b/i, "not needing")
        .trim(),
    )
    .filter(Boolean)
}

function buildQuotedCompoundSubject(fragments: string[]): string {
  if (fragments.length < 2 || fragments.length > 3) return ""

  const quoted = fragments.map((fragment) => `“${fragment}”`)
  const joined =
    quoted.length === 2
      ? `${quoted[0]} and ${quoted[1]}`
      : `${quoted[0]}, ${quoted[1]}, and ${quoted[2]}`
  const candidate = `Why do ${joined} matter to you?`
  const wordCount = candidate.split(/\s+/).filter(Boolean).length

  return wordCount <= MAX_DESCENT_QUESTION_WORDS ? joined : ""
}

function extractSafeWhySubject(sourceAnswer: string): string {
  const fragments = sourceAnswer
    .split(/\n|[,;:]+|\s+[—–-]\s+/)
    .map((item) =>
      item
        .trim()
        .replace(/^[\s"'“”‘’()[\]{}]+/, "")
        .replace(/[\s"'“”‘’()[\]{}.!?]+$/, "")
        .replace(
          /^(?:it means|that means|this means|meaning|because|and|but|so|then)\s+/i,
          "",
        )
        .trim(),
    )
    .filter(Boolean)
    .reverse()

  for (const fragment of fragments) {
    const words = fragment.split(/\s+/).filter(Boolean)
    const containsPerspectivePronoun =
      /\b(?:i|i'm|i've|me|my|mine|we|we're|we've|us|our|ours|you|your|yours|he|she|they|them|his|her|their)\b/i.test(
        fragment,
      )

    if (
      words.length >= 1 &&
      words.length <= 6 &&
      !containsPerspectivePronoun
    ) {
      return fragment
    }
  }

  return ""
}

function expectedHistoryAction({
  movement,
  hasAcceptedLayer,
}: {
  movement: CompassDescentDecision["movement"]
  hasAcceptedLayer: boolean
}): CompassDescentHistoryAction {
  if (movement === "repetition" || movement === "uncertainty_only") {
    return "stay"
  }

  if (movement === "correction") {
    return hasAcceptedLayer ? "replace_previous" : "stay"
  }

  return "append"
}

export function validateCompassQuestion({
  question,
  sourceAnswer,
  priorQuestions,
}: {
  question: string
  sourceAnswer: string
  evidenceText?: string
  priorQuestions: string[]
}) {
  const normalized = question.trim()
  const lower = normalized.toLowerCase()
  const source = sourceAnswer.toLowerCase()

  if (!normalized.endsWith("?") || (normalized.match(/\?/g) ?? []).length !== 1) {
    throw new Error("The participant-facing response must contain one question.")
  }

  if (!/^why\b/i.test(normalized)) {
    throw new Error('Every Descent question must begin with "Why".')
  }

  if (normalized.length > 260) {
    throw new Error("The Descent question is too long.")
  }

  assertCompassQuestionIsConcise(normalized)

  if (
    usesGenericWhySubject(normalized) &&
    hasSubstantiveWhySubject(sourceAnswer)
  ) {
    throw new Error(
      "The Descent question flattened an available grounded subject into a generic this.",
    )
  }

  if (/^why does .+\bbecause\b.+matter to you\?$/i.test(normalized)) {
    throw new Error(
      "The Descent question embeds a because-clause inside its subject; recast it with one clear grammatical spine.",
    )
  }

  const stackedClauseCount = [
    /\bbecause\b/i,
    /[—–]/,
    /,\s+(?:with|where|while)\b/i,
  ].filter((pattern) => pattern.test(normalized)).length

  if (stackedClauseCount >= 3) {
    throw new Error(
      "The Descent question stacks too many linked clauses to understand in one read.",
    )
  }

  const questionUsesPresentTime =
    /\b(right now|now|today|currently|at present|in this moment|here)\b/i.test(
      lower,
    )
  const sourceSuppliesPresentTime =
    /\b(right now|now|today|currently|at present|in this moment|here)\b/i.test(
      source,
    )

  if (questionUsesPresentTime && !sourceSuppliesPresentTime) {
    throw new Error("The Descent question pulls the participant back into the present.")
  }

  const movesIntoPossibility =
    /\bmake(?:s|made|making)?\s+(?:.+\s+)?possible\b/i.test(lower) ||
    /\bbecome(?:s|became|becoming)?\s+possible\b/i.test(lower) ||
    /\b(?:lead|leads|led|leading)\s+to\b/i.test(lower) ||
    /\b(?:allow|allows|allowing)\s+(?:you|them|him|her|someone|people)\s+to\b/i.test(lower) ||
    /\bopens?\s+(?:up\s+)?(?:a|the|new|more)\b/i.test(lower) ||
    /\bcreate(?:s|d|ing)?\s+(?:a\s+)?future\b/i.test(lower)

  if (movesIntoPossibility) {
    throw new Error("The Descent question moves into Possibility instead of asking why.")
  }

  if (/\bcarry(?:ing|ies|ied)?(?:\s+so\s+much)?\s+weight\b/i.test(lower)) {
    throw new Error('The Descent question uses the repeated "carry weight" frame.')
  }

  if (
    /^why\s+(?:did|do|does|would|wouldn['’]t|could|couldn['’]t|can|can['’]t|is|was|were)\s+(?:they|he|she|your\s+(?:parents?|mother|father|partner|spouse|child|children|boss|friend|family))\b/i.test(
      lower,
    )
  ) {
    throw new Error("The Descent question investigates another person's motives.")
  }

  if (
    [
      "what comes next",
      "what should you do",
      "how will you",
      "how can you",
      "what action",
      "what step",
      "make possible now",
    ].some((phrase) => lower.includes(phrase))
  ) {
    throw new Error("The Descent question moves into planning or execution.")
  }

  const inferredLabels = [
    "abandon",
    "deserv",
    "frustrat",
    "hurt",
    "painful",
    "angry",
    "grief",
    "fear",
    "frighten",
    "relief",
    "longing",
    "overwhelm",
    "shame",
    "trauma",
  ].some((label) => lower.includes(label) && !source.includes(label))

  if (inferredLabels) {
    throw new Error(
      "The Descent question adds an emotion or meaning the participant did not supply.",
    )
  }

  const inventedIntensity = ["deeply", "extremely", "devastating"].some(
    (word) => lower.includes(word) && !source.includes(word),
  )

  if (inventedIntensity) {
    throw new Error("The Descent question adds unsupported intensity.")
  }

  const questionClaimsRecurrence =
    /\b(?:always|constant(?:ly)?|continual(?:ly)?|recur(?:s|red|ring|rence)?|repeat(?:s|ed|ing|edly)?)\b/i.test(
      normalized,
    )
  const sourceSuppliesRecurrence =
    /\b(?:always|constant(?:ly)?|continual(?:ly)?|every\s+time|again\s+and\s+again|only\s+ever|recur(?:s|red|ring|rence)?|repeat(?:s|ed|ing|edly)?)\b/i.test(
      sourceAnswer,
    )

  if (questionClaimsRecurrence && !sourceSuppliesRecurrence) {
    throw new Error(
      "The Descent question adds recurrence the participant did not supply.",
    )
  }

  const earlierQuestions = priorQuestions
    .map((item) => item.trim())
    .filter(Boolean)

  if (earlierQuestions.some((item) => item.toLowerCase() === lower)) {
    throw new Error("The Descent question repeats an earlier question.")
  }

}

function usesGenericWhySubject(question: string): boolean {
  return /^(?:why does (?:this|that|it|your answer|the answer|what you (?:said|wrote|described)) (?:matter|remain important) to you|why is (?:this|that|it|your answer|the answer|what you (?:said|wrote|described)) (?:important|significant) to you)\?$/i.test(
    question,
  )
}

function hasSubstantiveWhySubject(sourceAnswer: string): boolean {
  const normalized = sourceAnswer
    .trim()
    .toLowerCase()
    .replace(/[’']/g, "'")
    .replace(/\s+/g, " ")

  if (!normalized) return false

  const hasOnlyUncertainty =
    /^(?:(?:i|we)\s+)?(?:(?:(?:do|did)\s+not|don't|didn't)\s+(?:know|understand)|(?:am|are)?\s*(?:not\s+sure|unsure|uncertain|unclear))(?:\s+(?:yet|really))?[.!?]*$/i.test(
      normalized,
    )

  return !hasOnlyUncertainty
}

function assertCompassQuestionIsConcise(question: string) {
  const wordCount = question.trim().split(/\s+/).filter(Boolean).length

  if (wordCount > MAX_DESCENT_QUESTION_WORDS) {
    throw new Error(
      `The Descent question has ${wordCount} words; tighten it to ${MAX_DESCENT_QUESTION_WORDS} or fewer without flattening the participant's meaning.`,
    )
  }
}

export function getCompassQuestionFrame(question: string): string | null {
  const normalized = question.trim().toLowerCase()

  const frames: Array<[string, RegExp]> = [
    [
      "importance_within_desire",
      /\b(?:so\s+)?important\s+within\s+your\s+desire\b/,
    ],
    [
      "importance_within_creation",
      /\b(?:so\s+)?important\s+within\s+what\s+you\s+want\s+to\s+create\b/,
    ],
    ["why_does_matter", /^why does .+ matter to you\?/],
    ["why_did_matter", /^why did .+ matter to you\?/],
    ["why_is_important", /^why is .+ important(?: to you)?\?/],
    ["what_is_important", /^what is important .+\?/],
    ["what_makes_important", /^what makes .+ important .+\?/],
    ["what_did_mean", /^what did .+ mean .+\?/],
    ["what_does_mean", /^what does .+ mean .+\?/],
    ["why_prominent", /^why is .+ prominent .+\?/],
    ["what_makes_significant", /^what makes .+ significant .+\?/],
  ]

  return frames.find(([, pattern]) => pattern.test(normalized))?.[0] ?? null
}
