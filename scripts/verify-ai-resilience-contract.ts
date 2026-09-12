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
assert.match(
  recognitionEngine,
  /buildDeterministicRecognitionFallback/,
  "Recognition must have a non-AI final fallback so a saved participant turn can never remain stranded.",
);
assert.match(
  recognitionEngine,
  /findFallbackContrastPair/,
  "Recognition's independent fallback must still recurse through participant-supplied contrast rather than flattening into a generic prompt.",
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

console.log("AI participant-progress resilience contract checks passed.");
