import assert from "node:assert/strict";

import { getCompassWhopAccessForPlan } from "../src/lib/compass/compass-commerce";
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

process.env.WHOP_COMPASS_PRODUCT_ID = "prod_compass";
process.env.WHOP_COMPASS_PASS_PLAN_ID = "plan_compass_pass";
process.env.WHOP_COMPASS_SUBSCRIPTION_PLAN_ID = "plan_compass_monthly";

assert.equal(
  getCompassWhopAccessForPlan("prod_compass", "plan_compass_pass"),
  "30_day_pass",
  "The one-time Compass plan must grant only the 30-day pass.",
);
assert.equal(
  getCompassWhopAccessForPlan("prod_compass", "plan_compass_monthly"),
  "monthly_subscription",
  "The recurring Compass plan must resolve to monthly membership access.",
);
assert.equal(
  getCompassWhopAccessForPlan("prod_compass", "plan_unknown"),
  null,
  "An unknown plan under the Compass product must not grant access.",
);
assert.equal(
  getCompassWhopAccessForPlan("prod_other", "plan_compass_pass"),
  null,
  "A Compass plan ID under a different Whop product must not grant access.",
);

console.log("Commerce routing contract checks passed.");
