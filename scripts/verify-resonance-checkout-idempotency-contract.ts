import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const service = readFileSync("src/lib/resonance/visit-orders.ts", "utf8");
const purchasePage = readFileSync("app/(member)/resonance/visits/page.tsx", "utf8");
const provider = readFileSync("src/lib/whop/visit-payments.ts", "utf8");
const checkoutRecovery = readFileSync("src/lib/resonance/initial-checkout-recovery.ts", "utf8");

// Separate browser tabs and separately generated request IDs must serialize on
// the same account before a provider checkout can be created.
assert.match(
  service,
  /startVisitPurchase[\s\S]*prisma\.\$transaction[\s\S]*lockResonanceAccount\(tx, userId\)[\s\S]*status: \{ in: \["pending", "unknown"\] \}/,
);

// An unresolved initial order is reused rather than creating another Whop
// checkout. A confirmed failure is intentionally not included: the same
// provider checkout can be retried after a declined payment.
assert.match(
  service,
  /const unresolved = await tx\.resonance_visit_orders\.findFirst\([\s\S]*kind: "initial"[\s\S]*status: \{ in: \["pending", "unknown"\] \}[\s\S]*if \(unresolved\) return \{ order: unresolved, submit: false \}/,
);

// Visiting the package chooser directly also resumes the unresolved order so
// the UI does not invite a second checkout while the first outcome is unknown.
assert.match(purchasePage, /getUnresolvedInitialVisitOrder\(userId\)/);
assert.match(
  purchasePage,
  /if \(!query\.order\)[\s\S]*redirect\(`\/resonance\/visits\?order=\$\{unresolved\.id\}\$\{roomSuffix\}`\)/,
);

// If checkout-session creation itself lost its response, recover the checkout
// with the same order identity. This is checkout creation only: it must never
// call the saved-card payment function, and the public checkout kill switch
// must still stop the provider POST.
assert.match(checkoutRecovery, /restoreInitialVisitCheckout/);
assert.match(checkoutRecovery, /!\["pending", "unknown"\]\.includes\(order\.status\)/);
assert.match(checkoutRecovery, /const checkoutId = await createVisitCheckout\(order\)/);
assert.match(checkoutRecovery, /whop_checkout_id: null/);
assert.match(checkoutRecovery, /data: \{ whop_checkout_id: checkoutId, status: "pending" \}/);
assert.doesNotMatch(checkoutRecovery, /chargeVisitOrder/);
assert.match(
  purchasePage,
  /checkoutEnabled && order && !order\.whop_checkout_id[\s\S]*restoreInitialVisitCheckout\(userId, order\.id\)/,
);

// Both checkout creation and saved-card add-ons carry stable provider
// idempotency keys. The charge function still has no automatic retry loop.
assert.match(provider, /idempotencyKey: `oremea-resonance-checkout-\$\{order\.id\}`/);
assert.match(provider, /idempotencyKey: `oremea-resonance-payment-\$\{order\.id\}`/);
assert.doesNotMatch(provider, /for \([\s\S]*chargeVisitOrder|while \([\s\S]*chargeVisitOrder/);

console.log("Resonance checkout recovery and payment idempotency guards passed.");
