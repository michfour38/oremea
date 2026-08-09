import assert from "node:assert/strict";

import {
  RECOGNITION_PRICING,
  formatRecognitionPrice,
} from "../src/lib/recognition/recognition-pricing";

assert.equal(
  formatRecognitionPrice(RECOGNITION_PRICING.launchPriceCents),
  "$6.99",
  "Recognition launch price must remain $6.99",
);
assert.equal(
  formatRecognitionPrice(RECOGNITION_PRICING.regularPriceCents),
  "$9.99",
  "Recognition regular price must remain $9.99",
);
assert.equal(
  RECOGNITION_PRICING.purchaseType,
  "one_time",
  "Recognition must remain a one-time purchase",
);

console.log("Recognition pricing contract checks passed.");
