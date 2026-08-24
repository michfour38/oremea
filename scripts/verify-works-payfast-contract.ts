import { readFileSync } from "fs";

function read(path: string) {
  return readFileSync(path, "utf8");
}

function requireText(source: string, needle: string, message: string) {
  if (!source.includes(needle)) throw new Error(message);
}

function forbidText(source: string, needle: string, message: string) {
  if (source.includes(needle)) throw new Error(message);
}

const helper = read("lib/works/billing/payfast.ts");
const period = read("lib/works/billing/period.ts");
const checkout = read("app/api/works/billing/payfast/checkout/route.ts");
const itn = read("app/api/works/billing/payfast/itn/route.ts");
const subscription = read("app/api/works/billing/payfast/subscription/route.ts");
const billing = read("components/works/provider/provider-billing.tsx");
const cardMethods = read("components/works/works-recurring-card-methods.tsx");
const plans = read("app/works/providers/plans/page.tsx");
const providerMe = read("app/api/works/provider/me/route.ts");
const intelligence = read("app/api/works/provider/intelligence/route.ts");
const visa = read("public/payments/works/visa.svg");
const mastercard = read("public/payments/works/mastercard.svg");
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

requireText(period, "worksPaidThroughEnd", "WORKS must calculate the paid-through end before downgrading a cancelled plan.");
requireText(period, "addOneCalendarMonthUtc", "WORKS monthly paid-through calculation must use a calendar month.");
requireText(period, "effectiveWorksProviderPlan", "WORKS must resolve expired commercial access to Free.");

requireText(checkout, "resolveWorksProviderPlan(planKey)", "WORKS checkout price must come from the canonical plan registry.");
requireText(checkout, "amountCents = plan.priceMonthlyZar * 100", "WORKS checkout must derive amount server-side.");
requireText(checkout, "works_provider_memberships.findFirst", "WORKS checkout must verify provider ownership.");
requireText(checkout, "status: \"PENDING\"", "WORKS checkout must create a pending billing record before redirecting.");
requireText(checkout, "acceptRecurringTerms !== true", "WORKS checkout must require affirmative recurring-payment acceptance.");
requireText(checkout, "works-payfast-recurring-v2-2026-08-24", "WORKS checkout must use the current recurring consent disclosure version.");
requireText(checkout, "requests paid WORKS access to begin immediately", "WORKS checkout must record the subscriber's immediate-service request.");
requireText(checkout, "paid billing period", "WORKS checkout consent must preserve paid access through the paid period after cancellation.");
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
  "paid access ordinarily continues through the current paid billing period",
  "statutory cooling-off period may affect that cooling-off right",
  "Payments, Subscriptions, Cancellation &amp; Refund Policy",
  "request paid WORKS access to begin immediately after verified payment",
  'href="/works/terms"',
]) {
  requireText(billing, disclosure, `WORKS checkout disclosure missing: ${disclosure}`);
}
requireText(billing, "acceptRecurringTerms: true", "WORKS billing UI must send explicit recurring acceptance to the server.");
requireText(billing, "<WorksRecurringCardMethods compact />", "WORKS authenticated checkout must show recurring card methods before PayFast.");

requireText(plans, "ZAR · recurring monthly", "WORKS public plans must state the paid transaction currency and billing interval.");
requireText(plans, "<WorksRecurringCardMethods />", "WORKS public plans must expose the recurring card methods for merchant review.");
requireText(plans, "Physical and legal-service address", "WORKS public plan page must expose supplier address information.");
for (const cardDisclosure of [
  "Recurring card setup · PayFast by Network",
  "PayFast&apos;s secure checkout",
  "3D Secure",
  "WORKS does not receive or store full card details",
  "/payments/works/visa.svg",
  "/payments/works/mastercard.svg",
]) {
  requireText(cardMethods, cardDisclosure, `WORKS recurring card disclosure missing: ${cardDisclosure}`);
}
requireText(visa, "#143CCB", "WORKS Visa asset must be the authorised colour mark from the PayFast merchant pack.");
requireText(mastercard, "#EB001B", "WORKS Mastercard asset must be the authorised colour mark from the PayFast merchant pack.");
requireText(mastercard, "#F79D1C", "WORKS Mastercard asset must retain the authorised overlapping-card artwork.");

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
requireText(itn, "worksPaidThroughEnd", "Verified PayFast cancellation must calculate remaining paid access.");
requireText(itn, "plan_ends_at: accessEndsAt", "Verified PayFast cancellation must retain the paid plan until its paid-through end.");
forbidText(itn, "plan: WorksProviderPlan.FREE", "PayFast cancellation must not remove already-paid WORKS access immediately.");

requireText(subscription, "cancelPayfastSubscription", "WORKS cancellation endpoint must cancel the PayFast subscription before changing renewal state.");
requireText(subscription, "worksPaidThroughEnd", "WORKS cancellation endpoint must calculate the current paid-through date.");
requireText(subscription, "plan_ends_at: accessEndsAt", "WORKS cancellation must schedule the paid-plan end instead of immediate downgrade.");
requireText(subscription, "accessEndsAt: accessEndsAt.toISOString()", "WORKS cancellation must return the paid-through date to the user.");
forbidText(subscription, "plan: WorksProviderPlan.FREE", "Provider cancellation must not erase already-paid access immediately.");

requireText(providerMe, "effectiveWorksProviderPlan", "Provider account surfaces must resolve an expired paid plan to Free.");
requireText(intelligence, "effectiveWorksProviderPlan", "Paid provider intelligence must stop when the paid-through period ends.");

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
