const COMMON_LANGUAGE_TERMS = new Set([
  "a",
  "about",
  "after",
  "again",
  "against",
  "all",
  "also",
  "am",
  "an",
  "and",
  "another",
  "any",
  "are",
  "as",
  "at",
  "be",
  "because",
  "been",
  "before",
  "being",
  "between",
  "both",
  "but",
  "by",
  "can",
  "cannot",
  "cant",
  "could",
  "couldnt",
  "did",
  "didnt",
  "do",
  "does",
  "doesnt",
  "doing",
  "dont",
  "each",
  "even",
  "every",
  "for",
  "from",
  "had",
  "has",
  "have",
  "having",
  "he",
  "her",
  "hers",
  "him",
  "his",
  "how",
  "i",
  "if",
  "in",
  "into",
  "is",
  "isnt",
  "it",
  "its",
  "me",
  "more",
  "most",
  "my",
  "myself",
  "no",
  "nor",
  "not",
  "of",
  "on",
  "once",
  "only",
  "or",
  "other",
  "our",
  "ours",
  "out",
  "over",
  "same",
  "she",
  "should",
  "shouldnt",
  "so",
  "some",
  "such",
  "than",
  "that",
  "the",
  "their",
  "theirs",
  "them",
  "then",
  "there",
  "these",
  "they",
  "this",
  "those",
  "through",
  "to",
  "too",
  "under",
  "until",
  "up",
  "us",
  "very",
  "was",
  "wasnt",
  "we",
  "were",
  "werent",
  "what",
  "when",
  "where",
  "which",
  "while",
  "who",
  "whom",
  "whose",
  "why",
  "will",
  "with",
  "within",
  "without",
  "would",
  "wouldnt",
  "you",
  "your",
  "yours",
  "yourself",
])

export function findUnsupportedEvidenceTerms({
  text,
  evidenceText,
  allowedTerms = [],
  minimumLength = 4,
}: {
  text: string
  evidenceText: string
  allowedTerms?: readonly string[]
  minimumLength?: number
}): string[] {
  const evidenceRoots = unique(
    tokenizeEvidenceWords(evidenceText)
      .filter((word) => word.length >= minimumLength)
      .map(toLexicalRoot),
  )
  const allowedRoots = new Set(
    allowedTerms.map((word) => toLexicalRoot(normalizeWord(word))),
  )

  return unique(
    tokenizeEvidenceWords(text).filter((word) => {
      if (word.length < minimumLength) return false
      if (COMMON_LANGUAGE_TERMS.has(word)) return false

      const root = toLexicalRoot(word)
      if (allowedRoots.has(root)) return false

      return !evidenceRoots.some((evidenceRoot) =>
        rootsBelongTogether(root, evidenceRoot),
      )
    }),
  )
}

export function normalizeEvidenceText(input: string): string {
  return input
    .toLowerCase()
    .replace(/[’']/g, "")
    .replace(/\s+/g, " ")
    .trim()
}

export function evidenceContainsExactPhrase({
  evidenceText,
  phrase,
}: {
  evidenceText: string
  phrase: string
}): boolean {
  const normalizedPhrase = normalizeEvidenceText(phrase)

  return (
    normalizedPhrase.length >= 4 &&
    normalizeEvidenceText(evidenceText).includes(normalizedPhrase)
  )
}

function tokenizeEvidenceWords(input: string): string[] {
  return (
    normalizeEvidenceText(input)
      .match(/[a-z]+/g)
      ?.map(normalizeWord)
      .filter(Boolean) ?? []
  )
}

function normalizeWord(input: string): string {
  return input.toLowerCase().replace(/[^a-z]/g, "")
}

function toLexicalRoot(input: string): string {
  let word = normalizeWord(input)

  const suffixes = [
    "ingly",
    "edly",
    "ations",
    "ation",
    "itions",
    "ition",
    "ments",
    "ment",
    "ness",
    "ities",
    "ity",
    "ingly",
    "ingly",
    "ing",
    "edly",
    "edly",
    "ed",
    "ies",
    "es",
    "s",
  ]

  for (const suffix of suffixes) {
    if (word.length - suffix.length >= 4 && word.endsWith(suffix)) {
      word = word.slice(0, -suffix.length)
      break
    }
  }

  if (word.length >= 8 && word.endsWith("ly")) {
    word = word.slice(0, -2)
  }

  if (word.length > 5 && word.endsWith("e")) {
    word = word.slice(0, -1)
  }

  return word
}

function rootsBelongTogether(left: string, right: string): boolean {
  if (left === right) return true

  const shorter = Math.min(left.length, right.length)
  if (shorter >= 5 && commonPrefixLength(left, right) >= 5) {
    return true
  }

  return shorter >= 6 && editDistanceAtMostOne(left, right)
}

function commonPrefixLength(left: string, right: string): number {
  let index = 0
  const limit = Math.min(left.length, right.length)

  while (index < limit && left[index] === right[index]) {
    index += 1
  }

  return index
}

function editDistanceAtMostOne(left: string, right: string): boolean {
  if (Math.abs(left.length - right.length) > 1) return false

  let leftIndex = 0
  let rightIndex = 0
  let edits = 0

  while (leftIndex < left.length && rightIndex < right.length) {
    if (left[leftIndex] === right[rightIndex]) {
      leftIndex += 1
      rightIndex += 1
      continue
    }

    edits += 1
    if (edits > 1) return false

    if (left.length > right.length) {
      leftIndex += 1
    } else if (right.length > left.length) {
      rightIndex += 1
    } else {
      leftIndex += 1
      rightIndex += 1
    }
  }

  if (leftIndex < left.length || rightIndex < right.length) {
    edits += 1
  }

  return edits <= 1
}

function unique(values: string[]): string[] {
  return [...new Set(values)]
}
