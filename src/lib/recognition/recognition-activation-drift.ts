import type { EvidenceType } from "@/src/lib/el/el-types";
import type { RecognitionClarityMap } from "@/src/lib/recognition/recognition-clarity";
import type {
  RecognitionAnswerPerception,
  RecurringLanguageSignal,
} from "@/src/lib/recognition/recognition-perception";

export type RecognitionActivationBasis =
  | "sustained_participant_salience"
  | "importance_carried_into_later_seeing"
  | "subject_concentrates_in_final_recognition";

export type RecognitionActivationContext = {
  questionKey: string;
  content: string;
  evidenceTypes: EvidenceType[];
};

export type RecognitionActivatedSubject = {
  term: string;
  questionKeys: string[];
  bases: RecognitionActivationBasis[];
  contexts: RecognitionActivationContext[];
};

export type RecognitionDriftKind =
  | "losing_sight"
  | "second_guessing"
  | "circularity"
  | "pulled_away"
  | "difficulty_staying_with_clarity";

export type RecognitionDriftSignal = {
  questionKey: string;
  kind: RecognitionDriftKind;
  marker: string;
  content: string;
  evidenceTypes: EvidenceType[];
};

export type RecognitionActivationDriftMap = {
  activatedSubjects: RecognitionActivatedSubject[];
  clarityHoldingConditions: RecognitionActivationContext[];
  explicitDriftSignals: RecognitionDriftSignal[];
};

const SALIENCE_KEYS = new Set(["attention", "returning", "weight"]);
const LATER_SEEING_KEYS = new Set([
  "distinction",
  "clarity",
  "clarity_holding",
  "recognition",
]);

const DRIFT_PATTERNS: Array<{
  kind: RecognitionDriftKind;
  marker: string;
  pattern: RegExp;
}> = [
  {
    kind: "losing_sight",
    marker: "lose sight",
    pattern: /\b(?:lose|losing|lost)\s+(?:sight|track)\b/i,
  },
  {
    kind: "losing_sight",
    marker: "forget what I know or want",
    pattern:
      /\b(?:forget|forgetting|forgot)\b[^.!?]{0,45}\b(?:what\s+i\s+(?:know|want|decided|saw|see)|why\s+i|my\s+clarity|what\s+matters)\b/i,
  },
  {
    kind: "second_guessing",
    marker: "second guess",
    pattern: /\bsecond[-\s]?guess(?:ing|ed)?\b/i,
  },
  {
    kind: "second_guessing",
    marker: "talk myself out of",
    pattern: /\btalk(?:ed|ing)?\s+myself\s+out\s+of\b/i,
  },
  {
    kind: "circularity",
    marker: "go in circles",
    pattern: /\b(?:go|going|went|keep|keeps|kept)\b[^.!?]{0,30}\b(?:circle|circles|circling)\b/i,
  },
  {
    kind: "pulled_away",
    marker: "pulled away",
    pattern: /\b(?:get|gets|got|being|feel|feels|felt)?\s*(?:pulled|drawn)\s+away\b/i,
  },
  {
    kind: "pulled_away",
    marker: "distracted from",
    pattern: /\b(?:distract|distracted|distracting|distraction)\b[^.!?]{0,30}\b(?:from|away)\b/i,
  },
  {
    kind: "difficulty_staying_with_clarity",
    marker: "hard to hold",
    pattern: /\b(?:hard|difficult)\s+to\s+(?:hold|stay|remain)\b/i,
  },
  {
    kind: "difficulty_staying_with_clarity",
    marker: "cannot hold onto",
    pattern: /\b(?:can't|cant|cannot|can\s+not)\s+(?:hold|stay)\b/i,
  },
  {
    kind: "difficulty_staying_with_clarity",
    marker: "slips away",
    pattern: /\b(?:slip|slips|slipped|slipping|drift|drifts|drifted|drifting)\s+away\b/i,
  },
];

export function buildRecognitionActivationDriftMap(params: {
  answers: RecognitionAnswerPerception[];
  recurringLanguage: RecurringLanguageSignal[];
  clarityMap: RecognitionClarityMap;
}): RecognitionActivationDriftMap {
  const { answers, recurringLanguage, clarityMap } = params;

  return {
    activatedSubjects: buildActivatedSubjects(answers, recurringLanguage),
    clarityHoldingConditions: clarityMap.clarityConditions.map((context) => ({
      questionKey: context.questionKey,
      content: context.content,
      evidenceTypes: context.evidenceTypes,
    })),
    explicitDriftSignals: findExplicitDriftSignals(answers),
  };
}

function buildActivatedSubjects(
  answers: RecognitionAnswerPerception[],
  recurringLanguage: RecurringLanguageSignal[],
): RecognitionActivatedSubject[] {
  return recurringLanguage
    .map((recurring) => {
      const keys = new Set(recurring.questionKeys);
      const salienceKeys = recurring.questionKeys.filter((key) =>
        SALIENCE_KEYS.has(key),
      );
      const laterSeeingKeys = recurring.questionKeys.filter((key) =>
        LATER_SEEING_KEYS.has(key),
      );
      const bases: RecognitionActivationBasis[] = [];

      if (salienceKeys.length >= 2) {
        bases.push("sustained_participant_salience");
      }

      if (
        keys.has("weight") &&
        ["distinction", "clarity", "recognition"].some((key) => keys.has(key))
      ) {
        bases.push("importance_carried_into_later_seeing");
      }

      if (
        keys.has("recognition") &&
        (recurring.answerCount >= 3 || laterSeeingKeys.length >= 2)
      ) {
        bases.push("subject_concentrates_in_final_recognition");
      }

      if (bases.length === 0) return null;

      return {
        term: recurring.term,
        questionKeys: recurring.questionKeys,
        bases,
        contexts: answers
          .filter((answer) => recurring.questionKeys.includes(answer.questionKey))
          .map((answer) => ({
            questionKey: answer.questionKey,
            content: extractTermContext(
              answer.response,
              answer.normalizedResponse,
              recurring.term,
            ),
            evidenceTypes: [
              ...new Set(
                answer.perception.evidence
                  .filter((evidence) =>
                    containsLiteralTerm(evidence.content, recurring.term),
                  )
                  .map((evidence) => evidence.type),
              ),
            ],
          })),
      } satisfies RecognitionActivatedSubject;
    })
    .filter((item): item is RecognitionActivatedSubject => item !== null)
    .sort((left, right) => {
      if (right.bases.length !== left.bases.length) {
        return right.bases.length - left.bases.length;
      }
      return right.questionKeys.length - left.questionKeys.length;
    })
    .slice(0, 8);
}

function findExplicitDriftSignals(
  answers: RecognitionAnswerPerception[],
): RecognitionDriftSignal[] {
  const signals: RecognitionDriftSignal[] = [];
  const seen = new Set<string>();

  for (const answer of answers) {
    const rawSentences = splitSentences(answer.response);
    const normalizedSentences = splitSentences(answer.normalizedResponse);

    for (let index = 0; index < normalizedSentences.length; index += 1) {
      const normalizedSentence = normalizedSentences[index];
      const rawSentence = rawSentences[index] ?? normalizedSentence;

      for (const drift of DRIFT_PATTERNS) {
        if (!drift.pattern.test(normalizedSentence)) continue;

        const key = `${answer.questionKey}:${drift.kind}:${rawSentence.toLowerCase()}`;
        if (seen.has(key)) continue;
        seen.add(key);

        signals.push({
          questionKey: answer.questionKey,
          kind: drift.kind,
          marker: drift.marker,
          content: rawSentence,
          evidenceTypes: [
            ...new Set(answer.perception.evidence.map((evidence) => evidence.type)),
          ],
        });
      }
    }
  }

  return signals.slice(0, 12);
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
