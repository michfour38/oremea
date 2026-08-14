type MessageLike = {
  role: "user" | "assistant";
  content: string;
  turnIndex: number;
};

type AnchorLike = {
  quote: string;
  turnIndex: number;
};

const STOP_WORDS = new Set([
  "about",
  "after",
  "again",
  "also",
  "been",
  "being",
  "because",
  "could",
  "does",
  "from",
  "have",
  "here",
  "into",
  "just",
  "like",
  "more",
  "most",
  "much",
  "only",
  "really",
  "said",
  "that",
  "their",
  "them",
  "then",
  "there",
  "these",
  "they",
  "thing",
  "this",
  "those",
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

export const RECOGNITION_RECENT_CONTEXT_MAX_MESSAGES = 18;
export const RECOGNITION_RECENT_CONTEXT_MAX_CHARS = 24000;
export const RECOGNITION_MEMORY_QUOTE_MAX_CHARS = 320;
export const RECOGNITION_MEMORY_PROMPT_MAX_ANCHORS = 12;

function words(value: string) {
  return new Set(
    value
      .toLowerCase()
      .match(/[a-z0-9][a-z0-9'-]{2,}/g)
      ?.filter((word) => !STOP_WORDS.has(word)) ?? [],
  );
}

function overlapScore(a: Set<string>, b: Set<string>) {
  let overlap = 0;
  for (const word of a) {
    if (b.has(word)) overlap += 1;
  }
  return overlap;
}

export function trimRecognitionRecentContext<T extends MessageLike>(messages: T[]) {
  const selected: T[] = [];
  let chars = 0;

  for (let index = messages.length - 1; index >= 0; index -= 1) {
    const message = messages[index];
    const nextChars = chars + message.content.length;
    const wouldExceedMessageLimit =
      selected.length >= RECOGNITION_RECENT_CONTEXT_MAX_MESSAGES;
    const wouldExceedCharLimit =
      selected.length > 0 && nextChars > RECOGNITION_RECENT_CONTEXT_MAX_CHARS;

    if (wouldExceedMessageLimit || wouldExceedCharLimit) break;

    selected.push(message);
    chars = nextChars;
  }

  return selected.reverse();
}

export function recognitionMemoryQuoteIsBounded(quote: string) {
  const trimmed = quote.trim();
  return trimmed.length > 0 && trimmed.length <= RECOGNITION_MEMORY_QUOTE_MAX_CHARS;
}

export function selectRecognitionMemoryForPrompt<T extends AnchorLike>(
  anchors: T[],
  currentMessage: string,
) {
  if (anchors.length <= RECOGNITION_MEMORY_PROMPT_MAX_ANCHORS) return anchors;

  const currentWords = words(currentMessage);
  const recent = anchors.slice(-4);
  const recentKeys = new Set(
    recent.map((anchor) => `${anchor.turnIndex}:${anchor.quote}`),
  );

  const relevant = anchors
    .slice(0, -4)
    .map((anchor) => ({
      anchor,
      score: overlapScore(currentWords, words(anchor.quote)),
    }))
    .filter((item) => item.score > 0)
    .sort(
      (a, b) =>
        b.score - a.score || b.anchor.turnIndex - a.anchor.turnIndex,
    )
    .slice(0, RECOGNITION_MEMORY_PROMPT_MAX_ANCHORS - recent.length)
    .map((item) => item.anchor);

  const selected = [...relevant, ...recent].filter((anchor, index, all) => {
    const key = `${anchor.turnIndex}:${anchor.quote}`;
    return (
      recentKeys.has(key) ||
      all.findIndex(
        (candidate) => `${candidate.turnIndex}:${candidate.quote}` === key,
      ) === index
    );
  });

  return selected
    .sort((a, b) => a.turnIndex - b.turnIndex)
    .slice(-RECOGNITION_MEMORY_PROMPT_MAX_ANCHORS);
}
