import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const purchase = readFileSync("app/recognition/purchase/page.tsx", "utf8");
const middleware = readFileSync("middleware.ts", "utf8");

assert.match(
  purchase,
  /affiliateCheckoutUrl\([\s\S]*RECOGNITION_SUBSCRIPTION_CHECKOUT_URL/,
  "Recognition checkout must preserve affiliate attribution instead of creating a parallel checkout path.",
);
assert.match(
  purchase,
  /redirect\("https:\/\/recognition\.oremea\.com\/begin"\)/,
  "Active Recognition members must bypass the purchase funnel and enter the product.",
);
assert.match(
  purchase,
  /Ever noticed how the same thought can keep following you around/,
  "Recognition funnel must open with a human, recognition-first hook rather than product documentation.",
);
assert.match(
  purchase,
  /That is Recognition[\s\S]*private AI discussion journal/,
  "Recognition must state its product identity plainly after the human problem is established.",
);
assert.match(
  purchase,
  /Not another voice rushing in to tell you what your own thought means/,
  "Recognition must build trust by preserving participant authorship rather than promising interpretation.",
);
assert.match(
  purchase,
  /After purchase/,
  "The Recognition funnel must explain the post-purchase handoff.",
);
assert.match(
  purchase,
  /Use the same email for your purchase and Oremea sign-in/,
  "The funnel must explain the one-email handoff without exposing payment infrastructure as another customer step.",
);
assert.match(
  purchase,
  /View Recognition access/,
  "Recognition must send ready buyers to the current access options without duplicating price copy.",
);
assert.doesNotMatch(
  purchase,
  /RECOGNITION_PRICING|formatRecognitionPrice|\$\s*\d|\/month|monthly access|prices are shown/i,
  "Recognition public funnel must remain price-free; current pricing belongs on the provider purchase surface.",
);
assert.doesNotMatch(
  purchase,
  /active Whop membership|secure Whop checkout|Once Whop has confirmed the membership|Whop purchase/i,
  "The customer-facing Recognition funnel must not make the payment provider a separate conceptual step.",
);
assert.doesNotMatch(
  purchase,
  /resonance\.oremea\.com|compass\.oremea\.com|href="\/resonance|href="\/compass/i,
  "Recognition must not force a buyer into another product funnel before Recognition delivers its own value.",
);
assert.match(
  purchase,
  /rec-saved-panel[\s\S]*text-center[\s\S]*text-left/,
  "Recognition framed conversion cards must keep headings and CTAs centered while explanatory copy remains left-aligned.",
);

const checkoutActionUses = purchase.match(/<CheckoutAction/g) ?? [];
assert.ok(
  checkoutActionUses.length >= 2,
  "Recognition must offer access near the decision point and again after the buyer has read the funnel.",
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

console.log("Recognition conversational, price-free, participant-owned funnel contract checks passed.");
