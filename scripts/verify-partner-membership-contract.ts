import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

import {
  matchPublishedPartnerWhopPlan,
  shouldApplyPartnerMembershipEvent,
} from "../src/lib/oremea/partner-membership-contract";
import {
  OREMEA_PARTNER_EXPERIENCES,
  type PartnerExperience,
} from "../src/lib/oremea/partner-experiences";

const angela = OREMEA_PARTNER_EXPERIENCES.angela;
assert.equal(matchPublishedPartnerWhopPlan("prod_1", "plan_1"), null,
  "Draft Angela plans must never map to actual product access.");

const approved: PartnerExperience = {
  ...angela,
  status: "published",
  offers: [{
    ...angela.offers[1],
    status: "published",
    checkout: {
      whopProductId: "prod_1",
      whopPlanId: "plan_1",
      href: "https://whop.com/checkout/plan_1/",
      currency: "ZAR",
      chargePriceCents: 10000,
    },
  }],
};
const match = matchPublishedPartnerWhopPlan("prod_1", "plan_1", [approved]);
assert.deepEqual(match, {
  partnerSlug: "angela",
  offerKey: "guided",
  whopProductId: "prod_1",
  whopPlanId: "plan_1",
  productKeys: ["recognition", "compass"],
}, "SUSTAIN must not be granted access through OREMEA's membership ledger.");

assert.equal(matchPublishedPartnerWhopPlan("prod_other", "plan_1", [approved]), null);
assert.equal(matchPublishedPartnerWhopPlan("prod_1", "plan_other", [approved]), null);
assert.equal(matchPublishedPartnerWhopPlan("prod_1", "plan_1", [approved, approved]), null,
  "Ambiguous Whop plan mapping must fail closed.");
assert.equal(matchPublishedPartnerWhopPlan("prod_1", "plan_1", [
  { ...approved, status: "draft" },
]), null);
assert.equal(matchPublishedPartnerWhopPlan("prod_1", "plan_1", [{
  ...approved,
  offers: [{ ...approved.offers[0], purchaseMode: "one_time", billingInterval: null }],
}]), null, "Membership events must not fulfil one-off partner plans.");
assert.equal(matchPublishedPartnerWhopPlan("prod_1", "plan_1", [{
  ...approved,
  offers: [{ ...approved.offers[0], expansionPending: true }],
}]), null, "Incomplete expanded packages must not grant access.");
assert.equal(matchPublishedPartnerWhopPlan("prod_1", "plan_1", [{
  ...approved,
  offers: [{ ...approved.offers[0], checkout: { ...approved.offers[0].checkout!, href: "https://evil.example/checkout/plan_1" } }],
}]), null);

const eventAt = new Date("2026-11-02T15:00:00.000Z");
const earlier = new Date("2026-11-01T15:00:00.000Z");
const later = new Date("2026-11-03T15:00:00.000Z");
assert.equal(shouldApplyPartnerMembershipEvent(null, { eventAt, active: true }), true);
assert.equal(shouldApplyPartnerMembershipEvent(null, { eventAt, active: false }), false);
assert.equal(shouldApplyPartnerMembershipEvent({last_event_at: eventAt, status: "active"}, {eventAt: earlier, active: false}), false);
assert.equal(shouldApplyPartnerMembershipEvent({last_event_at: eventAt, status: "active"}, {eventAt, active: false}), true);
assert.equal(shouldApplyPartnerMembershipEvent({last_event_at: eventAt, status: "inactive"}, {eventAt, active: true}), false);
assert.equal(shouldApplyPartnerMembershipEvent({last_event_at: eventAt, status: "inactive"}, {eventAt: later, active: true}), true);
assert.equal(shouldApplyPartnerMembershipEvent({last_event_at: eventAt, status: "active"}, {eventAt, active: true}), false);

const ledger = readFileSync("src/lib/oremea/partner-memberships.ts", "utf8");
const schema = readFileSync("prisma/schema/partner-memberships.prisma", "utf8");
const migration = readFileSync("prisma/migrations/20261102190000_partner_memberships/migration.sql", "utf8");
const webhook = readFileSync("app/api/webhooks/whop/route.ts", "utf8");
const recognition = readFileSync("src/lib/recognition/recognition-conversation-access.ts", "utf8");
const compass = readFileSync("src/lib/compass/compass-access.ts", "utf8");

assert.match(schema, /model oremea_partner_memberships/);
assert.match(schema, /whop_membership_id\s+String\s+@unique/);
assert.match(schema, /product_keys\s+String\[\]/);
assert.match(migration, /CREATE TABLE "oremea_partner_memberships"/);
assert.doesNotMatch(migration, /DROP TABLE|DELETE FROM|ALTER TABLE "oremea_entitlements"/i);
assert.match(ledger, /partnerMembershipAccessEnabled\(\)/);
assert.match(ledger, /product_keys: \{ has: product \}/);
assert.match(ledger, /period_end: \{ gt: now \}/);
assert.match(ledger, /shouldApplyPartnerMembershipEvent/);
assert.match(ledger, /status: "inactive"/);
assert.match(webhook, /verifyWhopWebhook/);
assert.match(webhook, /partnerMembershipAccessEnabled\(\)/);
assert.match(webhook, /matchPublishedPartnerWhopPlan/);
assert.match(webhook, /findExactlyOneOremeaUser\(membership.email\)/);
assert.match(recognition, /hasActivePartnerProductAccess\(userId, "recognition", now\)/);
assert.match(compass, /hasActivePartnerProductAccess\(userId, "compass", now\)/);
assert.match(recognition, /"partner_subscription"/);
assert.match(compass, /"partner_subscription"/);
assert.doesNotMatch(ledger, /sustain\.api|SUSTAIN_DAWN|sustain\//i);

console.log("Partner plan matching, out-of-order events, separate ledgers and feature flag contracts passed.");
