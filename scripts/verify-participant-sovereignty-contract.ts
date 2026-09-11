import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

function read(path: string) {
  return readFileSync(path, "utf8");
}

const sovereignty = read("src/lib/oremea/participant-sovereignty.ts");
const evidence = read("src/lib/oremea/evidence-boundary.ts");
const el = read("src/lib/el/conversation-engine.ts");
const boundaries = read("docs/product-boundaries.md");
const compassScope = read("src/lib/compass/scope-boundary.ts");

assert.match(
  sovereignty,
  /The participant must remain larger than the intelligence assisting them\./,
  "Oremea must retain the master participant-sovereignty rule.",
);
assert.match(
  sovereignty,
  /Recognition must prevent the intelligence from becoming the author of the participant's meaning\./,
  "Recognition must prevent supplied meaning.",
);
assert.match(
  sovereignty,
  /Compass must prevent navigation from becoming obedience\./,
  "Compass must prevent supplied choice and obedience.",
);
assert.match(
  sovereignty,
  /Resonance must prevent the intelligence from turning lived reflection into imposed relational theory\./,
  "Resonance must prevent imposed relational theory.",
);
assert.match(
  sovereignty,
  /Harmonize must prevent facilitation from becoming adjudication, forced reconciliation, or covert sharing\./,
  "Harmonize must preserve consent and relational process authority.",
);
assert.match(
  sovereignty,
  /The Current must prevent relational self-witnessing from becoming dating optimisation or relationship authority\./,
  "The Current must preserve private relational self-witnessing.",
);
assert.match(
  sovereignty,
  /Do not optimise for conversation length, session count, daily return, streaks, emotional attachment to the agent, retention, or repeated reliance on the system\./,
  "Oremea must explicitly reject dependency and retention optimisation.",
);
assert.match(
  sovereignty,
  /OREMEA PRE-SEND GUARDRAIL REVIEW/,
  "The central contract must retain the semantic pre-send review standard.",
);

assert.doesNotMatch(
  evidence,
  /OREMEA_PARTICIPANT_SOVEREIGNTY/,
  "Evidence discipline must remain separate from the universal sovereignty guardrail instead of silently injecting the whole guardrail into every evidence consumer.",
);
assert.match(
  sovereignty,
  /GUARDRAIL AUTHORITY BOUNDARY/,
  "The central sovereignty contract must explicitly bound the authority of guardrails themselves.",
);
assert.match(
  sovereignty,
  /Guardrails must not silently rewrite authored curriculum, seed questions, canonical product copy, teacher material, exercises, or product outcomes\./,
  "Guardrails must not become product authors.",
);
assert.match(
  sovereignty,
  /A product boundary must be enforced by the purpose and behaviour of the interaction, never by a lexical veto or banned-word list\./,
  "Product lanes must be protected semantically rather than by banned ordinary language.",
);
assert.match(
  el,
  /OREMEA_PRODUCT_SOVEREIGNTY\[product\]/,
  "Shared EL conversations must receive the active product sovereignty extension.",
);
assert.match(
  boundaries,
  /participant-sovereignty\.ts/,
  "Product boundary documentation must name the central sovereignty authority.",
);
assert.match(
  boundaries,
  /Evidence discipline and behavioural guardrails are separate layers/i,
  "Boundary documentation must preserve the separation between evidence rules and behavioural guardrails.",
);
assert.match(
  compassScope,
  /shouldApplyCompassScopeBoundary/,
  "Compass must independently verify that a professional-scope boundary actually applies to the participant's request.",
);
assert.match(
  compassScope,
  /participantText/,
  "Compass scope enforcement must inspect the participant's actual request rather than trust topic classification alone.",
);
assert.match(
  compassScope,
  /This specific question needs legal guidance/,
  "Compass professional boundaries must be narrow to the specific unavailable authority rather than ending the whole conversation.",
);

console.log("Participant sovereignty contract checks passed.");
