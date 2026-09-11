import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import {
  additionalOffers, initialOffer, INITIAL_QUANTITIES, offerPlanEnv,
  VISIT_PRICES, visitsEnabled, visitCheckoutEnabled,
} from "../src/lib/resonance/visit-offers";
import {
  matchesVisitOrder, matchesVisitRefund, visitPaymentSchema,
  visitPaymentUpdate, visitRefundSchema,
} from "../src/lib/resonance/visit-payment-contract";
import { chargeVisitOrder, createVisitCheckout } from "../src/lib/whop/visit-payments";

async function main() {
  assert.deepEqual(INITIAL_QUANTITIES, [1, 3, 4]);
  assert.deepEqual(VISIT_PRICES, {
    1: 5000, 2: 9500, 3: 14000, 4: 18000, 5: 22000,
    6: 26000, 7: 30000, 8: 33500, 9: 37000, 10: 40000,
  });
  for (const invalid of [0, 2, 5, 10, 1.5, NaN, Infinity]) {
    assert.throws(() => initialOffer(invalid));
    assert.throws(() => additionalOffers(invalid));
  }
  for (const quantity of INITIAL_QUANTITIES) {
    const [completion, ...smaller] = additionalOffers(quantity);
    assert.equal(quantity + completion.quantity, 10);
    assert.equal(initialOffer(quantity).amountCents + completion.amountCents, VISIT_PRICES[10]);
    assert.equal(offerPlanEnv(completion, quantity), `WHOP_RESONANCE_COMPLETE_FROM_${quantity}_PLAN_ID`);
    for (const offer of smaller) {
      assert.ok(offer.quantity < completion.quantity && offer.amountCents < completion.amountCents,
        "Do not show an inferior same-price smaller package.");
      assert.equal(offer.amountCents, VISIT_PRICES[offer.quantity]);
    }
  }
  assert.deepEqual(additionalOffers(4)[0], { kind: "completion", quantity: 6, amountCents: 22000 });
  assert.deepEqual(additionalOffers(4).slice(1).map((offer) => offer.quantity), [1, 2, 3, 4]);
  assert.equal(initialOffer(4).amountCents * 2, 36000,
    "A later four-pack is a fresh purchase, not cumulative tier pricing.");
  // Every partition into smaller standalone orders costs at least the whole pack.
  const cheapest = [0];
  for (let total = 1; total <= 10; total++) {
    cheapest[total] = Math.min(...Array.from({ length: total }, (_, i) => {
      const quantity = (i + 1) as keyof typeof VISIT_PRICES;
      return cheapest[total - quantity] + VISIT_PRICES[quantity];
    }));
    assert.equal(cheapest[total], VISIT_PRICES[total as keyof typeof VISIT_PRICES]);
  }
  delete process.env.RESONANCE_VISITS_ENABLED;
  process.env.RESONANCE_VISITS_CHECKOUT_ENABLED = "true";
  assert.equal(visitCheckoutEnabled(), false);
  process.env.RESONANCE_VISITS_ENABLED = "true";
  assert.equal(visitCheckoutEnabled(), true);
  process.env.RESONANCE_VISITS_CHECKOUT_ENABLED = "false";
  assert.equal(visitsEnabled(), true, "Stopping sales must not hide purchased credits.");
  assert.equal(visitCheckoutEnabled(), false);

  const order = {
    id: "00000000-0000-4000-8000-000000000001", buyer_email: "buyer@example.test",
    whop_plan_id: "plan_test", whop_checkout_id: "ch_test", whop_payment_id: null,
    whop_member_id: null, whop_payment_method_id: null, parent_id: null,
    amount_cents: 18000, quantity: 4, status: "pending",
  };
  const payment = visitPaymentSchema.parse({
    id: "pay_test", company: { id: "biz_test" }, product: { id: "prod_test" },
    plan: { id: "plan_test" }, member: { id: "mbr_test" }, payment_method: { id: "pmt_test" },
    checkout_configuration_id: "ch_test", metadata: { oremea_visit_order: order.id },
    user: { email: "BUYER@example.test" }, currency: "usd", subtotal: 180,
    paid_at: "2026-09-10T18:41:00.000Z", refunded_amount: 0,
  });
  assert.equal(matchesVisitOrder(payment, order, "biz_test", "prod_test"), true);
  const mismatches = [
    { company: { id: "biz_other" } }, { product: { id: "prod_other" } },
    { plan: { id: "plan_other" } }, { user: { email: "other@example.test" } },
    { subtotal: 1 }, { subtotal: null }, { currency: "zar" },
    { checkout_configuration_id: "ch_other" },
    { metadata: { oremea_visit_order: "00000000-0000-4000-8000-000000000002" } },
  ];
  for (const change of mismatches) {
    assert.equal(matchesVisitOrder({ ...payment, ...change }, order, "biz_test", "prod_test"), false);
  }
  assert.equal(matchesVisitOrder(payment, order, "", "prod_test"), false);
  assert.equal(matchesVisitOrder(payment, { ...order, whop_payment_id: "pay_other" }, "biz_test", "prod_test"), false);
  const addon = { ...order, parent_id: order.id, whop_member_id: "mbr_test", whop_payment_method_id: "pmt_test" };
  assert.equal(matchesVisitOrder(payment, addon, "biz_test", "prod_test"), true);
  assert.equal(matchesVisitOrder({ ...payment, member: { id: "mbr_other" } }, addon, "biz_test", "prod_test"), false);
  assert.equal(matchesVisitOrder({ ...payment, payment_method: null }, addon, "biz_test", "prod_test"), false);

  const settled = visitPaymentUpdate("payment.succeeded", payment, order);
  assert.equal(settled?.status, "paid");
  assert.equal(settled?.remaining_quantity, 4);
  assert.equal(visitPaymentUpdate("payment.succeeded", payment, { ...order, status: "paid" }), null,
    "Duplicate success must not refill visits already used.");
  for (const type of ["payment.failed", "payment.canceled"]) {
    assert.equal(visitPaymentUpdate(type, payment, { ...order, status: "paid" }), null);
    assert.equal(visitPaymentUpdate(type, payment, order)?.whop_payment_id, null);
    assert.equal(visitPaymentUpdate(type, payment, addon)?.whop_payment_id, payment.id);
  }
  assert.equal(visitPaymentUpdate("payment.succeeded", payment, { ...order, status: "unknown" })?.remaining_quantity, 4);
  assert.equal(visitPaymentUpdate("payment.succeeded", payment, { ...order, status: "failed" })?.remaining_quantity, 4);
  assert.equal(visitPaymentUpdate("payment.succeeded", payment, { ...order, status: "refunded" }), null);
  assert.equal(visitPaymentUpdate("payment.succeeded", { ...payment, refunded_amount: 10 }, order)?.remaining_quantity, 0);
  assert.throws(() => visitPaymentUpdate("payment.succeeded", { ...payment, paid_at: null }, order));
  assert.equal(visitPaymentUpdate("checkout.completed", payment, order), null,
    "A browser checkout completion is not a settled payment.");

  const refund = visitRefundSchema.parse({
    type: "refund.updated", company_id: "biz_test",
    data: { id: "rf_test", amount: 10, status: "succeeded", currency: "usd", payment },
  });
  assert.equal(matchesVisitRefund(refund, order, "biz_test", "prod_test"), true);
  assert.equal(matchesVisitRefund({ ...refund, company_id: "biz_other" }, order, "biz_test", "prod_test"), false);
  assert.equal(matchesVisitRefund(refund, { ...order, whop_payment_id: "pay_other" }, "biz_test", "prod_test"), false);

  // Provider contract tests are mocked: no credentials, network, or real charge.
  process.env.WHOP_API_KEY = "test-only-not-a-real-key";
  process.env.WHOP_ACCOUNT_ID = "biz_test";
  process.env.WHOP_RESONANCE_VISITS_PRODUCT_ID = "prod_test";
  process.env.NEXT_PUBLIC_APP_URL = "https://example.test";
  const originalFetch = globalThis.fetch;
  const calls: { url: string; body: Record<string, unknown> }[] = [];
  let responsePlan: Record<string, unknown> = {
    id: "plan_test", currency: "usd", initial_price: 180,
    plan_type: "one_time", expiration_days: null, adaptive_pricing_enabled: false,
  };
  try {
    globalThis.fetch = async (url, init) => {
      calls.push({ url: String(url), body: JSON.parse(String(init?.body)) });
      return Response.json(String(url).endsWith("/payments") ? { id: "pay_created" }
        : { id: "ch_created", account_id: "biz_test", plan: responsePlan });
    };
    assert.equal(await createVisitCheckout(order), "ch_created");
    assert.deepEqual(calls[0].body.metadata, { oremea_visit_order: order.id });
    assert.equal(calls[0].body.plan_id, order.whop_plan_id);
    for (const change of [
      { initial_price: 1 }, { currency: "eur" }, { plan_type: "renewal" },
      { expiration_days: 7 }, { adaptive_pricing_enabled: true },
    ]) {
      const original = responsePlan;
      responsePlan = { ...original, ...change };
      await assert.rejects(() => createVisitCheckout(order));
      responsePlan = original;
    }
    assert.equal(await chargeVisitOrder(addon), "pay_created");
    assert.equal(calls.at(-1)?.body.member_id, "mbr_test");
    assert.equal(calls.at(-1)?.body.payment_method_id, "pmt_test");
    let attempts = 0;
    globalThis.fetch = async () => { attempts++; throw new Error("simulated connection interruption"); };
    await assert.rejects(() => chargeVisitOrder(addon));
    assert.equal(attempts, 1, "Never automatically retry an unknown saved-card charge.");
  } finally { globalThis.fetch = originalFetch; }

  // Structural guards complement unit checks; database races require staging QA.
  const service = readFileSync("src/lib/resonance/visit-orders.ts", "utf8");
  assert.match(service, /prisma\.\$transaction/);
  assert.match(service, /lockResonanceAccount\(tx, userId\)/);
  assert.match(service, /remaining_quantity: \{ decrement: 1 \}/);
  assert.match(service, /request_id: requestId/);
  assert.match(service, /where: \{ parent_id: parent.id \}/);
  assert.match(service, /status: "unknown"/);
  assert.match(service, /room\?\.is_published/);
  assert.match(service, /started_at: new Date\(\)/);
  const legacy = readFileSync("src/lib/resonance/resonance-week-runs.ts", "utf8");
  assert.match(legacy, /lockResonanceAccount\(tx, userId\)/);
  const completionPage = readFileSync("app/(member)/resonance/complete/page.tsx", "utf8");
  assert.match(completionPage, /AdditionalOfferPicker/);
  const completionPicker = readFileSync("app/(member)/resonance/complete/additional-offer-picker.tsx", "utf8");
  assert.match(completionPicker, /Complete ten[\s\S]*Choose fewer visits[\s\S]*No thanks/);
  assert.match(completionPicker, /aria-label="Choose fewer additional visits"/);
  assert.match(completionPicker, /aria-label="Choose more additional visits"/);
  const purchasePage = readFileSync("app/(member)/resonance/visits/page.tsx", "utf8");
  assert.match(purchasePage, /data-whop-checkout-setup-future-usage="off_session"/);
  assert.match(purchasePage, /data-whop-checkout-session=\{order.whop_checkout_id\}/);
  console.log("Resonance visit pricing, payment, refund, and funnel contract checks passed (provider mocked; no live database or payment test).");
}

main().catch((error) => { console.error(error); process.exitCode = 1; });
