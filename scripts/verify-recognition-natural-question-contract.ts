import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const engineSource = readFileSync(
  "src/lib/recognition/recognition-conversation.ts",
  "utf8",
);
const chatSource = readFileSync("app/recognition/recognition-chat.tsx", "utf8");

assert.match(
  engineSource,
  /never use a stock orienting question or fixed wording/i,
  "Recognition must generate orienting questions from the participant's actual writing rather than a canned prompt.",
);
assert.match(
  engineSource,
  /do not repeat the same question shape across turns/i,
  "Recognition must not turn a useful conversational function into repetitive phrasing.",
);
assert.match(
  engineSource,
  /form the question from the participant's actual language, syntax, register/i,
  "Recognition's orienting question must be participant-shaped.",
);
assert.doesNotMatch(
  engineSource,
  /where the weight is/i,
  "Recognition must not regress to abstract helper-speak such as 'where the weight is'.",
);
assert.match(
  chatSource,
  /New chat/,
  "Recognition must expose a clear way to begin another preserved conversation.",
);
assert.match(
  chatSource,
  /recognition-logo\.webp/,
  "Recognition must keep the static mark layer wired beneath the scrolling chat.",
);

console.log("Recognition natural-question contract checks passed.");
