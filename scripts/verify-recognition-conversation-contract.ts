import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

import {
  EMPTY_RECOGNITION_MEMORY,
  RECOGNITION_CONVERSATION_STANDARD,
  buildRecognitionConversationPrompt,
  mergeRecognitionMemory,
} from "../src/lib/recognition/recognition-conversation";
import {
  RECOGNITION_MEMORY_PROMPT_MAX_ANCHORS,
  RECOGNITION_MEMORY_QUOTE_MAX_CHARS,
  RECOGNITION_RECENT_CONTEXT_MAX_MESSAGES,
  selectRecognitionMemoryForPrompt,
  trimRecognitionRecentContext,
} from "../src/lib/recognition/recognition-context";

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
assert.match(
  RECOGNITION_CONVERSATION_STANDARD,
  /SAFETY OVERRIDE/,
  "Immediate safety must outrank ordinary recursive accountability.",
);
assert.match(
  RECOGNITION_CONVERSATION_STANDARD,
  /do not challenge an absolute, debate responsibility/i,
  "Recognition must not intensify accountability during immediate danger.",
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

const wrongTurn = mergeRecognitionMemory({
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
  wrongTurn.anchors.length,
  0,
  "Recognition memory must reject a quote attached to the wrong participant turn.",
);

const oversizedQuote = "x".repeat(RECOGNITION_MEMORY_QUOTE_MAX_CHARS + 1);
const oversizedMemory = mergeRecognitionMemory({
  existing: EMPTY_RECOGNITION_MEMORY,
  participantMessages: [
    {
      role: "user" as const,
      content: oversizedQuote,
      turnIndex: 9,
    },
  ],
  remember: [
    {
      quote: oversizedQuote,
      turnIndex: 9,
      kind: "statement",
    },
  ],
});
assert.equal(
  oversizedMemory.anchors.length,
  0,
  "Recognition memory must stay excerpt-sized rather than storing whole long messages.",
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
  RECOGNITION_CONVERSATION_STANDARD,
  /Long-term memory contains exact participant quotes only/i,
  "Longitudinal memory must remain evidence-indexed.",
);

const longConversation = Array.from({ length: 40 }, (_, index) => ({
  role: index % 2 === 0 ? ("user" as const) : ("assistant" as const),
  content: `message-${index} ${"context ".repeat(180)}`,
  turnIndex: index + 1,
}));
const trimmedConversation = trimRecognitionRecentContext(longConversation);
assert.ok(
  trimmedConversation.length <= RECOGNITION_RECENT_CONTEXT_MAX_MESSAGES,
  "Recognition must cap the number of recent messages sent back to the model.",
);
assert.equal(
  trimmedConversation.at(-1)?.turnIndex,
  40,
  "Context trimming must always retain the newest message.",
);

const anchorPool = Array.from({ length: 30 }, (_, index) => ({
  quote:
    index === 3
      ? "school fees and transport are taking my attention"
      : `historical participant excerpt ${index}`,
  turnIndex: index + 1,
  kind: "statement" as const,
}));
const selectedMemory = selectRecognitionMemoryForPrompt(
  anchorPool,
  "School transport and fees are back in my attention today.",
);
assert.ok(
  selectedMemory.length <= RECOGNITION_MEMORY_PROMPT_MAX_ANCHORS,
  "Recognition must not resend the whole longitudinal memory index every turn.",
);
assert.ok(
  selectedMemory.some((anchor) => anchor.turnIndex === 4),
  "Relevant older participant evidence should survive memory selection.",
);
assert.ok(
  selectedMemory.some((anchor) => anchor.turnIndex === 30),
  "Recent participant evidence should remain available even without lexical overlap.",
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
  /trimRecognitionRecentContext/,
  "Recognition must bound recent model context without truncating the stored archive.",
);
assert.match(
  apiSource,
  /memory_snapshot/,
  "Recognition must persist bounded longitudinal evidence memory.",
);
assert.match(
  apiSource,
  /cacheReadInputTokens/,
  "Recognition must persist cache usage so real serving cost can be measured.",
);
assert.match(
  apiSource,
  /inputTokens/,
  "Recognition must persist model input usage per generated reply.",
);
assert.match(
  apiSource,
  /outputTokens/,
  "Recognition must persist model output usage per generated reply.",
);

const gatewaySource = readFileSync("src/lib/ai/ai-gateway.ts", "utf8");
assert.match(
  gatewaySource,
  /generateAIWithUsage/,
  "The shared AI gateway must expose usage without changing legacy text-only callers.",
);
assert.match(
  gatewaySource,
  /cache_control/,
  "Recognition's stable system policy must be eligible for prompt caching.",
);
assert.match(
  gatewaySource,
  /cache_read_input_tokens/,
  "The AI gateway must report prompt-cache reads.",
);

const engineSource = readFileSync(
  "src/lib/recognition/recognition-conversation.ts",
  "utf8",
);
assert.match(
  engineSource,
  /cacheSystem: true/,
  "Recognition must cache its stable Mirror/evidence/conversation policy prefix.",
);
assert.match(
  engineSource,
  /more than one participant-facing question/,
  "Recognition must enforce the one-question boundary after model generation too.",
);

const memoryApiSource = readFileSync("app/api/recognition/memory/route.ts", "utf8");
assert.match(
  memoryApiSource,
  /EMPTY_RECOGNITION_MEMORY/,
  "Participants must be able to clear Recognition's long-term memory index.",
);
const archiveSource = readFileSync("app/recognition/archive/page.tsx", "utf8");
assert.match(
  archiveSource,
  /RecognitionMemoryControls/,
  "Recognition Archive must expose participant control over carried-forward memory.",
);

const accessSource = readFileSync(
  "src/lib/recognition/recognition-conversation-access.ts",
  "utf8",
);
assert.match(
  accessSource,
  /"founding" \| "membership"/,
  "Existing one-time buyers and future recurring members must remain distinct access sources.",
);
assert.match(
  accessSource,
  /deactivation wins/,
  "Equal-time membership webhook conflicts must fail closed.",
);
assert.match(
  accessSource,
  /recognition_membership/,
  "Recurring Recognition access must use a separate entitlement key from founding purchases.",
);

const webhookSource = readFileSync("app/api/webhooks/whop/route.ts", "utf8");
assert.match(
  webhookSource,
  /membership\.activated/,
  "Recognition must support Whop membership activation events.",
);
assert.match(
  webhookSource,
  /membership\.deactivated/,
  "Recognition must support Whop membership deactivation events.",
);
assert.match(
  webhookSource,
  /WHOP_RECOGNITION_SUBSCRIPTION_PRODUCT_ID/,
  "Recurring Recognition fulfillment must remain isolated behind its own Whop product ID.",
);

console.log("Recognition conversation contract checks passed.");
