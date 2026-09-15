import assert from "node:assert/strict";
import { getResonanceRoomTarget } from "../src/lib/resonance/room-entry";

for (const weekNumber of [1, 2, 10]) {
  const target = getResonanceRoomTarget(String(weekNumber));
  assert.equal(target?.weekNumber, weekNumber);
  // The same room must survive the encoded sign-in/sign-up return URL.
  const signInUrl = new URL(`https://example.test/sign-in?redirect_url=${encodeURIComponent(target!.entryPath)}`);
  const returnUrl = new URL(signInUrl.searchParams.get("redirect_url")!, signInUrl.origin);
  assert.equal(returnUrl.pathname, "/entry");
  assert.equal(getResonanceRoomTarget(returnUrl.searchParams.get("room")!)?.weekNumber, weekNumber);
}

for (const invalid of [undefined, "", "0", "11", "-1", "1.5", "01", "1e0", "1&paid=true", "https://example.test", ["1", "2"]]) {
  assert.equal(getResonanceRoomTarget(invalid), null, "Invalid or ambiguous room instructions must use the normal room picker.");
}

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
