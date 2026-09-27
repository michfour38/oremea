import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const access = readFileSync("app/compass/access/page.tsx", "utf8");
const middleware = readFileSync("middleware.ts", "utf8");
const flow = readFileSync(
  "src/lib/compass/session/compass-flow-contract.ts",
  "utf8",
);

assert.match(
  access,
  /affiliateCheckoutUrl\([\s\S]*COMPASS_SUBSCRIPTION_CHECKOUT_URL/,
  "Compass must preserve affiliate attribution through the existing checkout path.",
);
assert.match(
  access,
  /Sign in first so purchase and Compass access stay connected/,
  "Compass must explain why sign-in happens before checkout without naming the payment provider.",
);
assert.match(
  access,
  /After purchase/,
  "Compass must explain the post-purchase handoff.",
);
assert.match(
  access,
  /Use the same email for your purchase and Oremea sign-in/,
  "Compass must explain the email identity that connects purchase to access.",
);
assert.match(
  access,
  /2 · Go through all seven why layers/,
  "Compass funnel must explicitly preserve the seven why layers.",
);
assert.match(
  access,
  /Compass can help structure the navigation[\s\S]*movement outside the conversation remain yours/,
  "Compass funnel must preserve participant authority over movement.",
);

const checkoutActionUses = access.match(/<CheckoutAction/g) ?? [];
assert.ok(
  checkoutActionUses.length >= 2,
  "Compass must offer conversion near the decision point and again after the buyer has read the funnel.",
);

assert.doesNotMatch(
  access,
  /resonance\.oremea\.com|recognition\.oremea\.com|href="\/resonance|href="\/recognition/i,
  "Compass must not force a buyer into another product before Compass delivers its own value.",
);

assert.match(
  flow,
  /COMPASS_DESCENT_LAYER_COUNT = 7 as const/,
  "Compass must keep exactly seven accepted descent layers.",
);
assert.match(
  flow,
  /all seven Why layers/,
  "Compass depth intro must retain all seven Why layers.",
);

assert.match(
  middleware,
  /pathname === "\/"[\s\S]*pathname === "\/access"[\s\S]*rewriteCompassPath\(req, "\/compass\/access"\)/,
  "compass.oremea.com must resolve to the Compass purchase funnel.",
);
assert.match(
  middleware,
  /pathname === "\/begin"[\s\S]*rewriteCompassPath\(req, "\/compass"\)/,
  "Compass /begin must remain the product handoff after access is active.",
);

console.log("Compass purchase funnel and seven-layer handoff contract checks passed.");
