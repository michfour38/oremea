import type { EvidenceType } from "@/src/lib/el/el-types";
import { normalizeRecognitionDetectionText } from "@/src/lib/recognition/recognition-language";

export type RecognitionClarityInput = {
  questionKey: string;
  response: string;
  normalizedResponse?: string;
  evidenceTypes: EvidenceType[];
};

export type RecognitionClarityContext = {
  questionKey: string;
  content: string;
  normalizedContent?: string;
  evidenceTypes: EvidenceType[];
};

export type RecognitionUncertaintyContext = RecognitionClarityContext & {
  markers: string[];
};

export type RecognitionClarityAlongsideTension = {
  term: string;
  contexts: RecognitionClarityContext[];
};

export type RecognitionClarityMap = {
  statedClarity: RecognitionClarityContext[];
  distinctions: RecognitionClarityContext[];
  clarityConditions: RecognitionClarityContext[];
  newlyVisible: RecognitionClarityContext[];
  explicitUncertainty: RecognitionUncertaintyContext[];
  clarityAlongsideTension: RecognitionClarityAlongsideTension[];
};

const UNCERTAINTY_MARKERS = [
  "i dont know",
  "i do not know",
  "not sure",
  "unsure",
  "maybe",
  "perhaps",
  "i guess",
  "im uncertain",
  "i am uncertain",
];

export function buildRecognitionClarityMap(
  inputs: RecognitionClarityInput[],
  supportedTensionTerms: string[],
): RecognitionClarityMap {
  const clarityInput = inputs.find((item) => item.questionKey === "clarity");

  const statedClarity = clarityInput
    ? buildStatedClarity(clarityInput)
    : [];

  const distinctions = buildQuestionContexts(inputs, "distinction");
  const clarityConditions = buildQuestionContexts(inputs, "clarity_holding");
  const newlyVisible = buildQuestionContexts(inputs, "recognition");
  const explicitUncertainty = findExplicitUncertainty(inputs);

  return {
    statedClarity,
    distinctions,
    clarityConditions,
    newlyVisible,
    explicitUncertainty,
    clarityAlongsideTension: findClarityAlongsideTension({
      statedClarity,
      clarityConditions,
      newlyVisible,
      supportedTensionTerms,
    }),
  };
}

function buildStatedClarity(
  input: RecognitionClarityInput,
): RecognitionClarityContext[] {
  const sentencePairs = pairSentences(
    input.response,
    input.normalizedResponse ?? normalizeRecognitionDetectionText(input.response),
  );
  const clearSentences = sentencePairs.filter(
    (pair) => findUncertaintyMarkers(pair.normalized).length === 0,
  );

  if (clearSentences.length === 0) {
    return [];
  }

  return [
    {
      questionKey: input.questionKey,
      content: clearSentences.map((pair) => pair.raw).join(" "),
      normalizedContent: clearSentences
        .map((pair) => pair.normalized)
        .join(" "),
      evidenceTypes: input.evidenceTypes,
    },
  ];
}

function buildQuestionContexts(
  inputs: RecognitionClarityInput[],
  questionKey: string,
): RecognitionClarityContext[] {
  return inputs
    .filter((item) => item.questionKey === questionKey && item.response.trim())
    .map((item) => ({
      questionKey: item.questionKey,
      content: item.response.trim(),
      normalizedContent:
        item.normalizedResponse?.trim() ??
        normalizeRecognitionDetectionText(item.response).trim(),
      evidenceTypes: item.evidenceTypes,
    }));
}

function findExplicitUncertainty(
  inputs: RecognitionClarityInput[],
): RecognitionUncertaintyContext[] {
  const contexts: RecognitionUncertaintyContext[] = [];

  for (const input of inputs) {
    const normalizedResponse =
      input.normalizedResponse ?? normalizeRecognitionDetectionText(input.response);

    for (const pair of pairSentences(input.response, normalizedResponse)) {
      const markers = findUncertaintyMarkers(pair.normalized);

      if (markers.length === 0) continue;

      contexts.push({
        questionKey: input.questionKey,
        content: pair.raw,
        normalizedContent: pair.normalized,
        evidenceTypes: input.evidenceTypes,
        markers,
      });
    }
  }

  return contexts.slice(0, 10);
}

function findClarityAlongsideTension({
  statedClarity,
  clarityConditions,
  newlyVisible,
  supportedTensionTerms,
}: {
  statedClarity: RecognitionClarityContext[];
  clarityConditions: RecognitionClarityContext[];
  newlyVisible: RecognitionClarityContext[];
  supportedTensionTerms: string[];
}): RecognitionClarityAlongsideTension[] {
  const clarityContexts = [
    ...statedClarity,
    ...clarityConditions,
    ...newlyVisible,
  ];

  return supportedTensionTerms
    .map((term) => ({
      term,
      contexts: clarityContexts.filter((context) =>
        containsTolerantTerm(
          context.normalizedContent ??
            normalizeRecognitionDetectionText(context.content),
          term,
        ),
      ),
    }))
    .filter((item) => item.contexts.length > 0)
    .slice(0, 6);
}

function findUncertaintyMarkers(value: string): string[] {
  const normalized = normalizeUncertaintyText(value);

  return UNCERTAINTY_MARKERS.filter((marker) => normalized.includes(marker));
}

function normalizeUncertaintyText(value: string): string {
  return value
    .toLowerCase()
    .replace(/[’']/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

function pairSentences(
  rawValue: string,
  normalizedValue: string,
): Array<{ raw: string; normalized: string }> {
  const rawSentences = splitSentences(rawValue);
  const normalizedSentences = splitSentences(normalizedValue);
  const length = Math.max(rawSentences.length, normalizedSentences.length);

  return Array.from({ length }, (_, index) => ({
    raw: rawSentences[index] ?? normalizedSentences[index] ?? "",
    normalized: normalizedSentences[index] ?? rawSentences[index] ?? "",
  })).filter((pair) => pair.raw || pair.normalized);
}

function splitSentences(value: string): string[] {
  const normalized = value.trim().replace(/\s+/g, " ");

  if (!normalized) return [];

  return normalized
    .split(/(?<=[.!?])\s+/)
    .map((sentence) => sentence.trim())
    .filter(Boolean);
}

function containsTolerantTerm(content: string, term: string): boolean {
  const normalizedTerm = term.toLowerCase();
  const tokens = content.toLowerCase().match(/[a-z0-9][a-z0-9'-]*/g) ?? [];

  return tokens.some((token) => {
    if (token === normalizedTerm) return true;
    if (token.length < 5 || normalizedTerm.length < 5) return false;
    if (Math.abs(token.length - normalizedTerm.length) > 1) return false;

    if (isAdjacentTransposition(token, normalizedTerm)) return true;

    if (
      Math.max(token.length, normalizedTerm.length) >= 7 &&
      token.slice(0, 2) !== normalizedTerm.slice(0, 2)
    ) {
      return false;
    }

    return isSingleInsertionDeletion(token, normalizedTerm);
  });
}

function isSingleInsertionDeletion(left: string, right: string): boolean {
  if (Math.abs(left.length - right.length) !== 1) return false;

  const shorter = left.length < right.length ? left : right;
  const longer = left.length < right.length ? right : left;
  let shortIndex = 0;
  let longIndex = 0;
  let skipped = false;

  while (shortIndex < shorter.length && longIndex < longer.length) {
    if (shorter[shortIndex] === longer[longIndex]) {
      shortIndex += 1;
      longIndex += 1;
      continue;
    }

    if (skipped) return false;
    skipped = true;
    longIndex += 1;
  }

  return true;
}

function isAdjacentTransposition(left: string, right: string): boolean {
  if (left.length !== right.length) return false;

  const differences: number[] = [];
  for (let index = 0; index < left.length; index += 1) {
    if (left[index] !== right[index]) differences.push(index);
  }

  if (differences.length !== 2) return false;

  const [first, second] = differences;
  return (
    second === first + 1 &&
    left[first] === right[second] &&
    left[second] === right[first]
  );
}
