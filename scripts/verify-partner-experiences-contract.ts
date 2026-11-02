import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import {
  OREMEA_PARTNER_EXPERIENCES,
  getPublishedPartnerExperience,
  getStandalonePricing,
  resolvePublishedPartnerExperience,
  type PartnerExperience,
  type PartnerCheckout,
} from "../src/lib/oremea/partner-experiences";
import { OREMEA_AFFILIATE_POLICY } from "../src/lib/oremea/affiliate-policy";
import { OREMEA_PRICING } from "../src/lib/oremea/pricing";

const angela = OREMEA_PARTNER_EXPERIENCES.angela;
assert.equal(angela.status, "draft", "Unapproved partner must remain hidden.");
assert.equal(angela.proposedCreatorRate, OREMEA_AFFILIATE_POLICY.approvedCreatorRate);
assert.deepEqual(angela.offers.map(offer => offer.programmeMonths), [1, 3, 4]);
assert.deepEqual(angela.offers[0].includedProducts, ["sustain", "recognition"]);
assert.deepEqual(angela.offers[1].includedProducts, ["sustain", "recognition", "compass"]);
assert.equal(angela.offers[2].expansionPending, true);
assert.ok(angela.offers.every(offer =>
  offer.status === "draft" &&
  offer.checkout === null &&
  offer.purchaseMode === "subscription" &&
  offer.billingInterval === "month"
));
assert.equal(getPublishedPartnerExperience("angela"), null);
assert.equal(getPublishedPartnerExperience("../angela"), null);
assert.equal(getPublishedPartnerExperience("unknown"), null);
assert.strictEqual(getStandalonePricing("recognition"), OREMEA_PRICING.recognition);
assert.strictEqual(getStandalonePricing("compass"), OREMEA_PRICING.compass);

const validCheckout: PartnerCheckout = {
  whopProductId: "prod_test",
  whopPlanId: "plan_test",
  href: "https://whop.com/checkout/plan_test/",
  currency: "ZAR",
  chargePriceCents: 10000,
};
const published: PartnerExperience = {
  ...angela,
  status: "published",
  offers: [
    { ...angela.offers[0], status: "published", checkout: validCheckout },
    angela.offers[1],
    { ...angela.offers[2], status: "published", checkout: validCheckout },
  ],
};
const visible = resolvePublishedPartnerExperience(published);
assert.deepEqual(visible?.offers.map(offer => offer.key), ["starter"],
  "Draft and expansion-pending offers must not reach a public checkout.");
assert.equal(resolvePublishedPartnerExperience({
  ...published,
  offers: [{ ...published.offers[0], checkout: { ...validCheckout, href: "https://whop.com.evil.test/checkout/plan_test" } }],
}), null);
assert.equal(resolvePublishedPartnerExperience({
  ...published,
  offers: [{ ...published.offers[0], checkout: { ...validCheckout, chargePriceCents: 0 } }],
}), null);
assert.equal(resolvePublishedPartnerExperience({
  ...published,
  offers: [{ ...published.offers[0], purchaseMode: "one_time", billingInterval: "month" }],
}), null);
assert.equal(resolvePublishedPartnerExperience(null), null);

const entry = readFileSync("app/partner/[slug]/page.tsx", "utf8");
assert.match(entry, /getPublishedPartnerExperience/);
assert.match(entry, /notFound\(\)/);
assert.doesNotMatch(entry, /grantCompassAccess|setRecognitionMembershipAccess|activateCreatorSilverProduct|prisma/);
console.log("Partner experiences are draft-only, centrally configured and do not grant access.");
