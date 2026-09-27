import assert from "node:assert/strict";

import { aggregateDawnCommerceMetrics } from "@/src/lib/oremea/dawn-commerce-metrics";

const closed = new Date("2026-09-27T00:00:00.000Z");

const metrics = aggregateDawnCommerceMetrics(
  [
    {
      user_id: "buyer-a",
      kind: "initial",
      quantity: 4,
      amount_cents: 17000,
      remaining_quantity: 2,
      status: "paid",
      parent_id: null,
      offer_closed_at: closed,
    },
    {
      user_id: "buyer-a",
      kind: "completion",
      quantity: 6,
      amount_cents: 22000,
      remaining_quantity: 6,
      status: "paid",
      parent_id: "order-a",
      offer_closed_at: null,
    },
    {
      user_id: "buyer-b",
      kind: "initial",
      quantity: 1,
      amount_cents: 5000,
      remaining_quantity: 0,
      status: "failed",
      parent_id: null,
      offer_closed_at: null,
    },
    {
      user_id: "buyer-c",
      kind: "initial",
      quantity: 3,
      amount_cents: 13500,
      remaining_quantity: 0,
      status: "refunded",
      parent_id: null,
      offer_closed_at: closed,
    },
    {
      user_id: "buyer-c",
      kind: "smaller",
      quantity: 5,
      amount_cents: 22000,
      remaining_quantity: 0,
      status: "failed",
      parent_id: "order-c",
      offer_closed_at: null,
    },
  ],
  2,
  "2026-09-27T06:00:00.000Z",
);

assert.equal(metrics.availability, "available");
assert.equal(metrics.privacy, "aggregate_no_pii");
assert.equal(metrics.coverage.affiliateAttribution, "not_collected");
assert.equal(metrics.coverage.apiUsageCost, "usage_exposed_by_gateway_not_persisted");
assert.equal(metrics.coverage.pageFunnelEvents, "not_collected");
assert.equal(metrics.coverage.subscriptionRetention, "not_aggregated");

const resonance = metrics.resonanceVisits;
assert.equal(resonance.orderStarts, 5);
assert.equal(resonance.initialOrderStarts, 3);
assert.equal(resonance.additionalOrderStarts, 2);
assert.equal(resonance.successfulOrders, 3);
assert.equal(resonance.paidOrders, 2);
assert.equal(resonance.refundedOrders, 1);
assert.equal(resonance.failedOrders, 2);
assert.equal(resonance.grossSuccessfulOrderValueCents, 52500);
assert.equal(resonance.currentlyPaidOrderValueCents, 39000);
assert.equal(resonance.grossPurchasedVisits, 13);
assert.equal(resonance.unusedPaidVisits, 8);
assert.equal(resonance.redeemedVisits, 2);
assert.equal(resonance.uniqueSuccessfulBuyers, 2);
assert.equal(resonance.repeatBuyerCount, 1);
assert.equal(resonance.completionOfferOrders, 1);
assert.equal(resonance.smallerOfferOrders, 1);
assert.equal(resonance.closedAdditionalOffers, 2);
assert.equal(resonance.acceptedAdditionalOffers, 2);
assert.equal(resonance.declinedAdditionalOffers, 0);
assert.equal(resonance.successfulAdditionalOrders, 1);
assert.equal(resonance.initialOrderPaymentSuccessRate, 0.6667);
assert.equal(resonance.overallOrderPaymentSuccessRate, 0.6);
assert.equal(resonance.additionalOfferSelectionRate, 1);
assert.equal(resonance.additionalOrderPaymentSuccessRate, 0.5);
assert.equal(resonance.repeatBuyerRate, 0.5);
assert.equal(resonance.visitRedemptionRate, 0.1538);

const serialized = JSON.stringify(metrics);
assert.equal(serialized.includes("buyer-a"), false);
assert.equal(serialized.includes("buyer-b"), false);
assert.equal(serialized.includes("buyer-c"), false);
assert.equal(serialized.includes("email"), false);

console.log("DAWN aggregate commerce telemetry contract checks passed.");
