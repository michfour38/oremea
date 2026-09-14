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
  /when the participant says a question has landed hard[\s\S]*explicitly signals[\s\S]*do not immediately press them with another Recognition question/i,
  "Recognition must respect an explicit pause without treating every conclusion or reaction as a cue to end the thread.",
);
assert.match(
  engineSource,
  /pacing is recursive/i,
  "Recognition pause acknowledgements must be generated from the live thread and participant register.",
);
assert.match(
  engineSource,
  /a conclusion, realisation, strong reaction, or declaration by itself is not a pause signal/i,
  "Recognition must distinguish a live conclusion from an explicit request to pause.",
);
assert.doesNotMatch(
  engineSource,
  /function recognitionPacingReply|recognitionDeterministicPacingFallback|I’ll be here when you come back|I’ll leave the thread open here\. Come back when you’re ready\./,
  "Recognition must not hardcode pause detection or a canned participant-facing pause response.",
);
assert.match(
  engineSource,
  /Recognition is relationally continuous/i,
  "Recognition must preserve relationship continuity instead of aiming to make itself unnecessary.",
);
assert.match(
  engineSource,
  /participant-led action or experimentation/i,
  "Recognition must allow action to emerge from what the participant sees without becoming Compass.",
);
assert.match(
  engineSource,
  /return with what happened[\s\S]*renewed curiosity/i,
  "Recognition should support a curiosity-action-return loop when the participant chooses it.",
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
