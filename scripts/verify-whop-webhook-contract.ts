import { createHmac } from "node:crypto";

import { verifyWhopWebhook } from "../src/lib/whop/verify-webhook";

function assert(condition: unknown, message: string): asserts condition {
  if (!condition) throw new Error(message);
}

const secret = "test-secret";
const webhookId = "msg_compass_test";
const webhookTimestamp = "1786276800";
const body = '{"type":"payment.succeeded"}';
const signature = createHmac("sha256", secret)
  .update(`${webhookId}.${webhookTimestamp}.${body}`)
  .digest("base64");
const now = new Date("2026-08-09T12:00:00.000Z");

assert(
  verifyWhopWebhook({
    body,
    webhookId,
    webhookTimestamp,
    webhookSignature: `v1,${signature}`,
    secret,
    now,
  }),
  "A valid Whop signature must be accepted.",
);
assert(
  !verifyWhopWebhook({
    body: `${body} `,
    webhookId,
    webhookTimestamp,
    webhookSignature: `v1,${signature}`,
    secret,
    now,
  }),
  "A changed Whop payload must be rejected.",
);
assert(
  !verifyWhopWebhook({
    body,
    webhookId,
    webhookTimestamp,
    webhookSignature: `v1,${signature}`,
    secret,
    now: new Date("2026-08-09T12:06:00.000Z"),
  }),
  "A stale Whop webhook must be rejected.",
);

console.log("Whop webhook contract checks passed.");
