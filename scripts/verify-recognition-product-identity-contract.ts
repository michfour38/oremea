import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";

function read(path: string) {
  return readFileSync(path, "utf8");
}

const removedFixedProcessPaths = [
  "app/recognition/recognition-experience.tsx",
  "src/lib/recognition/recognition.questions.ts",
  "src/lib/recognition/recognition.service.ts",
  "app/api/recognition/check/route.ts",
  "app/api/recognition/generate/route.ts",
  "app/api/recognition/progress/route.ts",
  "app/api/recognition/session/route.ts",
  "scripts/verify-recognition-question-contract.ts",
];

for (const path of removedFixedProcessPaths) {
  assert.equal(
    existsSync(path),
    false,
    `Obsolete fixed-process Recognition surface must stay deleted: ${path}`,
  );
}

const publicRecognitionSources = [
  "app/page.tsx",
  "app/recognition/purchase/page.tsx",
  "app/recognition/archive/page.tsx",
  "components/site/sections/compare-recognition.tsx",
  "components/site/sections/explore-ecosystem.tsx",
  "components/site/sections/compare-hero.tsx",
  "components/site/sections/compare-final-guidance.tsx",
  "app/(legal)/terms/page.tsx",
  "app/(legal)/privacy/page.tsx",
].map(read).join("\n");

assert.match(
  publicRecognitionSources,
  /accountability partner|accountability conversation|accountability to your own words|accountable to your own words/i,
  "Recognition public copy must communicate ongoing accountability to the participant's own words.",
);
assert.match(
  publicRecognitionSources,
  /ongoing|return to|over time/i,
  "Recognition public copy must communicate continuity over time.",
);
assert.doesNotMatch(
  publicRecognitionSources,
  /full question sequence|guided question sequence|one-process|one process|generated reflection|complete the questions|second pass/i,
  "Recognition public copy must not describe the retired fixed-process product.",
);
assert.doesNotMatch(
  publicRecognitionSources,
  /Recognition, Resonance and Compass provide structured reflection, guided questions/i,
  "Legal copy must not collapse Recognition back into the retired guided-question product.",
);
assert.doesNotMatch(
  publicRecognitionSources,
  /Oremea is designed as a progression|structured progression/i,
  "Recognition must not be framed as a compulsory first step toward another product.",
);

const accessSource = read("src/lib/recognition/recognition-access.ts");
assert.doesNotMatch(
  accessSource,
  /credit|payment|consum|availableProcesses|RECOGNITION_PRODUCT_KEY/i,
  "Recognition access code must not retain the retired one-process credit ledger.",
);

const purchaseSource = read("app/recognition/purchase/page.tsx");
assert.match(
  purchaseSource,
  /RECOGNITION_SUBSCRIPTION_CHECKOUT_URL/,
  "Recognition must expose only the recurring subscription checkout.",
);
assert.doesNotMatch(
  purchaseSource,
  /RECOGNITION_PROCESS_CHECKOUT_URL|WHOP_RECOGNITION_PRODUCT_ID/i,
  "Recognition must not retain the retired one-time checkout/product path.",
);

const archiveSource = read("app/recognition/archive/page.tsx");
assert.doesNotMatch(
  archiveSource,
  /entry_mirror_sessions|Earlier Recognition format|Past completed Recognitions|legacy/i,
  "Recognition Archive must represent the ongoing conversation only.",
);

const privacySource = read("app/(legal)/privacy/page.tsx");
assert.match(
  privacySource,
  /Recognition conversation messages and participant-controlled remembered excerpts/i,
  "Privacy copy must describe Recognition's ongoing conversation and controlled memory accurately.",
);
assert.match(
  privacySource,
  /inspect and remove/i,
  "Privacy copy must preserve participant control over Recognition long-term memory.",
);

const boundarySource = read("docs/product-boundaries.md");
assert.match(
  boundarySource,
  /Recognition must not become early Compass/i,
  "The internal product boundary must explicitly prevent Recognition from becoming directional Compass logic.",
);
assert.match(
  boundarySource,
  /Pricing has one source of truth: `src\/lib\/oremea\/pricing\.ts`/,
  "Internal product boundaries must preserve the central pricing registry rule.",
);

console.log("Recognition product identity contract checks passed.");
