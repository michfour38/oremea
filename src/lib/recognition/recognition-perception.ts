import { runELPerception } from "@/src/lib/el/el-core";
import type {
  ELPerceptionOutput,
  EvidenceType,
  ObservationType,
} from "@/src/lib/el/el-types";
import {
  buildRecognitionLanguageNormalization,
  type RecognitionLanguageCorrection,
  type RecognitionLanguageFamily,
} from "@/src/lib/recognition/recognition-language";

export type RecognitionPerceptionInput = {
  questionKey: string;
  questionText: string;
  response: string;
};

export type RecognitionAnswerPerception = RecognitionPerceptionInput & {
  normalizedResponse: string;
  languageCorrections: RecognitionLanguageCorrection[];
  perception: ELPerceptionOutput;
};

export type RecurringLanguageSignal = {
  term: string;
  questionKeys: string[];
  answerCount: number;
};

export type RecurringObservationSignal = {
  type: ObservationType;
  questionKeys: string[];
  answerCount: number;
};

export type RecognitionThemeContext = {
  questionKey: string;
  content: string;
  evidenceTypes: EvidenceType[];
};

export type SupportedThemeSignal = {
  term: string;
  questionKeys: string[];
  answerCount: number;
  contexts: RecognitionThemeContext[];
  basis: "literal_recurrence_across_three_or_more_answers";
};

export type RecognitionTensionEvidence = {
  questionKey: string;
  type: EvidenceType;
  content: string;
};

export type SupportedTensionSignal = {
  term: string;
  agencyEvidence: RecognitionTensionEvidence[];
  frictionEvidence: RecognitionTensionEvidence[];
  basis: "shared_term_across_agency_and_friction_evidence";
};

export type RecognitionPerceptionSummary = {
  answers: RecognitionAnswerPerception[];
  recurringLanguage: RecurringLanguageSignal[];
  recurringObservations: RecurringObservationSignal[];
  supportedThemes: SupportedThemeSignal[];
  supportedTensions: SupportedTensionSignal[];
  languageFamilies: RecognitionLanguageFamily[];
};

const AGENCY_EVIDENCE_TYPES = new Set<EvidenceType>([
  "strength",
  "possibility",
  "choice",
  "movement",
]);

const FRICTION_EVIDENCE_TYPES = new Set<EvidenceType>(["objection"]);

const STOP_WORDS = new Set([
  "about",
  "after",
  "again",
  "also",
  "because",
  "been",
  "before",
  "being",
  "could",
  "does",
  "doing",
  "from",
  "have",
  "having",
  "into",
  "just",
  "like",
  "more",
  "most",
  "much",
  "only",
  "other",
  "really",
  "same",
  "something",
  "still",
  "than",
  "that",
  "their",
  "them",
  "then",
  "there",
  "these",
  "they",
  "thing",
  "things",
  "this",
  "those",
  "through",
  "very",
  "want",
  "what",
  "when",
  "where",
  "which",
  "while",
  "with",
  "would",
  "your",
]);

export function buildRecognitionPerception(
  responses: RecognitionPerceptionInput[],
): RecognitionPerceptionSummary {
  const language = buildRecognitionLanguageNormalization(
    responses.map((item) => ({
      questionKey: item.questionKey,
      response: item.response,
    })),
  );

  const answers: RecognitionAnswerPerception[] = responses.map((item) => {
    const normalized = language.answers.find(
      (answer) => answer.questionKey === item.questionKey,
    );
    const normalizedResponse = normalized?.normalizedResponse ?? item.response;
    const sharedPerception = runELPerception({
      participantResponse: normalizedResponse,
    });

    return {
      ...item,
      normalizedResponse,
      languageCorrections: normalized?.corrections ?? [],
      perception: sanitizeSharedELPerceptionForRecognition(sharedPerception),
    };
  });

  const recurringLanguage = findRecurringLanguage(
    answers.map((answer) => ({
      questionKey: answer.questionKey,
      questionText: answer.questionText,
      response: answer.normalizedResponse,
    })),
  );

  return {
    answers,
    recurringLanguage,
    recurringObservations: findRecurringObservations(answers),
    supportedThemes: findSupportedThemes(answers, recurringLanguage),
    supportedTensions: findSupportedTensions(answers, recurringLanguage),
    languageFamilies: language.families,
  };
}

function sanitizeSharedELPerceptionForRecognition(
  perception: ELPerceptionOutput,
): ELPerceptionOutput {
  return {
    ...perception,
    observations: perception.observations.filter(
      (observation) => observation.type !== "activation",
    ),
    scores: {
      ...perception.scores,
      activation: 0,
      drift: 0,
      momentum: 0,
    },
  };
}

function findRecurringLanguage(
  responses: RecognitionPerceptionInput[],
): RecurringLanguageSignal[] {
  const occurrenceMap = new Map<
    string,
    {
      questionKeys: Set<string>;
      totalCount: number;
    }
  >();

  for (const response of responses) {
    const terms = tokenize(response.response);

    for (const term of terms) {
      const current = occurrenceMap.get(term) ?? {
        questionKeys: new Set<string>(),
        totalCount: 0,
      };

      current.questionKeys.add(response.questionKey);
      current.totalCount += 1;
      occurrenceMap.set(term, current);
    }
  }

  return [...occurrenceMap.entries()]
    .filter(([, value]) => value.questionKeys.size >= 2)
    .sort(([, left], [, right]) => {
      if (right.questionKeys.size !== left.questionKeys.size) {
        return right.questionKeys.size - left.questionKeys.size;
      }

      return right.totalCount - left.totalCount;
    })
    .slice(0, 12)
    .map(([term, value]) => ({
      term,
      questionKeys: [...value.questionKeys],
      answerCount: value.questionKeys.size,
    }));
}

function findRecurringObservations(
  answers: RecognitionAnswerPerception[],
): RecurringObservationSignal[] {
  const observationMap = new Map<ObservationType, Set<string>>();

  for (const answer of answers) {
    const observationTypes = new Set(
      answer.perception.observations.map((observation) => observation.type),
    );

    for (const type of observationTypes) {
      const questionKeys = observationMap.get(type) ?? new Set<string>();
      questionKeys.add(answer.questionKey);
      observationMap.set(type, questionKeys);
    }
  }

  return [...observationMap.entries()]
    .filter(([, questionKeys]) => questionKeys.size >= 2)
    .sort(([, left], [, right]) => right.size - left.size)
    .map(([type, questionKeys]) => ({
      type,
      questionKeys: [...questionKeys],
      answerCount: questionKeys.size,
    }));
}

function findSupportedThemes(
  answers: RecognitionAnswerPerception[],
  recurringLanguage: RecurringLanguageSignal[],
): SupportedThemeSignal[] {
  return recurringLanguage
    .filter((item) => item.answerCount >= 3)
    .map((item) => {
      const contexts = answers
        .filter((answer) => item.questionKeys.includes(answer.questionKey))
        .map((answer) => ({
          questionKey: answer.questionKey,
          content: extractTermContext(
            answer.response,
            answer.normalizedResponse,
            item.term,
          ),
          evidenceTypes: dedupeEvidenceTypes(
            answer.perception.evidence
              .filter((evidence) => containsLiteralTerm(evidence.content, item.term))
              .map((evidence) => evidence.type),
          ),
        }));

      return {
        term: item.term,
        questionKeys: item.questionKeys,
        answerCount: item.answerCount,
        contexts,
        basis: "literal_recurrence_across_three_or_more_answers" as const,
      };
    })
    .slice(0, 8);
}

function findSupportedTensions(
  answers: RecognitionAnswerPerception[],
  recurringLanguage: RecurringLanguageSignal[],
): SupportedTensionSignal[] {
  const tensions: SupportedTensionSignal[] = [];

  for (const recurring of recurringLanguage) {
    const agencyEvidence: RecognitionTensionEvidence[] = [];
    const frictionEvidence: RecognitionTensionEvidence[] = [];

    for (const answer of answers) {
      if (!recurring.questionKeys.includes(answer.questionKey)) continue;

      for (const evidence of answer.perception.evidence) {
        if (!containsLiteralTerm(evidence.content, recurring.term)) continue;

        const item: RecognitionTensionEvidence = {
          questionKey: answer.questionKey,
          type: evidence.type,
          content: extractTermContext(
            answer.response,
            answer.normalizedResponse,
            recurring.term,
          ),
        };

        if (AGENCY_EVIDENCE_TYPES.has(evidence.type)) {
          agencyEvidence.push(item);
        }

        if (FRICTION_EVIDENCE_TYPES.has(evidence.type)) {
          frictionEvidence.push(item);
        }
      }
    }

    const agencyQuestionKeys = new Set(
      agencyEvidence.map((item) => item.questionKey),
    );
    const frictionQuestionKeys = new Set(
      frictionEvidence.map((item) => item.questionKey),
    );

    const spansDifferentAnswers = [...agencyQuestionKeys].some((agencyKey) =>
      [...frictionQuestionKeys].some((frictionKey) => frictionKey !== agencyKey),
    );

    if (
      agencyEvidence.length === 0 ||
      frictionEvidence.length === 0 ||
      !spansDifferentAnswers
    ) {
      continue;
    }

    tensions.push({
      term: recurring.term,
      agencyEvidence: dedupeTensionEvidence(agencyEvidence),
      frictionEvidence: dedupeTensionEvidence(frictionEvidence),
      basis: "shared_term_across_agency_and_friction_evidence",
    });
  }

  return tensions.slice(0, 6);
}

function dedupeTensionEvidence(
  evidence: RecognitionTensionEvidence[],
): RecognitionTensionEvidence[] {
  const seen = new Set<string>();

  return evidence.filter((item) => {
    const key = `${item.questionKey}:${item.type}:${item.content.toLowerCase()}`;

    if (seen.has(key)) return false;

    seen.add(key);
    return true;
  });
}

function dedupeEvidenceTypes(types: EvidenceType[]): EvidenceType[] {
  return [...new Set(types)];
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
  return value
    .trim()
    .replace(/\s+/g, " ")
    .split(/(?<=[.!?])\s+/)
    .map((sentence) => sentence.trim())
    .filter(Boolean);
}

function containsLiteralTerm(content: string, term: string): boolean {
  const escaped = term.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const pattern = new RegExp(`\\b${escaped}\\b`, "i");

  return pattern.test(content);
}

function tokenize(value: string): string[] {
  return (
    value
      .toLowerCase()
      .match(/[a-z0-9][a-z0-9'-]*/g) ?? []
  ).filter(
    (term) =>
      term.length >= 4 &&
      !STOP_WORDS.has(term) &&
      !/^\d+$/.test(term),
  );
}
