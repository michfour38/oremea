import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

import {
  EMPTY_RECOGNITION_MEMORY,
  RECOGNITION_CONVERSATION_STANDARD,
  buildRecognitionConversationPrompt,
  mergeRecognitionMemory,
} from "../src/lib/recognition/recognition-conversation";

assert.match(
  RECOGNITION_CONVERSATION_STANDARD,
  /THIS IS NOT COMPASS/,
  "Recognition must keep an explicit boundary from Compass.",
);
assert.match(
  RECOGNITION_CONVERSATION_STANDARD,
  /Do not turn the conversation into goal-setting, execution, planning, strategy/i,
  "Recognition must not become an action-planning product.",
);
assert.match(
  RECOGNITION_CONVERSATION_STANDARD,
  /ask no more than one question/i,
  "Recognition must remain conversational rather than interrogative.",
);
assert.match(
  RECOGNITION_CONVERSATION_STANDARD,
  /newest .*message first/i,
  "Current participant material must retain foreground authority.",
);
assert.match(
  RECOGNITION_CONVERSATION_STANDARD,
  /correction has current authority/i,
  "Participant corrections must outrank historical wording.",
);

const participantMessages = [
  {
    role: "user" as const,
    content: "I have no choice here, but I already declined two of the options.",
    turnIndex: 7,
  },
];

const memory = mergeRecognitionMemory({
  existing: EMPTY_RECOGNITION_MEMORY,
  participantMessages,
  remember: [
    {
      quote: "I have no choice here",
      turnIndex: 7,
      kind: "statement",
    },
    {
      quote: "I secretly want someone else to decide for me",
      turnIndex: 7,
      kind: "statement",
    },
  ],
});

assert.equal(
  memory.anchors.length,
  1,
  "Recognition memory must reject model-invented participant evidence.",
);
assert.equal(
  memory.anchors[0]?.quote,
  "I have no choice here",
  "Recognition memory must preserve participant wording rather than a generated summary.",
);

const punctuationChanged = mergeRecognitionMemory({
  existing: EMPTY_RECOGNITION_MEMORY,
  participantMessages,
  remember: [
    {
      quote: "I have no choice here",
      turnIndex: 8,
      kind: "statement",
    },
  ],
});
assert.equal(
  punctuationChanged.anchors.length,
  0,
  "Recognition memory must reject a quote attached to the wrong participant turn.",
);

const prompt = buildRecognitionConversationPrompt({
  firstName: "Test",
  recentMessages: participantMessages,
  memory,
});
assert.match(
  prompt,
  /PARTICIPANT \[turn 7\]/,
  "Conversation prompts must preserve participant turn provenance.",
);
assert.match(
  prompt,
  /Long-term memory contains exact participant quotes only/i,
  "Longitudinal memory must remain evidence-indexed.",
);

const pageSource = readFileSync("app/recognition/page.tsx", "utf8");
assert.match(
  pageSource,
  /currentUser/,
  "Ongoing Recognition must be bound to an authenticated account.",
);
assert.match(
  pageSource,
  /getRecognitionConversationAccess/,
  "Recognition account access must remain purchase-gated.",
);

const purchaseSource = readFileSync("app/recognition/purchase/page.tsx", "utf8");
assert.match(
  purchaseSource,
  /Ongoing Recognition access/,
  "Recognition purchase copy must describe ongoing access rather than one process.",
);
assert.doesNotMatch(
  purchaseSource,
  /one new Recognition process/i,
  "Recognition must not regress to consumable process access.",
);

const apiSource = readFileSync("app/api/recognition/conversation/route.ts", "utf8");
assert.match(
  apiSource,
  /pg_advisory_xact_lock/,
  "Recognition conversation writes must remain serialised per account.",
);
assert.match(
  apiSource,
  /memory_snapshot/,
  "Recognition must persist bounded longitudinal evidence memory.",
);

console.log("Recognition conversation contract checks passed.");
