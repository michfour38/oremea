import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

function source(path: string) {
  return readFileSync(path, "utf8");
}

const recognitionEngine = source(
  "src/lib/recognition/recognition-conversation.ts",
);
const recognitionRoute = source(
  "app/api/recognition/conversation/route.ts",
);
const compassConversation = source(
  "src/lib/el/conversation-engine.ts",
);
const compassConversationRoute = source(
  "app/api/el/conversation/route.ts",
);
const compassDescent = source(
  "src/lib/compass/session/compass-descent.service.ts",
);
const compassMirror = source(
  "src/lib/compass/session/compass-mirror.service.ts",
);
const resonanceDaily = source(
  "app/api/mirror/questions/route.ts",
);
const resonanceClosing = source(
  "src/lib/resonance/resonance-run-weekly-mirror.ts",
);
const harmonizeWitness = source(
  "app/api/harmonize/witness-question/route.ts",
);

assert.match(
  recognitionEngine,
  /generateRecognitionFallbackReply/,
  "Recognition must have a second response path when its structured AI envelope fails.",
);
assert.doesNotMatch(
  recognitionEngine,
  /buildDeterministicRecognitionFallback|recognition-deterministic-fallback/,
  "Recognition must never counterfeit its core conversational witness with a canned non-AI reply when model generation is unavailable.",
);
assert.match(
  recognitionEngine,
  /Recognition could not respond without leaving the participant's evidence/,
  "Recognition must fail honestly after both AI response paths fail so the saved participant turn can be retried later.",
);
assert.doesNotMatch(
  recognitionEngine,
  /Which part of what you just wrote has your attention most\?/,
  "Recognition's resilience fallback must not reintroduce the generic attention question that flattened the product.",
);
assert.match(
  recognitionEngine,
  /more than one participant-facing question/,
  "Recognition fallback hardening must not remove the post-generation one-question boundary.",
);
assert.match(
  recognitionRoute,
  /savedParticipantTurn/,
  "Recognition must preserve a participant turn before a reply-generation failure is surfaced.",
);
assert.match(
  recognitionRoute,
  /Your words are saved/,
  "Recognition must tell the participant when their saved turn survives a reply-generation failure.",
);

assert.match(
  compassConversation,
  /attemptCount = product === "compass" && stage === "discussion" \? 2 : 1/,
  "Compass Discussion must retry an unreadable structured AI response.",
);
assert.match(
  compassConversationRoute,
  /Compass hit a processing pause/,
  "Compass Discussion must return a usable fallback instead of stranding the participant.",
);
assert.match(
  compassDescent,
  /attempt < 3/,
  "Compass Descent must repair invalid structured AI output before failing.",
);
assert.match(
  compassMirror,
  /attempt < 2/,
  "Compass Mirror must retry an empty or failed AI generation before using its deterministic fallback.",
);

assert.match(
  resonanceDaily,
  /attempt < 2/,
  "Resonance Daily Mirror must retry malformed or failed AI output before surfacing an error.",
);
assert.match(
  resonanceDaily,
  /parseDailyMirror/,
  "Resonance Daily Mirror must validate the generated reflection and 2Q envelope.",
);
assert.match(
  resonanceClosing,
  /attempt < 2/,
  "Resonance Closing Mirror must retry a failed generation before blocking visit completion.",
);

assert.match(
  harmonizeWitness,
  /buildWitnessFailureQuestion/,
  "Harmonize Private Witness must have a deterministic question fallback.",
);
assert.match(
  harmonizeWitness,
  /result\?\.reply \|\|/,
  "Harmonize Private Witness must actually use its fallback when AI returns no reply.",
);


const aiGateway = source("src/lib/ai/ai-gateway.ts");
assert.match(aiGateway, /AbortSignal\.timeout\(45000\)/,
  "AI calls must have a bounded network timeout instead of hanging customer requests.");
assert.match(aiGateway, /if \(!process\.env\.ANTHROPIC_API_KEY\)/,
  "Missing provider credentials must fail clearly without attempting a request.");
assert.match(aiGateway, /if \(!res\.ok\) \{/,
  "Provider errors must be handled before trying to parse their response bodies.");
assert.doesNotMatch(aiGateway, /console\.error\([\s\S]*?data,\s*\)/,
  "Never log untrusted provider error payloads containing potentially private customer data.");
assert.doesNotMatch(aiGateway, /console\.error\([\s\S]*?error,\s*\)/,
  "Never log raw network exceptions from participant requests.");
assert.match(aiGateway, /new Set\(/,
  "Repeated configured model IDs must not double the failure time.");

console.log("AI participant-progress resilience contract checks passed.");


// ARGUS recovery: protect participant words and avoid unlimited paid retries.
const recognitionChat = source("app/recognition/recognition-chat.tsx");
assert.match(recognitionEngine, /responseMode: "fallback" as const/);
assert.match(recognitionEngine, /responseMode: "structured" as const/);
assert.match(recognitionRoute, /responseMode: generated\.responseMode/);
assert.match(recognitionRoute, /ARGUS_RECOGNITION_FALLBACK_DELIVERED/);
assert.match(recognitionChat, /recovery\.current\.attempts >= 2/);
assert.match(recognitionChat, /document\.visibilityState !== "visible" \|\| !navigator\.onLine/);
assert.match(recognitionChat, /void sendMessage\(savedTurn\)/);
assert.match(recognitionChat, /response\.status === 503 && data\?\.saved && data\?\.message/);
assert.match(recognitionChat, /recovery\.current\.inFlight/);
assert.match(recognitionChat, /Recognition is responding again/);
assert.match(recognitionChat, /setRecoveryNotice\(true\)/);
assert.doesNotMatch(recognitionChat, /Notification\.requestPermission|PushManager\.subscribe/,
  "Participant recovery must not silently opt anyone into push notifications.");


// The operational ARGUS export is aggregate-only and bound to the existing
// private Oremea → DAWN truth token. It cannot expose participant writing.
const telemetry = source("app/api/internal/argus/recognition-status/route.ts");
assert.match(telemetry, /DAWN_TRUTH_EXPORT_TOKEN/);
assert.match(telemetry, /timingSafeEqual/);
assert.match(telemetry, /aggregate_no_pii/);
assert.match(telemetry, /fallbackResponseCount/);
assert.match(telemetry, /structuredResponseCount/);
assert.match(telemetry, /Cache-Control.*no-store/);
assert.match(telemetry, /role: "assistant"/);
assert.match(telemetry, /select: \{ created_at: true \}/);
assert.match(telemetry, /pendingSavedTurnCount/);
assert.match(telemetry, /latestPendingAt/);
assert.match(telemetry, /message_count % 2/);
assert.match(telemetry, /3 \* 60 \* 1000/);
assert.match(telemetry, /SELECT COUNT\(\*\)::bigint AS pending_count/);
assert.match(telemetry, /pendingScope: "all_active_stalled_turns"/);
const stalledSql = telemetry.slice(telemetry.indexOf("SELECT COUNT(*)::bigint AS pending_count"));
assert.doesNotMatch(stalledSql, /last_message_at >=/,
  "Active unanswered Recognition turns must never expire from ARGUS monitoring merely because they are old.");
assert.match(telemetry, /status = 'active'/);
assert.doesNotMatch(telemetry, /SELECT[\\s\\S]*user_id|SELECT[\\s\\S]*content/);
assert.doesNotMatch(telemetry, /select:\s*\{\s*(?:content|user_id|thread_id|client_message_id)/);

// Machine-to-machine observations authenticate via scoped bearer token,
// not interactive Clerk cookies. The handler still fails closed without it.
const routeMiddleware = source("middleware.ts");
assert.match(routeMiddleware, /"\/api\/internal\/argus\/recognition-status"/);
assert.match(telemetry, /if \(!authorised\(request\)\)/);
