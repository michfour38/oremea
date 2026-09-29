import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import {
  directVisitPaymentResultFromList,
  visitPaymentResultFromRecord,
  visitPaymentUpdate,
} from "../src/lib/resonance/visit-payment-contract";

const order = {
  id: "00000000-0000-4000-8000-000000000011",
  buyer_email: "buyer@example.test",
  whop_plan_id: "plan_addon",
  whop_checkout_id: null,
  whop_payment_id: null,
  whop_member_id: "mbr_test",
  whop_payment_method_id: "pmt_test",
  parent_id: "00000000-0000-4000-8000-000000000001",
  amount_cents: 22000,
  quantity: 6,
  status: "unknown",
};

const payment = {
  id: "pay_addon",
  company: { id: "biz_test" },
  product: { id: "prod_test" },
  plan: { id: "plan_addon" },
  member: { id: "mbr_test" },
  payment_method: { id: "pmt_test" },
  checkout_configuration_id: null,
  metadata: { oremea_visit_order: order.id },
  user: { email: "BUYER@example.test" },
  currency: "usd",
  subtotal: 220,
  paid_at: "2026-09-29T16:00:00.000Z",
  refunded_amount: 0,
  auto_refunded: false,
  status: "paid",
  substatus: "succeeded",
};

const list = (data: unknown[], hasNext = false) => ({ data, page_info: { has_next_page: hasNext } });

const settled = visitPaymentResultFromRecord(payment, order, "biz_test", "prod_test");
assert.equal(settled?.type, "payment.succeeded");
assert.equal(visitPaymentUpdate(settled!.type, settled!.payment, order)?.remaining_quantity, 6);

const fromList = directVisitPaymentResultFromList(list([payment]), order, "biz_test", "prod_test");
assert.equal(fromList?.type, "payment.succeeded");
assert.equal(directVisitPaymentResultFromList(list([{ ...payment, metadata: { oremea_visit_order: "00000000-0000-4000-8000-000000000099" } }]), order, "biz_test", "prod_test"), null);
assert.equal(directVisitPaymentResultFromList(list([{ ...payment, member: { id: "mbr_other" } }]), order, "biz_test", "prod_test"), null);
assert.throws(() => directVisitPaymentResultFromList(list([payment, { ...payment, id: "pay_duplicate" }]), order, "biz_test", "prod_test"));
assert.throws(() => directVisitPaymentResultFromList(list([payment], true), order, "biz_test", "prod_test"));

assert.equal(visitPaymentResultFromRecord({ ...payment, status: "open", substatus: "failed", paid_at: null }, order, "biz_test", "prod_test")?.type, "payment.failed");
assert.equal(visitPaymentResultFromRecord({ ...payment, status: "void", substatus: "canceled", paid_at: null }, order, "biz_test", "prod_test")?.type, "payment.canceled");
assert.equal(visitPaymentResultFromRecord({ ...payment, status: "pending", substatus: "pending", paid_at: null }, order, "biz_test", "prod_test"), null);
const refunded = visitPaymentResultFromRecord({ ...payment, substatus: "partially_refunded", refunded_amount: 20 }, order, "biz_test", "prod_test");
assert.equal(refunded?.type, "payment.succeeded");
assert.equal(visitPaymentUpdate(refunded!.type, refunded!.payment, order)?.status, "refunded");

const service = readFileSync("src/lib/resonance/visit-orders.ts", "utf8");
assert.match(service, /order\.parent_id && \["pending", "unknown"\]\.includes\(order\.status\)/);
assert.match(service, /whopApiRequest\(`payments\/\$\{encodeURIComponent\(order\.whop_payment_id\)\}`\)/);
assert.match(service, /created_after: createdAfter/);
assert.match(service, /params\.append\("plan_ids\[\]", order\.whop_plan_id\)/);
assert.match(service, /directVisitPaymentResultFromList\(response, order, expected\.companyId, expected\.productId\)/);
const recoveryBody = service.match(/async function reconcileAdditionalVisitOrderRecord[\s\S]*?\n}\n\n\/\*\* Explicit read-only recovery hook/)?.[0] ?? "";
assert.ok(recoveryBody, "Expected add-on reconciliation implementation.");
assert.doesNotMatch(recoveryBody, /chargeVisitOrder|method:\s*"POST"/);

console.log("Resonance saved-card add-on read-only reconciliation checks passed.");
