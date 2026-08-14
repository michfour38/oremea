import { readFileSync } from "fs";

function read(path: string) {
  return readFileSync(path, "utf8");
}

function requireText(source: string, needle: string, message: string) {
  if (!source.includes(needle)) throw new Error(message);
}

const helper = read("lib/works/billing/payfast.ts");
const checkout = read("app/api/works/billing/payfast/checkout/route.ts");
const itn = read("app/api/works/billing/payfast/itn/route.ts");
const subscription = read("app/api/works/billing/payfast/subscription/route.ts");
const schema = read("prisma/schema/works-payfast.prisma");
const migration = read("prisma/migrations/20260811071500_add_works_payfast_billing/migration.sql");
const env = read(".env.example");

requireText(helper, "payfastPaymentSignature", "WORKS PayFast checkout must be signed server-side.");
requireText(helper, "verifyPayfastItnSignature", "WORKS PayFast ITNs must verify their signature.");
requireText(helper, "verifyPayfastSource", "WORKS PayFast ITNs must verify PayFast source infrastructure.");
requireText(helper, "verifyPayfastServerConfirmation", "WORKS PayFast ITNs must confirm with PayFast server-to-server.");
requireText(helper, "frequency: \"3\"", "WORKS paid plans must use monthly PayFast frequency.");
requireText(helper, "cycles: \"0\"", "WORKS paid plans must use an indefinite subscription until cancellation.");
requireText(helper, "cancelPayfastSubscription", "WORKS must support provider-initiated PayFast cancellation.");

requireText(checkout, "resolveWorksProviderPlan(planKey)", "WORKS checkout price must come from the canonical plan registry.");
requireText(checkout, "amountCents = plan.priceMonthlyZar * 100", "WORKS checkout must derive amount server-side.");
requireText(checkout, "works_provider_memberships.findFirst", "WORKS checkout must verify provider ownership.");
requireText(checkout, "status: \"PENDING\"", "WORKS checkout must create a pending billing record before redirecting.");

for (const guard of [
  "verifyPayfastItnSignature",
  "verifyPayfastSource",
  "amountCents !== subscription.amount_cents",
  "verifyPayfastServerConfirmation",
  "payfastEventKey",
]) {
  requireText(itn, guard, `WORKS PayFast ITN security/idempotency guard missing: ${guard}`);
}
requireText(itn, "works_provider_commercial_profiles.upsert", "Verified PayFast completion must activate the WORKS plan server-side.");
requireText(itn, "WorksProviderPlan.FREE", "Verified PayFast cancellation must remove paid WORKS access.");

requireText(subscription, "cancelPayfastSubscription", "WORKS cancellation endpoint must cancel the PayFast subscription before changing access.");
requireText(subscription, "works_provider_memberships.findFirst", "WORKS cancellation must verify provider ownership.");

requireText(schema, "merchant_payment_id String", "WORKS billing must retain a merchant-side payment identity.");
requireText(schema, "event_key", "WORKS PayFast notifications must have an idempotency key.");
requireText(migration, "FOREIGN KEY (\"provider_id\") REFERENCES \"works_providers\"", "WORKS billing records must be bound to a real provider.");
requireText(migration, "UNIQUE INDEX \"works_provider_payfast_events_event_key_key\"", "WORKS PayFast event idempotency must be enforced in the database.");

for (const variable of [
  "PAYFAST_MERCHANT_ID=",
  "PAYFAST_MERCHANT_KEY=",
  "PAYFAST_PASSPHRASE=",
  "PAYFAST_SANDBOX=true",
]) {
  requireText(env, variable, `Missing WORKS PayFast environment contract: ${variable}`);
}

console.log("✓ WORKS PayFast billing contract");
