import assert from "node:assert/strict";

import {
  OREMEA_PRODUCT_TRUTH,
  OREMEA_PRODUCT_TRUTH_SCHEMA_VERSION,
  oremeaProductTruthSnapshot,
} from "@/src/lib/oremea/product-truth";
import { OREMEA_PRICING } from "@/src/lib/oremea/pricing";

assert.equal(OREMEA_PRODUCT_TRUTH_SCHEMA_VERSION, 1);
assert.equal(oremeaProductTruthSnapshot().authority, "oremea_repository");
assert.equal(oremeaProductTruthSnapshot().products.length, 4);

for (const [id, truth] of Object.entries(OREMEA_PRODUCT_TRUTH)) {
  assert.ok(truth.sourceRefs.length >= 2, `${id} must preserve source references`);
  assert.equal(
    truth.commercial,
    OREMEA_PRICING[id as keyof typeof OREMEA_PRICING],
    `${id} commercial truth must reference the central pricing object`,
  );
}

assert.equal(OREMEA_PRODUCT_TRUTH.recognition.visibility, "public");
assert.equal(OREMEA_PRODUCT_TRUTH.resonance.visibility, "public");
assert.equal(OREMEA_PRODUCT_TRUTH.compass.visibility, "public");
assert.equal(OREMEA_PRODUCT_TRUTH.current.visibility, "member_only");
assert.equal(OREMEA_PRODUCT_TRUTH.current.commercial.invitationOnly, true);

console.log("DAWN truth export contract checks passed.");
