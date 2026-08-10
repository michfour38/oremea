import assert from "node:assert/strict";

import {
  getResonanceCheckoutUrl,
  getResonanceWeekForWhopProduct,
} from "../src/lib/resonance/resonance-commerce";

process.env.RESONANCE_WEEK_3_CHECKOUT_URL = "https://example.test/week-3";
process.env.WHOP_RESONANCE_WEEK_3_PRODUCT_ID = "prod_week_3";

assert.equal(
  getResonanceCheckoutUrl(3),
  "https://example.test/week-3",
  "Each Resonance room must be able to use its own checkout URL.",
);
assert.equal(
  getResonanceWeekForWhopProduct("prod_week_3"),
  3,
  "A Whop product ID must resolve to exactly one Resonance room.",
);
assert.equal(
  getResonanceWeekForWhopProduct("prod_unknown"),
  null,
  "Unknown Whop products must not open a Resonance room.",
);
assert.equal(
  getResonanceCheckoutUrl(11),
  null,
  "Resonance commerce must remain inside the ten-room boundary.",
);

console.log("Commerce routing contract checks passed.");
