import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const access = readFileSync("app/compass/access/page.tsx", "utf8");
const colors = readFileSync("app/oremea-colors.css", "utf8");
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
  /Ever noticed how a goal can really matter to you[\s\S]*still keep slipping away/,
  "Compass funnel must open with a recognisable human goal-setting pain point.",
);
assert.match(
  access,
  /what you really want[\s\S]*why it matters[\s\S]*next move/i,
  "Compass must connect the pain point to clarity, meaning and movement.",
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
  /does not take from you[\s\S]*authority to act, revise, wait, or choose differently/i,
  "Compass funnel must preserve participant authority over goals and movement.",
);
assert.match(
  pricing,
  /compass:[\s\S]*launchPriceCents:\s*5000/,
  "Compass central price must remain $50.00/month unless deliberately changed at the pricing authority.",
);

assert.doesNotMatch(
  access,
  /COMPASS_PRICING|formatCompassPrice|\$\s*\d|\/month|monthly membership|prices are shown/i,
  "Compass public funnel must remain price-free; current pricing belongs on the provider purchase surface.",
);
assert.match(
  access,
  /View Compass access/,
  "Compass public funnel must send ready buyers to the current access options without duplicating price copy.",
);
assert.doesNotMatch(
  access,
  /seven why|seven-layer|core reflection|descent/i,
  "Compass public funnel must not expose the internal reflection method.",
);
assert.doesNotMatch(
  access,
  /f1dfb4|c8a96a|f0cf7a|d5b56e/i,
  "Compass public funnel must not carry legacy hard-coded yellow-gold values.",
);
assert.match(
  access,
  /var\(--oremea-gold\)/,
  "Compass public funnel must inherit the Oremea gold token rather than define its own gold.",
);
assert.match(
  colors,
  /--oremea-gold:\s*#cda434/i,
  "Oremea brand gold must remain the owner-approved burnished gold #CDA434 unless deliberately changed.",
);
assert.match(
  colors,
  /--recognition-gold:\s*var\(--oremea-gold\)/,
  "Recognition must inherit the shared Oremea gold rather than define a competing accent hue.",
);

const checkoutActionUses = access.match(/<CheckoutAction/g) ?? [];
assert.ok(
  checkoutActionUses.length >= 2,
  "Compass must offer conversion near the decision point and again after the buyer has read the funnel.",
);

const centeredCtaRows = access.match(/justify-center/g) ?? [];
assert.ok(
  centeredCtaRows.length >= 3,
  "Compass CTA buttons must remain centered in the active-access, primary and closing conversion sections.",
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

console.log("Compass conversational funnel, centered CTAs, price-free public copy, private-method and Oremea-gold contract checks passed.");
