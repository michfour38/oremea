import type { EvidenceType } from "@/src/lib/el/el-types";
import type {
  RecognitionAnswerPerception,
  RecurringLanguageSignal,
} from "@/src/lib/recognition/recognition-perception";

export type RecognitionMovementStageKey =
  | "attention"
  | "reality"
  | "people"
  | "returning"
  | "participation"
  | "weight"
  | "distinction"
  | "clarity"
  | "clarity_holding"
  | "recognition";

export type RecognitionMovementContext = {
  questionKey: RecognitionMovementStageKey;
  content: string;
  normalizedContent: string;
  evidenceTypes: EvidenceType[];
};

export type RecognitionContinuingThread = {
  term: string;
  firstQuestionKey: RecognitionMovementStageKey;
  lastQuestionKey: RecognitionMovementStageKey;
  questionKeys: RecognitionMovementStageKey[];
  contexts: RecognitionMovementContext[];
  basis: "recurring_subject_across_early_and_late_stages";
};

export type RecognitionMovementMap = {
  initialAttention: RecognitionMovementContext[];
  groundedReality: RecognitionMovementContext[];
  participantNoticedRecurrence: RecognitionMovementContext[];
  selfParticipation: RecognitionMovementContext[];
  statedWeight: RecognitionMovementContext[];
  distinctions: RecognitionMovementContext[];
  statedClarity: RecognitionMovementContext[];
  clarityConditions: RecognitionMovementContext[];
  finalRecognition: RecognitionMovementContext[];
  continuingThreads: RecognitionContinuingThread[];
};

const STAGE_ORDER: RecognitionMovementStageKey[] = [
  "attention",
  "reality",
  "people",
  "returning",
  "participation",
  "weight",
  "distinction",
  "clarity",
  "clarity_holding",
  "recognition",
];

const EARLY_STAGE_KEYS = new Set<RecognitionMovementStageKey>([
  "attention",
  "reality",
  "people",
]);

const LATE_STAGE_KEYS = new Set<RecognitionMovementStageKey>([
  "distinction",
  "clarity",
  "clarity_holding",
  "recognition",
]);

export function buildRecognitionMovementMap(
  answers: RecognitionAnswerPerception[],
  recurringLanguage: RecurringLanguageSignal[],
): RecognitionMovementMap {
  const contexts = answers
    .map(toMovementContext)
    .filter((context): context is RecognitionMovementContext => context !== null);

  return {
    initialAttention: getContexts(contexts, ["attention"]),
    groundedReality: getContexts(contexts, ["reality", "people"]),
    participantNoticedRecurrence: getContexts(contexts, ["returning"]),
    selfParticipation: getContexts(contexts, ["participation"]),
    statedWeight: getContexts(contexts, ["weight"]),
    distinctions: getContexts(contexts, ["distinction"]),
    statedClarity: getContexts(contexts, ["clarity"]),
    clarityConditions: getContexts(contexts, ["clarity_holding"]),
    finalRecognition: getContexts(contexts, ["recognition"]),
    continuingThreads: findContinuingThreads(contexts, recurringLanguage),
  };
}

function toMovementContext(
  answer: RecognitionAnswerPerception,
): RecognitionMovementContext | null {
  if (!isMovementStageKey(answer.questionKey)) return null;

  return {
    questionKey: answer.questionKey,
    content: answer.response,
    normalizedContent: answer.normalizedResponse,
    evidenceTypes: [
      ...new Set(answer.perception.evidence.map((evidence) => evidence.type)),
    ],
  };
}

function getContexts(
  contexts: RecognitionMovementContext[],
  keys: RecognitionMovementStageKey[],
): RecognitionMovementContext[] {
  const keySet = new Set(keys);
  return contexts.filter((context) => keySet.has(context.questionKey));
}

function findContinuingThreads(
  contexts: RecognitionMovementContext[],
  recurringLanguage: RecurringLanguageSignal[],
): RecognitionContinuingThread[] {
  return recurringLanguage
    .map((recurring) => {
      const matchingContexts = contexts.filter(
        (context) =>
          recurring.questionKeys.includes(context.questionKey) &&
          containsLiteralTerm(context.normalizedContent, recurring.term),
      );

      const orderedContexts = [...matchingContexts].sort(
        (left, right) =>
          stageIndex(left.questionKey) - stageIndex(right.questionKey),
      );
      const questionKeys = [
        ...new Set(orderedContexts.map((context) => context.questionKey)),
      ];

      const reachesFromEarlyToLate =
        questionKeys.some((key) => EARLY_STAGE_KEYS.has(key)) &&
        questionKeys.some((key) => LATE_STAGE_KEYS.has(key));

      if (!reachesFromEarlyToLate || orderedContexts.length < 2) return null;

      return {
        term: recurring.term,
        firstQuestionKey: orderedContexts[0].questionKey,
        lastQuestionKey: orderedContexts[orderedContexts.length - 1].questionKey,
        questionKeys,
        contexts: orderedContexts.map((context) => ({
          ...context,
          content: extractTermContext(
            context.content,
            context.normalizedContent,
            recurring.term,
          ),
        })),
        basis: "recurring_subject_across_early_and_late_stages" as const,
      };
    })
    .filter((item): item is RecognitionContinuingThread => item !== null)
    .sort((left, right) => {
      const leftSpan =
        stageIndex(left.lastQuestionKey) - stageIndex(left.firstQuestionKey);
      const rightSpan =
        stageIndex(right.lastQuestionKey) - stageIndex(right.firstQuestionKey);

      if (rightSpan !== leftSpan) return rightSpan - leftSpan;
      return right.questionKeys.length - left.questionKeys.length;
    })
    .slice(0, 8);
}

function extractTermContext(
  rawResponse: string,
  normalizedResponse: string,
  term: string,
): string {
  const rawSentences = splitSentences(rawResponse);
  const normalizedSentences = splitSentences(normalizedResponse);
  const matchingIndex = normalizedSentences.findIndex((sentence) =>
    containsLiteralTerm(sentence, term),
  );

  if (matchingIndex >= 0) {
    return rawSentences[matchingIndex] ?? normalizedSentences[matchingIndex];
  }

  return rawResponse.trim();
}

function splitSentences(value: string): string[] {
  const normalized = value.trim().replace(/\s+/g, " ");
  if (!normalized) return [];

  return normalized
    .split(/(?<=[.!?])\s+/)
    .map((sentence) => sentence.trim())
    .filter(Boolean);
}

function containsLiteralTerm(content: string, term: string): boolean {
  const escaped = term.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  return new RegExp(`\\b${escaped}\\b`, "i").test(content);
}

function isMovementStageKey(value: string): value is RecognitionMovementStageKey {
  return STAGE_ORDER.includes(value as RecognitionMovementStageKey);
}

function stageIndex(key: RecognitionMovementStageKey): number {
  return STAGE_ORDER.indexOf(key);
}
