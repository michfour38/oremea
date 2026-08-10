import assert from "node:assert/strict";

import { OREMEA_PRICING } from "../src/lib/oremea/pricing";
import { RECOGNITION_PRICING } from "../src/lib/recognition/recognition-pricing";

assert.equal(
  RECOGNITION_PRICING.launchPriceCents,
  OREMEA_PRICING.recognition.launchPriceCents,
  "Recognition launch price must reference the central pricing registry",
);
assert.equal(
  RECOGNITION_PRICING.regularPriceCents,
  OREMEA_PRICING.recognition.standardPriceCents,
  "Recognition standard price must reference the central pricing registry",
);
assert.equal(
  RECOGNITION_PRICING.purchaseType,
  OREMEA_PRICING.recognition.purchaseType,
  "Recognition purchase type must reference the central pricing registry",
);
assert.equal(
  RECOGNITION_PRICING.billingInterval,
  OREMEA_PRICING.recognition.billingInterval,
  "Recognition billing interval must reference the central pricing registry",
);

console.log("Recognition pricing contract checks passed.");
