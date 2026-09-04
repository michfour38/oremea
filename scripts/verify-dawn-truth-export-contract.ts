import assert from "node:assert/strict";

import {
  OREMEA_PRODUCT_TRUTH,
  OREMEA_PRODUCT_TRUTH_SCHEMA_VERSION,
  oremeaProductTruthSnapshot,
} from "@/src/lib/oremea/product-truth";

const expectedIds = [
  "compass",
  "recognition",
  "resonance-bearing",
  "resonance-becoming",
  "resonance-forge",
  "resonance-garden",
  "resonance-gathering",
  "resonance-hearth",
  "resonance-mirror",
  "resonance-pulse",
  "resonance-shadow",
  "resonance-vision",
  "the-current",
];

function collectNumbers(value: unknown): number[] {
  if (typeof value === "number") return [value];
  if (Array.isArray(value)) return value.flatMap(collectNumbers);
  if (value && typeof value === "object") {
    return Object.values(value).flatMap(collectNumbers);
  }
  return [];
}

const snapshot = oremeaProductTruthSnapshot();

assert.equal(OREMEA_PRODUCT_TRUTH_SCHEMA_VERSION, 2);
assert.equal(snapshot.authority, "oremea_repository");
assert.equal(snapshot.truthScope, "current_only");
assert.deepEqual(Object.keys(OREMEA_PRODUCT_TRUTH).sort(), expectedIds);
assert.equal(snapshot.products.length, 13);

for (const product of snapshot.products) {
  assert.ok(product.sourceRefs.length >= 2, `${product.id} must preserve source references`);
  assert.equal(product.commerce.affiliateStatus, "off");
  assert.ok(product.description.length > 20);
  if (product.canonicalStatus === "locked") {
    assert.equal(typeof product.canonicalUrl, "string");
    assert.match(product.canonicalUrl as string, /^https:\/\//);
  } else {
    assert.equal(product.canonicalStatus, "unresolved");
    assert.equal(product.canonicalUrl, null);
  }
}

assert.equal(OREMEA_PRODUCT_TRUTH.recognition.releaseStatus, "hidden");
assert.equal(OREMEA_PRODUCT_TRUTH.recognition.commerce.visibility, "hidden");
assert.equal(OREMEA_PRODUCT_TRUTH.compass.releaseStatus, "live");
assert.equal(OREMEA_PRODUCT_TRUTH.compass.commerce.visibility, "visible");
assert.equal(OREMEA_PRODUCT_TRUTH["the-current"].releaseStatus, "hidden");
assert.equal(
  OREMEA_PRODUCT_TRUTH["the-current"].commercial.invitationOnly,
  true,
);

const deprecatedCommercialValues = new Set([699, 999, 1499, 2499]);
for (const value of collectNumbers(snapshot)) {
  assert.equal(
    deprecatedCommercialValues.has(value),
    false,
    `Deprecated commercial value ${value} must not exist in the current-only truth export`,
  );
}

assert.doesNotMatch(
  JSON.stringify(snapshot),
  /historical|superseded|legacy|priceCandidates/i,
  "The current-only truth export must not carry retrievable historical product truth.",
);

console.log("DAWN current-only truth export contract checks passed.");
