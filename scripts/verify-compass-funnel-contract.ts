import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const access = readFileSync("app/compass/access/page.tsx", "utf8");
const middleware = readFileSync("middleware.ts", "utf8");
const flow = readFileSync(
  "src/lib/compass/session/compass-flow-contract.ts",
  "utf8",
);
const pricing = readFileSync("src/lib/oremea/pricing.ts", "utf8");

assert.match(
  access,
  /affiliateCheckoutUrl\([\s\S]*COMPASS_SUBSCRIPTION_CHECKOUT_URL/,
  "Compass must preserve affiliate attribution through the existing checkout path.",
);
assert.match(
  access,
  /Set goals that are actually yours[\s\S]*work toward achieving them/,
  "Compass funnel must state its goal-setting and goal-achievement purpose plainly.",
);
assert.match(
  access,
  /goal setting[\s\S]*movement toward[\s\S]*achievement/i,
  "Compass must explain that it supports goal setting and movement toward achievement without promising outcomes.",
);
assert.match(
  access,
  /Does Compass guarantee that I will achieve a goal\?/,
  "Compass funnel must set an honest boundary around goal achievement claims.",
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
  /The goal remains yours[\s\S]*decisions and participation outside the conversation[\s\S]*remain yours/,
  "Compass funnel must preserve participant authority over goals and movement.",
);
assert.match(
  pricing,
  /compass:[\s\S]*launchPriceCents:\s*5000/,
  "Compass central price must remain $50.00/month unless deliberately changed at the pricing authority.",
);

assert.doesNotMatch(
  access,
  /seven why|seven-layer|core reflection|descent/i,
  "Compass public funnel must not expose the internal reflection method.",
);
assert.doesNotMatch(
  access,
  /c8a96a/i,
  "Compass public funnel must use the single approved gold rather than mixed yellow-gold accents.",
);
assert.match(
  access,
  /f1dfb4/i,
  "Compass public funnel must retain the approved Oremea gold accent.",
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
  "Compass must keep exactly seven accepted descent layers internally.",
);
assert.match(
  flow,
  /all seven Why layers/,
  "Compass internal depth flow must retain all seven Why layers.",
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

console.log("Compass goal-setting funnel, private-method, pricing and styling contract checks passed.");
