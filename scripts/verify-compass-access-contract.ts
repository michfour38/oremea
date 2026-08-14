import {
  appendCompassPaymentReference,
  calculateCompassExpiry,
  getCompassDaysRemaining,
  isCompassAccessActive,
  readCompassPaymentReferences,
} from "../src/lib/compass/compass-access-contract";

function assert(condition: unknown, message: string): asserts condition {
  if (!condition) throw new Error(message);
}

const purchaseTime = new Date("2026-08-09T12:00:00.000Z");
const expiry = calculateCompassExpiry(purchaseTime);

assert(
  expiry.toISOString() === "2026-09-08T12:00:00.000Z",
  "A Compass purchase must expire exactly 30 days after payment.",
);
assert(
  isCompassAccessActive(expiry, new Date("2026-09-08T11:59:59.999Z")),
  "Compass access must remain active until the expiry instant.",
);
assert(
  !isCompassAccessActive(expiry, new Date("2026-09-08T12:00:00.000Z")),
  "Compass access must end at the expiry instant.",
);
assert(
  getCompassDaysRemaining(expiry, purchaseTime) === 30,
  "A fresh Compass purchase must report 30 days remaining.",
);

const stackedExpiry = calculateCompassExpiry(
  new Date("2026-08-20T12:00:00.000Z"),
  expiry,
);
assert(
  stackedExpiry.toISOString() === "2026-10-08T12:00:00.000Z",
  "A second purchase during active access must add another complete 30 days.",
);

const paymentReferences = appendCompassPaymentReference(
  appendCompassPaymentReference("payment_first", "payment_second"),
  "payment_first",
);
assert(
  JSON.stringify(readCompassPaymentReferences(paymentReferences)) ===
    JSON.stringify(["payment_first", "payment_second"]),
  "Payment retries must remain idempotent after later purchases.",
);

console.log("Compass access contract checks passed.");
