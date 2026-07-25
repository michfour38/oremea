import type { EvidenceType } from "@/src/lib/el/el-types";
import {
  buildRecognitionActivationDriftMap,
  type RecognitionActivationDriftMap,
  type RecognitionDriftKind,
} from "@/src/lib/recognition/recognition-activation-drift";
import type { RecognitionClarityMap } from "@/src/lib/recognition/recognition-clarity";
import type { RecognitionMovementMap } from "@/src/lib/recognition/recognition-movement";
import type { RecognitionParticipantSignalMap } from "@/src/lib/recognition/recognition-participant-signals";
import type { RecognitionPerceptionSummary } from "@/src/lib/recognition/recognition-perception";
import type { RecognitionRelationshipMap } from "@/src/lib/recognition/recognition-relationships";

export type RecognitionEvidenceLevel =
  | "single_signal"
  | "direct_statement"
  | "supported_pattern"
  | "converging_structure";

export type RecognitionReflectionDepth =
  | "opening_only"
  | "plain_reflection"
  | "connected_reflection"
  | "central_reflection_candidate";

export type RecognitionAuthorityDomain =
  | "attention"
  | "participant_noticed_recurrence"
  | "self_participation"
  | "importance"
  | "distinction"
  | "clarity"
  | "clarity_conditions"
  | "newly_visible"
  | "explicit_losing_sight"
  | "explicit_second_guessing"
  | "explicit_circularity"
  | "explicit_pulled_away"
  | "explicit_difficulty_staying_with_clarity";

export type RecognitionDirectAuthority = {
  domain: RecognitionAuthorityDomain;
  questionKey: string;
  content: string;
  evidenceTypes: EvidenceType[];
  level: "direct_statement";
  reflectionDepth: "plain_reflection";
};

export type RecognitionSupportForm =
  | "cross_answer_recurrence"
  | "supported_theme"
  | "supported_tension"
  | "participant_attention"
  | "participant_returning"
  | "participant_participation"
  | "participant_weight"
  | "participant_distinction"
  | "participant_clarity"
  | "participant_final_recognition"
  | "participant_relationship"
  | "continuing_reflection_thread"
  | "reflective_prominence";

type RecognitionSupportFamily =
  | "recurrence"
  | "participant_owned"
  | "relationship"
  | "tension";

export type RecognitionSubjectCalibration = {
  term: string;
  questionKeys: string[];
  answerCount: number;
  supportForms: RecognitionSupportForm[];
  supportFamilies: RecognitionSupportFamily[];
  rawContexts: Array<{
    questionKey: string;
    content: string;
  }>;
  level: "supported_pattern" | "converging_structure";
  reflectionDepth: "connected_reflection" | "central_reflection_candidate";
  basis:
    | "repeated_subject_across_answers"
    | "multiple_independent_support_families";
};

export type RecognitionEvidenceCalibrationMap = {
  singleSignalPolicy: {
    level: "single_signal";
    reflectionDepth: "opening_only";
  };
  directAuthorities: RecognitionDirectAuthority[];
  subjectCalibrations: RecognitionSubjectCalibration[];
  activationDrift: RecognitionActivationDriftMap;
};

export function buildRecognitionEvidenceCalibrationMap(params: {
  perception: RecognitionPerceptionSummary;
  clarityMap: RecognitionClarityMap;
  participantSignals: RecognitionParticipantSignalMap;
  relationshipMap: RecognitionRelationshipMap;
  movementMap: RecognitionMovementMap;
}): RecognitionEvidenceCalibrationMap {
  const {
    perception,
    clarityMap,
    participantSignals,
    relationshipMap,
    movementMap,
  } = params;

  const activationDrift = buildRecognitionActivationDriftMap({
    answers: perception.answers,
    recurringLanguage: perception.recurringLanguage,
    clarityMap,
  });

  return {
    singleSignalPolicy: {
      level: "single_signal",
      reflectionDepth: "opening_only",
    },
    directAuthorities: buildDirectAuthorities({
      participantSignals,
      clarityMap,
      activationDrift,
    }),
    subjectCalibrations: buildSubjectCalibrations({
      perception,
      clarityMap,
      participantSignals,
      relationshipMap,
      movementMap,
      activationDrift,
    }),
    activationDrift,
  };
}

function buildDirectAuthorities(params: {
  participantSignals: RecognitionParticipantSignalMap;
  clarityMap: RecognitionClarityMap;
  activationDrift: RecognitionActivationDriftMap;
}): RecognitionDirectAuthority[] {
  const { participantSignals, clarityMap, activationDrift } = params;

  return [
    ...toDirectAuthorities(participantSignals.attention, "attention"),
    ...toDirectAuthorities(
      participantSignals.returning,
      "participant_noticed_recurrence",
    ),
    ...toDirectAuthorities(participantSignals.participation, "self_participation"),
    ...toDirectAuthorities(participantSignals.weight, "importance"),
    ...toDirectAuthorities(clarityMap.distinctions, "distinction"),
    ...toDirectAuthorities(clarityMap.statedClarity, "clarity"),
    ...toDirectAuthorities(clarityMap.clarityConditions, "clarity_conditions"),
    ...toDirectAuthorities(clarityMap.newlyVisible, "newly_visible"),
    ...activationDrift.explicitDriftSignals.map((signal) => ({
      domain: driftAuthorityDomain(signal.kind),
      questionKey: signal.questionKey,
      content: signal.content,
      evidenceTypes: signal.evidenceTypes,
      level: "direct_statement" as const,
      reflectionDepth: "plain_reflection" as const,
    })),
  ];
}

function driftAuthorityDomain(
  kind: RecognitionDriftKind,
): RecognitionAuthorityDomain {
  switch (kind) {
    case "losing_sight":
      return "explicit_losing_sight";
    case "second_guessing":
      return "explicit_second_guessing";
    case "circularity":
      return "explicit_circularity";
    case "pulled_away":
      return "explicit_pulled_away";
    case "difficulty_staying_with_clarity":
      return "explicit_difficulty_staying_with_clarity";
  }
}

function toDirectAuthorities(
  contexts: Array<{
    questionKey: string;
    content: string;
    evidenceTypes: EvidenceType[];
  }>,
  domain: RecognitionAuthorityDomain,
): RecognitionDirectAuthority[] {
  return contexts
    .filter((context) => context.content.trim().length > 0)
    .map((context) => ({
      domain,
      questionKey: context.questionKey,
      content: context.content,
      evidenceTypes: context.evidenceTypes,
      level: "direct_statement" as const,
      reflectionDepth: "plain_reflection" as const,
    }));
}

function buildSubjectCalibrations(params: {
  perception: RecognitionPerceptionSummary;
  clarityMap: RecognitionClarityMap;
  participantSignals: RecognitionParticipantSignalMap;
  relationshipMap: RecognitionRelationshipMap;
  movementMap: RecognitionMovementMap;
  activationDrift: RecognitionActivationDriftMap;
}): RecognitionSubjectCalibration[] {
  const {
    perception,
    clarityMap,
    participantSignals,
    relationshipMap,
    movementMap,
    activationDrift,
  } = params;

  return perception.recurringLanguage
    .map((recurring) => {
      const supportForms = new Set<RecognitionSupportForm>([
        "cross_answer_recurrence",
      ]);

      if (perception.supportedThemes.some((item) => item.term === recurring.term)) {
        supportForms.add("supported_theme");
      }

      if (perception.supportedTensions.some((item) => item.term === recurring.term)) {
        supportForms.add("supported_tension");
      }

      if (hasSignalLink(participantSignals.attentionAcrossAnswers, recurring.term)) {
        supportForms.add("participant_attention");
      }

      if (hasSignalLink(participantSignals.returningAcrossAnswers, recurring.term)) {
        supportForms.add("participant_returning");
      }

      if (hasSignalLink(participantSignals.participationAcrossAnswers, recurring.term)) {
        supportForms.add("participant_participation");
      }

      if (hasSignalLink(participantSignals.weightAcrossAnswers, recurring.term)) {
        supportForms.add("participant_weight");
      }

      if (contextsContainTerm(clarityMap.distinctions, recurring.term)) {
        supportForms.add("participant_distinction");
      }

      if (contextsContainTerm(clarityMap.statedClarity, recurring.term)) {
        supportForms.add("participant_clarity");
      }

      if (contextsContainTerm(clarityMap.newlyVisible, recurring.term)) {
        supportForms.add("participant_final_recognition");
      }

      if (
        relationshipMap.linkedRecurringSubjects.some(
          (item) => item.term === recurring.term,
        )
      ) {
        supportForms.add("participant_relationship");
      }

      if (movementMap.continuingThreads.some((item) => item.term === recurring.term)) {
        supportForms.add("continuing_reflection_thread");
      }

      if (
        activationDrift.activatedSubjects.some(
          (item) => item.term === recurring.term,
        )
      ) {
        supportForms.add("reflective_prominence");
      }

      const forms = [...supportForms];
      const families = [...new Set(forms.map(toSupportFamily))];
      const participantOwnedForms = forms.filter(
        (form) => toSupportFamily(form) === "participant_owned",
      );
      const hasParticipantOwnedFamily = families.includes("participant_owned");
      const hasIndependentCompanion = families.some(
        (family) => family !== "participant_owned" && family !== "recurrence",
      );
      const hasSeveralParticipantOwnedDomains = participantOwnedForms.length >= 2;
      const converges =
        (hasParticipantOwnedFamily &&
          (hasIndependentCompanion || hasSeveralParticipantOwnedDomains) &&
          families.length >= 2) ||
        families.length >= 3;

      return {
        term: recurring.term,
        questionKeys: recurring.questionKeys,
        answerCount: recurring.answerCount,
        supportForms: forms,
        supportFamilies: families,
        rawContexts: rawContextsForTerm(
          perception,
          recurring.term,
          recurring.questionKeys,
        ),
        level: converges ? "converging_structure" : "supported_pattern",
        reflectionDepth: converges
          ? "central_reflection_candidate"
          : "connected_reflection",
        basis: converges
          ? "multiple_independent_support_families"
          : "repeated_subject_across_answers",
      } satisfies RecognitionSubjectCalibration;
    })
    .sort((left, right) => {
      if (left.level !== right.level) {
        return left.level === "converging_structure" ? -1 : 1;
      }

      if (right.supportFamilies.length !== left.supportFamilies.length) {
        return right.supportFamilies.length - left.supportFamilies.length;
      }

      if (right.supportForms.length !== left.supportForms.length) {
        return right.supportForms.length - left.supportForms.length;
      }

      return right.answerCount - left.answerCount;
    })
    .slice(0, 12);
}

function toSupportFamily(form: RecognitionSupportForm): RecognitionSupportFamily {
  if (
    form === "cross_answer_recurrence" ||
    form === "supported_theme" ||
    form === "continuing_reflection_thread" ||
    form === "reflective_prominence"
  ) {
    return "recurrence";
  }

  if (form === "supported_tension") return "tension";
  if (form === "participant_relationship") return "relationship";
  return "participant_owned";
}

function hasSignalLink(
  links: Array<{ term: string }>,
  term: string,
): boolean {
  return links.some((link) => link.term === term);
}

function contextsContainTerm(
  contexts: Array<{ content: string; normalizedContent?: string }>,
  term: string,
): boolean {
  return contexts.some((context) =>
    containsLiteralTerm(context.normalizedContent ?? context.content, term),
  );
}

function rawContextsForTerm(
  perception: RecognitionPerceptionSummary,
  term: string,
  questionKeys: string[],
): Array<{ questionKey: string; content: string }> {
  return perception.answers
    .filter((answer) => questionKeys.includes(answer.questionKey))
    .map((answer) => ({
      questionKey: answer.questionKey,
      content: extractTermContext(
        answer.response,
        answer.normalizedResponse,
        term,
      ),
    }));
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
