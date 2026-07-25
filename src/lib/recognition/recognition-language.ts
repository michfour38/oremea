export type RecognitionLanguageInput = {
  questionKey: string;
  response: string;
};

export type RecognitionLanguageCorrection = {
  original: string;
  normalized: string;
  basis: "protected_vocabulary" | "cross_answer_variant";
};

export type RecognitionNormalizedAnswer = {
  questionKey: string;
  rawResponse: string;
  normalizedResponse: string;
  corrections: RecognitionLanguageCorrection[];
};

export type RecognitionLanguageFamily = {
  canonical: string;
  variants: string[];
  questionKeys: string[];
  basis: "cross_answer_near_variant";
};

export type RecognitionLanguageNormalization = {
  answers: RecognitionNormalizedAnswer[];
  families: RecognitionLanguageFamily[];
};

const FUZZY_PROTECTED_VOCABULARY = [
  "because",
  "whenever",
  "depends",
  "dependent",
  "relies",
  "therefore",
  "uncertain",
  "unsure",
  "perhaps",
  "responsibility",
  "responsibilities",
];

const DIRECT_NORMALIZATIONS: Record<string, string> = {
  dont: "dont",
  "don't": "dont",
  didnt: "didnt",
  "didn't": "didnt",
  doesnt: "doesnt",
  "doesn't": "doesnt",
  isnt: "isnt",
  "isn't": "isnt",
  im: "im",
  "i'm": "im",
  cant: "cant",
  "can't": "cant",
  wont: "wont",
  "won't": "wont",
  wen: "when",
  becuse: "because",
  becuase: "because",
  becasue: "because",
  knwo: "know",
  suer: "sure",
  mabye: "maybe",
  therfore: "therefore",
  responsability: "responsibility",
};

const FAMILY_STOP_WORDS = new Set([
  "about",
  "after",
  "again",
  "also",
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

export function buildRecognitionLanguageNormalization(
  inputs: RecognitionLanguageInput[],
): RecognitionLanguageNormalization {
  const protectedAnswers = inputs.map((input) => {
    const result = normalizeProtectedVocabulary(input.response);

    return {
      questionKey: input.questionKey,
      rawResponse: input.response,
      protectedResponse: result.value,
      corrections: result.corrections,
    };
  });

  const families = buildCrossAnswerFamilies(
    protectedAnswers.map((answer) => ({
      questionKey: answer.questionKey,
      response: answer.protectedResponse,
    })),
  );

  const familyMap = new Map<string, string>();
  for (const family of families) {
    for (const variant of family.variants) {
      familyMap.set(variant, family.canonical);
    }
  }

  const answers = protectedAnswers.map((answer) => {
    const familyCorrections: RecognitionLanguageCorrection[] = [];
    const normalizedResponse = replaceTokens(answer.protectedResponse, (token) => {
      const normalizedToken = canonicalToken(token);
      const canonical = familyMap.get(normalizedToken);

      if (!canonical || canonical === normalizedToken) {
        return token;
      }

      familyCorrections.push({
        original: token,
        normalized: canonical,
        basis: "cross_answer_variant",
      });

      return preserveSimpleCase(token, canonical);
    });

    return {
      questionKey: answer.questionKey,
      rawResponse: answer.rawResponse,
      normalizedResponse,
      corrections: dedupeCorrections([
        ...answer.corrections,
        ...familyCorrections,
      ]),
    };
  });

  return { answers, families };
}

export function normalizeRecognitionDetectionText(value: string): string {
  return normalizeProtectedVocabulary(value).value;
}

function normalizeProtectedVocabulary(value: string): {
  value: string;
  corrections: RecognitionLanguageCorrection[];
} {
  const corrections: RecognitionLanguageCorrection[] = [];

  const normalized = replaceTokens(value, (token) => {
    const lower = canonicalToken(token);
    const direct = DIRECT_NORMALIZATIONS[lower];

    if (direct) {
      if (direct !== lower) {
        corrections.push({
          original: token,
          normalized: direct,
          basis: "protected_vocabulary",
        });
      }

      return preserveSimpleCase(token, direct);
    }

    const protectedMatch = findProtectedVocabularyMatch(lower);
    if (!protectedMatch || protectedMatch === lower) {
      return token;
    }

    corrections.push({
      original: token,
      normalized: protectedMatch,
      basis: "protected_vocabulary",
    });

    return preserveSimpleCase(token, protectedMatch);
  });

  return {
    value: normalized,
    corrections: dedupeCorrections(corrections),
  };
}

function findProtectedVocabularyMatch(token: string): string | null {
  if (token.length < 5) return null;

  for (const candidate of FUZZY_PROTECTED_VOCABULARY) {
    if (!isPlausibleProtectedMatch(token, candidate)) continue;

    if (
      token === candidate ||
      isSingleInsertionDeletion(token, candidate) ||
      isAdjacentTransposition(token, candidate)
    ) {
      return candidate;
    }
  }

  return null;
}

function isPlausibleProtectedMatch(token: string, candidate: string): boolean {
  if (Math.abs(token.length - candidate.length) > 1) return false;

  if (isAdjacentTransposition(token, candidate)) return true;

  if (token.length >= 6 && candidate.length >= 6) {
    return token.slice(0, 2) === candidate.slice(0, 2);
  }

  return token[0] === candidate[0];
}

function buildCrossAnswerFamilies(
  inputs: RecognitionLanguageInput[],
): RecognitionLanguageFamily[] {
  const tokenMap = new Map<
    string,
    { questionKeys: Set<string>; count: number }
  >();

  for (const input of inputs) {
    for (const token of tokenizeForFamilies(input.response)) {
      const current = tokenMap.get(token) ?? {
        questionKeys: new Set<string>(),
        count: 0,
      };

      current.questionKeys.add(input.questionKey);
      current.count += 1;
      tokenMap.set(token, current);
    }
  }

  const tokens = [...tokenMap.keys()];
  const parent = new Map(tokens.map((token) => [token, token]));

  function find(token: string): string {
    const current = parent.get(token) ?? token;
    if (current === token) return token;

    const root = find(current);
    parent.set(token, root);
    return root;
  }

  function union(left: string, right: string) {
    const leftRoot = find(left);
    const rightRoot = find(right);
    if (leftRoot !== rightRoot) parent.set(rightRoot, leftRoot);
  }

  for (let i = 0; i < tokens.length; i += 1) {
    for (let j = i + 1; j < tokens.length; j += 1) {
      if (areConservativeVariants(tokens[i], tokens[j])) {
        union(tokens[i], tokens[j]);
      }
    }
  }

  const groups = new Map<string, string[]>();
  for (const token of tokens) {
    const root = find(token);
    const group = groups.get(root) ?? [];
    group.push(token);
    groups.set(root, group);
  }

  return [...groups.values()]
    .filter((variants) => variants.length >= 2)
    .map((variants) => {
      const questionKeys = new Set<string>();
      for (const variant of variants) {
        for (const questionKey of tokenMap.get(variant)?.questionKeys ?? []) {
          questionKeys.add(questionKey);
        }
      }

      const canonical = chooseCanonicalVariant(variants, tokenMap);

      return {
        canonical,
        variants: [...variants].sort(),
        questionKeys: [...questionKeys],
        basis: "cross_answer_near_variant" as const,
      };
    })
    .filter((family) => family.questionKeys.length >= 2)
    .slice(0, 16);
}

function chooseCanonicalVariant(
  variants: string[],
  tokenMap: Map<string, { questionKeys: Set<string>; count: number }>,
): string {
  return [...variants].sort((left, right) => {
    const leftStats = tokenMap.get(left);
    const rightStats = tokenMap.get(right);
    const questionDifference =
      (rightStats?.questionKeys.size ?? 0) - (leftStats?.questionKeys.size ?? 0);

    if (questionDifference !== 0) return questionDifference;

    const countDifference =
      (rightStats?.count ?? 0) - (leftStats?.count ?? 0);
    if (countDifference !== 0) return countDifference;

    return right.length - left.length;
  })[0];
}

function areConservativeVariants(left: string, right: string): boolean {
  if (left === right) return true;

  const maxLength = Math.max(left.length, right.length);
  const minLength = Math.min(left.length, right.length);

  if (minLength < 5 || Math.abs(left.length - right.length) > 1) return false;

  if (isAdjacentTransposition(left, right)) return true;

  if (maxLength >= 7 && left.slice(0, 2) !== right.slice(0, 2)) {
    return false;
  }

  return isSingleInsertionDeletion(left, right);
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
  for (let i = 0; i < left.length; i += 1) {
    if (left[i] !== right[i]) differences.push(i);
  }

  if (differences.length !== 2) return false;

  const [first, second] = differences;
  return (
    second === first + 1 &&
    left[first] === right[second] &&
    left[second] === right[first]
  );
}

function tokenizeForFamilies(value: string): string[] {
  return (value.toLowerCase().match(/[a-z0-9][a-z0-9'-]*/g) ?? [])
    .map(canonicalToken)
    .filter(
      (token) =>
        token.length >= 5 &&
        !FAMILY_STOP_WORDS.has(token) &&
        !/^\d+$/.test(token),
    );
}

function replaceTokens(
  value: string,
  replace: (token: string) => string,
): string {
  return value.replace(/[A-Za-z0-9][A-Za-z0-9'-]*/g, (token) => replace(token));
}

function canonicalToken(token: string): string {
  return token.toLowerCase().replace(/[’']/g, "'");
}

function preserveSimpleCase(original: string, normalized: string): string {
  if (original === original.toUpperCase()) return normalized.toUpperCase();
  if (original[0] === original[0]?.toUpperCase()) {
    return `${normalized[0]?.toUpperCase() ?? ""}${normalized.slice(1)}`;
  }

  return normalized;
}

function dedupeCorrections(
  corrections: RecognitionLanguageCorrection[],
): RecognitionLanguageCorrection[] {
  const seen = new Set<string>();

  return corrections.filter((correction) => {
    const key = `${correction.original.toLowerCase()}:${correction.normalized}:${correction.basis}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}
