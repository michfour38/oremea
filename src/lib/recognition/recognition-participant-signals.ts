import type { EvidenceType } from "@/src/lib/el/el-types";
import type {
  RecognitionAnswerPerception,
  RecurringLanguageSignal,
  SupportedThemeSignal,
} from "@/src/lib/recognition/recognition-perception";

export type RecognitionParticipantSignalContext = {
  questionKey: string;
  content: string;
  evidenceTypes: EvidenceType[];
};

export type RecognitionParticipantSignalLink = {
  term: string;
  answerCount: number;
  questionKeys: string[];
  otherQuestionKeys: string[];
};

export type RecognitionWeightedThemeLink = {
  term: string;
  answerCount: number;
  questionKeys: string[];
};

export type RecognitionParticipantSignalMap = {
  attention: RecognitionParticipantSignalContext[];
  returning: RecognitionParticipantSignalContext[];
  participation: RecognitionParticipantSignalContext[];
  weight: RecognitionParticipantSignalContext[];
  attentionAcrossAnswers: RecognitionParticipantSignalLink[];
  returningAcrossAnswers: RecognitionParticipantSignalLink[];
  participationAcrossAnswers: RecognitionParticipantSignalLink[];
  weightAcrossAnswers: RecognitionParticipantSignalLink[];
  weightedThemes: RecognitionWeightedThemeLink[];
};

export function buildRecognitionParticipantSignalMap(
  answers: RecognitionAnswerPerception[],
  recurringLanguage: RecurringLanguageSignal[],
  supportedThemes: SupportedThemeSignal[],
): RecognitionParticipantSignalMap {
  return {
    attention: getQuestionContext(answers, "attention"),
    returning: getQuestionContext(answers, "returning"),
    participation: getQuestionContext(answers, "participation"),
    weight: getQuestionContext(answers, "weight"),
    attentionAcrossAnswers: linkQuestionToRecurrence(
      "attention",
      recurringLanguage,
    ),
    returningAcrossAnswers: linkQuestionToRecurrence(
      "returning",
      recurringLanguage,
    ),
    participationAcrossAnswers: linkQuestionToRecurrence(
      "participation",
      recurringLanguage,
    ),
    weightAcrossAnswers: linkQuestionToRecurrence("weight", recurringLanguage),
    weightedThemes: supportedThemes
      .filter((theme) => theme.questionKeys.includes("weight"))
      .map((theme) => ({
        term: theme.term,
        answerCount: theme.answerCount,
        questionKeys: theme.questionKeys,
      })),
  };
}

function getQuestionContext(
  answers: RecognitionAnswerPerception[],
  questionKey: string,
): RecognitionParticipantSignalContext[] {
  return answers
    .filter((answer) => answer.questionKey === questionKey)
    .map((answer) => ({
      questionKey: answer.questionKey,
      content: answer.response,
      evidenceTypes: [
        ...new Set(answer.perception.evidence.map((evidence) => evidence.type)),
      ],
    }));
}

function linkQuestionToRecurrence(
  questionKey: string,
  recurringLanguage: RecurringLanguageSignal[],
): RecognitionParticipantSignalLink[] {
  return recurringLanguage
    .filter((item) => item.questionKeys.includes(questionKey))
    .map((item) => ({
      term: item.term,
      answerCount: item.answerCount,
      questionKeys: item.questionKeys,
      otherQuestionKeys: item.questionKeys.filter((key) => key !== questionKey),
    }))
    .filter((item) => item.otherQuestionKeys.length > 0)
    .slice(0, 8);
}
