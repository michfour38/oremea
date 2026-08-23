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
const billing = read("components/works/provider/provider-billing.tsx");
const schema = read("prisma/schema/works-payfast.prisma");
const migration = read("prisma/migrations/20260811071500_add_works_payfast_billing/migration.sql");
const consentMigration = read("prisma/migrations/20260823164000_add_works_payfast_recurring_consent/migration.sql");
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
requireText(checkout, "acceptRecurringTerms !== true", "WORKS checkout must require affirmative recurring-payment acceptance.");
requireText(checkout, "recurring_consent_at: new Date()", "WORKS checkout must retain a dated recurring-payment acceptance.");
requireText(checkout, "recurring_consent_version: RECURRING_CONSENT_VERSION", "WORKS checkout must retain the accepted disclosure version.");
requireText(checkout, "recurring_consent_summary: recurringConsentSummary", "WORKS checkout must retain the accepted recurring-payment terms.");
requireText(checkout, "recurring_consent_user_id: userId", "WORKS checkout must bind recurring acceptance to the signed-in account.");

for (const disclosure of [
  "Before PayFast",
  "ZAR",
  "same calendar day",
  "until cancelled",
  "Cancel any time from WORKS Billing",
  "Payments, Subscriptions, Cancellation &amp; Refund Policy",
  "I accept this recurring payment, service delivery, cancellation and refund arrangement",
]) {
  requireText(billing, disclosure, `WORKS checkout disclosure missing: ${disclosure}`);
}
requireText(billing, "acceptRecurringTerms: true", "WORKS billing UI must send explicit recurring acceptance to the server.");

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

for (const schemaField of [
  "merchant_payment_id",
  "event_key",
  "recurring_consent_at",
  "recurring_consent_summary",
]) {
  requireText(schema, schemaField, `WORKS billing schema field missing: ${schemaField}`);
}
requireText(migration, "FOREIGN KEY (\"provider_id\") REFERENCES \"works_providers\"", "WORKS billing records must be bound to a real provider.");
requireText(migration, "UNIQUE INDEX \"works_provider_payfast_events_event_key_key\"", "WORKS PayFast event idempotency must be enforced in the database.");
requireText(consentMigration, "recurring_consent_at", "WORKS recurring consent migration must retain acceptance time.");
requireText(consentMigration, "recurring_consent_version", "WORKS recurring consent migration must retain disclosure version.");
requireText(consentMigration, "recurring_consent_summary", "WORKS recurring consent migration must retain disclosure content.");
requireText(consentMigration, "recurring_consent_user_id", "WORKS recurring consent migration must retain the accepting account.");

for (const variable of [
  "PAYFAST_MERCHANT_ID=",
  "PAYFAST_MERCHANT_KEY=",
  "PAYFAST_PASSPHRASE=",
  "PAYFAST_SANDBOX=true",
]) {
  requireText(env, variable, `Missing WORKS PayFast environment contract: ${variable}`);
}

console.log("✓ WORKS PayFast billing contract");
