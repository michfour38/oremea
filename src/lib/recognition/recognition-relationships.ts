import type { EvidenceType } from "@/src/lib/el/el-types";
import type {
  RecognitionAnswerPerception,
  RecurringLanguageSignal,
} from "@/src/lib/recognition/recognition-perception";

export type RecognitionRelationshipKind =
  | "conditional"
  | "repeated_condition"
  | "participant_stated_explanation"
  | "dependency"
  | "consequence";

export type RecognitionRelationshipSignal = {
  questionKey: string;
  kind: RecognitionRelationshipKind;
  marker: string;
  content: string;
  normalizedContent: string;
  evidenceTypes: EvidenceType[];
};

export type RecognitionLinkedRecurringSubject = {
  term: string;
  questionKeys: string[];
  relationshipKinds: RecognitionRelationshipKind[];
  contexts: string[];
};

export type RecognitionRelationshipMap = {
  signals: RecognitionRelationshipSignal[];
  linkedRecurringSubjects: RecognitionLinkedRecurringSubject[];
};

type RelationshipPattern = {
  kind: RecognitionRelationshipKind;
  marker: string;
  pattern: RegExp;
};

type SpellingTolerantAnswer = RecognitionAnswerPerception & {
  normalizedResponse?: string;
};

const RELATIONSHIP_PATTERNS: RelationshipPattern[] = [
  {
    kind: "repeated_condition",
    marker: "every time",
    pattern: /\bevery time\b/i,
  },
  {
    kind: "repeated_condition",
    marker: "each time",
    pattern: /\beach time\b/i,
  },
  {
    kind: "repeated_condition",
    marker: "whenever",
    pattern: /\bwhenever\b/i,
  },
  {
    kind: "conditional",
    marker: "when",
    pattern: /\bwhen\b/i,
  },
  {
    kind: "conditional",
    marker: "if",
    pattern: /\bif\b/i,
  },
  {
    kind: "participant_stated_explanation",
    marker: "because",
    pattern: /\bbecause(?: of)?\b/i,
  },
  {
    kind: "participant_stated_explanation",
    marker: "due to",
    pattern: /\bdue to\b/i,
  },
  {
    kind: "dependency",
    marker: "depends on",
    pattern: /\bdepends? on\b/i,
  },
  {
    kind: "dependency",
    marker: "dependent on",
    pattern: /\bdependent on\b/i,
  },
  {
    kind: "dependency",
    marker: "relies on",
    pattern: /\brel(?:y|ies) on\b/i,
  },
  {
    kind: "consequence",
    marker: "as a result",
    pattern: /\bas a result\b/i,
  },
  {
    kind: "consequence",
    marker: "therefore",
    pattern: /\btherefore\b/i,
  },
  {
    kind: "consequence",
    marker: "which means",
    pattern: /\bwhich means\b/i,
  },
  {
    kind: "consequence",
    marker: "meaning that",
    pattern: /\bmeaning that\b/i,
  },
];

export function buildRecognitionRelationshipMap(
  answers: SpellingTolerantAnswer[],
  recurringLanguage: RecurringLanguageSignal[],
): RecognitionRelationshipMap {
  const signals = findRelationshipSignals(answers);

  return {
    signals,
    linkedRecurringSubjects: findLinkedRecurringSubjects(
      signals,
      recurringLanguage,
    ),
  };
}

function findRelationshipSignals(
  answers: SpellingTolerantAnswer[],
): RecognitionRelationshipSignal[] {
  const signals: RecognitionRelationshipSignal[] = [];
  const seen = new Set<string>();

  for (const answer of answers) {
    const rawSentences = splitSentences(answer.response);
    const normalizedSentences = splitSentences(
      answer.normalizedResponse ?? answer.response,
    );

    for (let index = 0; index < normalizedSentences.length; index += 1) {
      const normalizedSentence = normalizedSentences[index];
      const rawSentence = rawSentences[index] ?? normalizedSentence;

      for (const relationship of RELATIONSHIP_PATTERNS) {
        if (!relationship.pattern.test(normalizedSentence)) continue;

        const key = `${answer.questionKey}:${relationship.kind}:${relationship.marker}:${normalizedSentence.toLowerCase()}`;
        if (seen.has(key)) continue;
        seen.add(key);

        signals.push({
          questionKey: answer.questionKey,
          kind: relationship.kind,
          marker: relationship.marker,
          content: rawSentence,
          normalizedContent: normalizedSentence,
          evidenceTypes: [
            ...new Set(
              answer.perception.evidence
                .filter((evidence) =>
                  normalizedSentence
                    .toLowerCase()
                    .includes(evidence.content.toLowerCase()),
                )
                .map((evidence) => evidence.type),
            ),
          ],
        });
      }
    }
  }

  return signals.slice(0, 20);
}

function findLinkedRecurringSubjects(
  signals: RecognitionRelationshipSignal[],
  recurringLanguage: RecurringLanguageSignal[],
): RecognitionLinkedRecurringSubject[] {
  return recurringLanguage
    .map((recurring) => {
      const matchingSignals = signals.filter((signal) =>
        containsLiteralTerm(signal.normalizedContent, recurring.term),
      );
      const questionKeys = [
        ...new Set(matchingSignals.map((signal) => signal.questionKey)),
      ];

      return {
        term: recurring.term,
        questionKeys,
        relationshipKinds: [
          ...new Set(matchingSignals.map((signal) => signal.kind)),
        ],
        contexts: [...new Set(matchingSignals.map((signal) => signal.content))],
      };
    })
    .filter((item) => item.questionKeys.length >= 2)
    .slice(0, 8);
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
