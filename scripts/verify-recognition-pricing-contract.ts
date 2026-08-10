import assert from "node:assert/strict";

import {
  RECOGNITION_PRICING,
  formatRecognitionPrice,
} from "../src/lib/recognition/recognition-pricing";

assert.equal(
  formatRecognitionPrice(RECOGNITION_PRICING.launchPriceCents),
  "$9.99",
  "Recognition price must remain $9.99",
);
assert.equal(
  formatRecognitionPrice(RECOGNITION_PRICING.regularPriceCents),
  "$9.99",
  "Recognition canonical price must remain $9.99",
);
assert.equal(
  RECOGNITION_PRICING.purchaseType,
  "one_time",
  "Recognition must remain a one-time purchase",
);
assert.equal(
  RECOGNITION_PRICING.includedRefinements,
  1,
  "Recognition must include exactly one second pass",
);

console.log("Recognition pricing contract checks passed.");
