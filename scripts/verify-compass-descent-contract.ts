import {
  validateCompassDescentDecision,
  validateCompassQuestion,
} from "../src/lib/compass/session/compass-descent.service"
import type { CompassRecursiveLayer } from "../src/lib/compass/session/session-types"

function assert(condition: unknown, message: string): asserts condition {
  if (!condition) throw new Error(message)
}

function expectThrows(run: () => void, label: string) {
  let threw = false

  try {
    run()
  } catch {
    threw = true
  }

  assert(threw, `Expected rejection: ${label}`)
}

const acceptedLayer: CompassRecursiveLayer = {
  layer: 1,
  question: "Why does meeting your family's needs matter to you?",
  answer: "I want them to have enough",
  detectedValueWords: [],
  detectedReasonWords: [],
}

const baseContext = {
  layer: 2,
  sourceAnswer: "I want them to have enough",
  evidenceText:
    "Meeting my family's needs matters because I want them to have enough.",
  currentQuestion: "Why does their having enough matter to you?",
  recursiveLayers: [acceptedLayer],
  attempts: [],
}

const accepted = validateCompassDescentDecision(
  {
    direction: "others_to_self",
    movement: "new_meaning",
    answerForm: "external_circumstance",
    substantiveAnswer: "I only ever received as little as possible",
    historyAction: "append",
    advanceLayer: true,
    question:
      "Why did repeatedly receiving as little as possible matter to you?",
  },
  baseContext,
)

assert(accepted.advanceLayer, "New meaning must advance.")
assert(accepted.historyAction === "append", "New meaning must append.")

expectThrows(
  () =>
    validateCompassQuestion({
      question: "Why did repeatedly receiving one item matter to you?",
      sourceAnswer: "I received one item",
      evidenceText: "I received one item",
      priorQuestions: [],
    }),
  "recurrence language without participant evidence",
)

validateCompassQuestion({
  question: "Why did repeatedly receiving one item matter to you?",
  sourceAnswer: "I only ever received one item",
  evidenceText: "I only ever received one item",
  priorQuestions: [],
})

const repetition = validateCompassDescentDecision(
  {
    direction: "self_to_others",
    movement: "repetition",
    answerForm: "desired_outcome",
    substantiveAnswer: "I do not want them to go without",
    historyAction: "stay",
    advanceLayer: false,
    question: "Why is this most important to you?",
  },
  baseContext,
)

assert(!repetition.advanceLayer, "Repetition must remain on the same layer.")

const uncertainty = validateCompassDescentDecision(
  {
    direction: "self_to_self",
    movement: "uncertainty_only",
    answerForm: "other",
    substantiveAnswer: null,
    historyAction: "stay",
    advanceLayer: false,
    question:
      "Why does this matter to you, even if the reason is not clear yet?",
  },
  {
    ...baseContext,
    currentQuestion: "Why is freedom important to you?",
  },
)

assert(!uncertainty.advanceLayer, "Uncertainty alone must not advance.")

const correction = validateCompassDescentDecision(
  {
    direction: "self_to_self",
    movement: "correction",
    answerForm: "meaning",
    substantiveAnswer: "I wanted them to know they were worthy of receiving",
    historyAction: "replace_previous",
    advanceLayer: false,
    question:
      "Why is their knowing they are worthy of receiving important to you?",
  },
  baseContext,
)

assert(
  correction.historyAction === "replace_previous",
  "A correction must replace the previous accepted answer.",
)

expectThrows(
  () =>
    validateCompassQuestion({
      question:
        "Why is their knowing they are worthy of receiving central to what you want to give them?",
      sourceAnswer:
        "I wanted them to know they were worthy of receiving",
      evidenceText:
        "I wanted them to know they were worthy of receiving",
      priorQuestions: [],
    }),
  "correction question introduced an unsupplied giving action",
)

expectThrows(
  () =>
    validateCompassDescentDecision(
      {
        direction: "self_to_others",
        movement: "repetition",
        answerForm: "desired_outcome",
        substantiveAnswer: "I want their needs met",
        historyAction: "append",
        advanceLayer: true,
        question: "Why does meeting their needs matter to you?",
      },
      baseContext,
    ),
  "semantic repetition counted as a layer",
)

expectThrows(
  () =>
    validateCompassQuestion({
      question:
        "What does meeting all the needs and wants of your family make possible that matters to you?",
      sourceAnswer:
        "I am meeting all the needs and wants of my family",
      evidenceText:
        "I am meeting all the needs and wants of my family",
      priorQuestions: [],
    }),
  "question did not begin with Why",
)

const compoundAnswer =
  "I am thriving because I said I would create the work and then I did. I created it from code. Delay can be justified by time actually invested, not claimed."

expectThrows(
  () =>
    validateCompassQuestion({
      question:
        "Why does it matter to you that your state of thriving is because you said you would create the work and then you did it, creating it from code, where delay can be justified by how much time you actually invested, not claimed?",
      sourceAnswer: compoundAnswer,
      evidenceText: compoundAnswer,
      priorQuestions: [],
    }),
  "compound question copied the full answer instead of tightening it",
)

validateCompassQuestion({
  question:
    "Why does it matter that your thriving comes from keeping your commitment, creating the work, and actually putting in the time?",
  sourceAnswer: compoundAnswer,
  evidenceText: compoundAnswer,
  priorQuestions: [],
})

expectThrows(
  () =>
    validateCompassQuestion({
      question:
        "Why does thriving because you said you would do it and did—creating the work from code, with delay justified by time you actively put in—matter to you?",
      sourceAnswer: compoundAnswer,
      evidenceText: compoundAnswer,
      priorQuestions: [],
    }),
  "word-limited question still stacked the participant's clauses mechanically",
)

const recoveredCompoundDecision = validateCompassDescentDecision(
  {
    direction: "self_to_self",
    movement: "compound_meaning",
    answerForm: "meaning",
    substantiveAnswer: compoundAnswer,
    historyAction: "append",
    advanceLayer: true,
    question:
      "Why does thriving because you said you would do it and did—creating the work from code, with delay justified by time you actively put in—matter to you?",
  },
  {
    ...baseContext,
    layer: 3,
    sourceAnswer: compoundAnswer,
    evidenceText: compoundAnswer,
    questionFailureMode: "fallback",
  },
)

assert(
  recoveredCompoundDecision.question ===
    "Why does it matter that your thriving comes from keeping your commitment, creating the work, and actually putting in the time?",
  "The compound fallback must return the locked human question.",
)

const consistencyLessonAnswer =
  "showing boring consistency = success is an important lesson, life doesn't always need to be hype and holidays"

expectThrows(
  () =>
    validateCompassQuestion({
      question: "Why does this matter to you?",
      sourceAnswer: consistencyLessonAnswer,
      evidenceText: consistencyLessonAnswer,
      priorQuestions: [],
    }),
  "substantive consistency lesson flattened into generic this",
)

const consistencyLessonQuestion =
  "Why does it matter that showing boring consistency can mean success and that life does not always need hype or holidays?"

validateCompassQuestion({
  question: consistencyLessonQuestion,
  sourceAnswer: consistencyLessonAnswer,
  evidenceText: consistencyLessonAnswer,
  priorQuestions: [],
})

const recoveredConsistencyLesson = validateCompassDescentDecision(
  {
    direction: "self_to_self",
    movement: "compound_meaning",
    answerForm: "meaning",
    substantiveAnswer: consistencyLessonAnswer,
    historyAction: "append",
    advanceLayer: true,
    question: "Why does this matter to you?",
  },
  {
    ...baseContext,
    layer: 5,
    sourceAnswer: consistencyLessonAnswer,
    evidenceText: consistencyLessonAnswer,
    questionFailureMode: "fallback",
  },
)

assert(
  recoveredConsistencyLesson.question === consistencyLessonQuestion,
  "Layer 5 must preserve the supplied consistency, success, and ordinary-life contrast.",
)

const earlierCommitmentQuestion =
  "Why does it matter that your thriving comes from keeping your commitment, creating the work, and actually putting in the time?"
const laterQuestions = [
  "Why does showing your family that consistency creates success matter to you?",
  consistencyLessonQuestion,
  "Why is an ordinary life important to you?",
  "Why is ordinary life important to you?",
]

expectThrows(
  () =>
    validateCompassQuestion({
      question: earlierCommitmentQuestion,
      sourceAnswer: "peace",
      evidenceText: `${compoundAnswer}\npeace`,
      priorQuestions: [earlierCommitmentQuestion, ...laterQuestions],
    }),
  "exact question repeated outside the former three-question lookback",
)

const crossLayerFallback = validateCompassDescentDecision(
  {
    direction: "self_to_self",
    movement: "new_meaning",
    answerForm: "meaning",
    substantiveAnswer: "peace",
    historyAction: "append",
    advanceLayer: true,
    question: earlierCommitmentQuestion,
  },
  {
    ...baseContext,
    layer: 6,
    sourceAnswer: "peace",
    evidenceText: `${compoundAnswer}\npeace`,
    recursiveLayers: [
      {
        ...acceptedLayer,
        question: earlierCommitmentQuestion,
        answer: compoundAnswer,
      },
      ...laterQuestions.map((question, index) => ({
        ...acceptedLayer,
        layer: index + 2,
        question,
        answer: `Later answer ${index + 1}`,
      })),
    ],
    currentQuestion: laterQuestions[laterQuestions.length - 1],
    questionFailureMode: "fallback",
  },
)

assert(
  crossLayerFallback.question === "Why does peace matter to you?",
  "A later fallback must follow only the latest answer, not recycle an earlier compound question.",
)

expectThrows(
  () =>
    validateCompassQuestion({
      question:
        "Why does meeting all the needs and wants of your family make freedom possible?",
      sourceAnswer:
        "I am meeting all the needs and wants of my family",
      evidenceText:
        "I am meeting all the needs and wants of my family. Freedom.",
      priorQuestions: [],
    }),
  "Why question moved into Possibility",
)

validateCompassQuestion({
  question: "Why is that possibility important to you?",
  sourceAnswer: "That possibility matters to me",
  evidenceText: "That possibility matters to me",
  priorQuestions: [],
})

expectThrows(
  () =>
    validateCompassQuestion({
      question: "Why does that affect you now?",
      sourceAnswer: "I was left out",
      evidenceText: "I was left out",
      priorQuestions: [],
    }),
  "present-time flattening",
)

expectThrows(
  () =>
    validateCompassQuestion({
      question: "Why did your parents give you so little?",
      sourceAnswer: "My parents gave me as little as possible",
      evidenceText: "My parents gave me as little as possible",
      priorQuestions: [],
    }),
  "investigating another person's motives",
)

validateCompassQuestion({
  question: "Why does feeling undeserving matter to you?",
  sourceAnswer: "I felt undeserving",
  evidenceText: "I felt undeserving",
  priorQuestions: ["Why does feeling left out matter to you?"],
})

expectThrows(
  () =>
    validateCompassQuestion({
      question: "Why does feeling left out matter to you?",
      sourceAnswer: "I felt left out",
      evidenceText: "I felt left out",
      priorQuestions: ["Why does feeling left out matter to you?"],
    }),
  "identical full question",
)

expectThrows(
  () =>
    validateCompassQuestion({
      question: "Why does this carry so much weight for you?",
      sourceAnswer: "This is important to me",
      evidenceText: "This is important to me",
      priorQuestions: [],
    }),
  "carry-weight template",
)

expectThrows(
  () =>
    validateCompassQuestion({
      question:
        "Why does not being allowed to be you matter to what you deserve?",
      sourceAnswer: "I am not allowed to be me. I must fit in and be like them.",
      evidenceText:
        "I am not allowed to be me. I must fit in and be like them.",
      priorQuestions: [],
    }),
  "question introduced deserving before the participant supplied it",
)

expectThrows(
  () =>
    validateCompassQuestion({
      question: "What makes freedom significant to you?",
      sourceAnswer: "Freedom",
      evidenceText: "Freedom",
      priorQuestions: [],
    }),
  "non-Why significance question",
)

const invalidQuestionDecision = {
  direction: "self_to_self" as const,
  movement: "new_meaning" as const,
  answerForm: "meaning" as const,
  substantiveAnswer: "it means nobody telling me what to do, freedom",
  historyAction: "append" as const,
  advanceLayer: true,
  question:
    "Why does freedom create a future in which nobody can interfere with you?",
}

expectThrows(
  () =>
    validateCompassDescentDecision(
      invalidQuestionDecision,
      baseContext,
    ),
  "invalid generated question still rejected by the strict contract",
)

const fallbackDecision = validateCompassDescentDecision(
  invalidQuestionDecision,
  {
    ...baseContext,
    questionFailureMode: "fallback",
  },
)

assert(
  fallbackDecision.question === "Why does freedom matter to you?",
  "The live path must replace rejected model wording with the supplied subject and Why.",
)

console.log("Compass Descent contract checks passed.")
