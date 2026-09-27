import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const purchase = readFileSync("app/recognition/purchase/page.tsx", "utf8");
const middleware = readFileSync("middleware.ts", "utf8");

assert.match(
  purchase,
  /affiliateCheckoutUrl\([\s\S]*RECOGNITION_SUBSCRIPTION_CHECKOUT_URL/,
  "Recognition checkout must preserve Whop affiliate attribution instead of creating a parallel checkout path.",
);
assert.match(
  purchase,
  /redirect\("https:\/\/recognition\.oremea\.com\/begin"\)/,
  "Active Recognition members must bypass the purchase funnel and enter the product.",
);
assert.match(
  purchase,
  /After checkout/,
  "The Recognition funnel must explain the post-checkout handoff.",
);
assert.match(purchase, /1 · Complete checkout/);
assert.match(purchase, /2 · Sign in with that email/);
assert.match(purchase, /3 · Begin where you are/);
assert.match(
  purchase,
  /Recognition access follows the email attached to the active Whop[\s\S]*membership/,
  "The funnel must explain the email identity that joins Whop access to Recognition.",
);

const checkoutActionUses = purchase.match(/<CheckoutAction/g) ?? [];
assert.ok(
  checkoutActionUses.length >= 2,
  "Recognition must offer checkout near the decision point and again after the buyer has read the funnel.",
);

assert.doesNotMatch(
  purchase,
  /resonance\.oremea\.com|compass\.oremea\.com|href="\/resonance|href="\/compass/i,
  "Recognition must not force a buyer into another product funnel before Recognition delivers its own value.",
);

assert.match(
  middleware,
  /if \(pathname === "\/" \|\| pathname === "\/purchase"\) \{[\s\S]*rewriteRecognitionPath\(req, "\/recognition\/purchase"\)/,
  "recognition.oremea.com must resolve to the Recognition purchase funnel.",
);
assert.match(
  middleware,
  /if \(pathname === "\/begin"\) \{[\s\S]*rewriteRecognitionPath\(req, "\/recognition"\)/,
  "Recognition /begin must remain the product handoff after access is active.",
);

console.log("Recognition purchase funnel handoff contract checks passed.");
