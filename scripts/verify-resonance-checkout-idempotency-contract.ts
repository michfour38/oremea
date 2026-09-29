import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const service = readFileSync("src/lib/resonance/visit-orders.ts", "utf8");
const purchasePage = readFileSync("app/(member)/resonance/visits/page.tsx", "utf8");
const provider = readFileSync("src/lib/whop/visit-payments.ts", "utf8");

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

// Saved-card add-ons carry a stable provider idempotency key as a second line
// of defence. The charge function still has no automatic retry loop.
assert.match(provider, /idempotencyKey: `oremea-resonance-payment-\$\{order\.id\}`/);
assert.doesNotMatch(provider, /for \([\s\S]*chargeVisitOrder|while \([\s\S]*chargeVisitOrder/);

console.log("Resonance unresolved-checkout and payment idempotency guards passed.");
