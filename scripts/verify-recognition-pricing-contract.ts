import assert from "node:assert/strict";

import {
  RECOGNITION_PRICING,
  formatRecognitionPrice,
} from "../src/lib/recognition/recognition-pricing";

assert.equal(
  formatRecognitionPrice(RECOGNITION_PRICING.launchPriceCents),
  "$14.99",
  "Recognition launch price must remain $14.99/month",
);
assert.equal(
  formatRecognitionPrice(RECOGNITION_PRICING.regularPriceCents),
  "$19.99",
  "Recognition standard price must remain $19.99/month",
);
assert.equal(
  RECOGNITION_PRICING.purchaseType,
  "subscription",
  "Recognition public access must be a subscription",
);
assert.equal(
  RECOGNITION_PRICING.billingInterval,
  "month",
  "Recognition subscription must bill monthly",
);
assert.equal(
  Object.prototype.hasOwnProperty.call(RECOGNITION_PRICING, "legacyFoundingPriceCents"),
  false,
  "Recognition must not retain a legacy founding price",
);

console.log("Recognition pricing contract checks passed.");
