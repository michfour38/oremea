import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

import { WorksProviderPlan } from "@prisma/client";
import {
  addOneCalendarMonthUtc,
  effectiveWorksProviderPlan,
  worksPaidThroughEnd,
} from "../lib/works/billing/period";

function read(path: string) {
  return readFileSync(path, "utf8");
}

const ADDRESS = "20 Price Road, Illiondale, Edenvale, Gauteng, 1609, South Africa";
const registry = read("src/lib/legal/legal-links.ts");
const legalShell = read("components/legal/legal-document.tsx");
const contact = read("components/site/sections/contact-business-details.tsx");
const terms = read("app/(legal)/terms/page.tsx");
const privacy = read("app/(legal)/privacy/page.tsx");
const refunds = read("app/(legal)/refunds/page.tsx");
const paia = read("app/(legal)/paia/page.tsx");
const conduct = read("app/(legal)/conduct/page.tsx");
const worksTerms = read("app/works/terms/page.tsx");
const verification = read("app/works/verification/page.tsx");
const reviews = read("app/works/reviews-policy/page.tsx");
const partner = read("app/works/partner-disclosure/page.tsx");
const plans = read("app/works/providers/plans/page.tsx");
const billing = read("components/works/provider/provider-billing.tsx");
const checkout = read("app/api/works/billing/payfast/checkout/route.ts");
const cancellation = read("app/api/works/billing/payfast/subscription/route.ts");
const itn = read("app/api/works/billing/payfast/itn/route.ts");
const providerMe = read("app/api/works/provider/me/route.ts");
const intelligence = read("app/api/works/provider/intelligence/route.ts");

assert.match(registry, new RegExp(ADDRESS.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")));
assert.match(registry, /serviceAddress/);
assert.match(legalShell, /Physical and legal-service address/);
assert.match(contact, /OREMEA_OPERATOR\.serviceAddress/);
assert.match(terms, /Physical business address/);
assert.match(terms, /Address for legal service/);
assert.match(paia, /Physical business and legal-service address/);
assert.match(plans, /Supplier & transaction information/);
assert.match(plans, /OREMEA_OPERATOR\.serviceAddress/);
assert.match(billing, /OREMEA_OPERATOR\.serviceAddress/);

assert.match(verification, /180 days/);
assert.match(verification, /Previously reviewed · needs reconfirmation/);
assert.match(verification, /SELF_REPORTED/);
assert.match(verification, /stale positive or stale negative claim becomes UNKNOWN/);
assert.match(verification, /source-confirmed or authority-verified/);
assert.match(verification, /does not buy verification/);

assert.match(worksTerms, /substantive response/);
assert.match(worksTerms, /declining because the work is outside its capability does not, by itself, create review eligibility/);
assert.match(reviews, /declining a brief because the work is outside its capability does not, by itself, create review eligibility/i);
assert.match(worksTerms, /Commercial plan, commission or sponsorship status does not change the suitability or evidence match score/);

assert.match(partner, /Consumer Protection Act intermediary/);
assert.match(partner, /three years/);
assert.match(partner, /conflict of interest/);
assert.match(partner, /basis[^.]*calculate/i);
assert.match(partner, /Sensitive identity particulars/);
assert.match(worksTerms, /at least three years/);

assert.match(privacy, /landing path/);
assert.match(privacy, /referring website or domain/);
assert.match(privacy, /source, medium, campaign, term and content/);
assert.match(privacy, /at least three years/);
assert.match(paia, /Categories of data subjects and information/);
assert.match(paia, /recipients and cross-border processing/i);
assert.match(paia, /Security safeguards/);
assert.match(paia, /physical copy is available/i);

assert.match(conduct, /unpaid formulation, engineering, design, samples, specifications, prototypes/);
assert.match(refunds, /paid plan remains available through the paid-through date/);
assert.match(refunds, /may affect that cooling-off right where the law permits/);
assert.match(billing, /request paid WORKS access to begin immediately after verified payment/);
assert.match(billing, /href="\/works\/terms"/);
assert.match(checkout, /works-payfast-recurring-v2-2026-08-24/);

assert.match(cancellation, /worksPaidThroughEnd/);
assert.match(cancellation, /plan_ends_at: accessEndsAt/);
assert.doesNotMatch(cancellation, /plan:\s*WorksProviderPlan\.FREE/);
assert.match(itn, /worksPaidThroughEnd/);
assert.match(itn, /plan_ends_at: accessEndsAt/);
assert.doesNotMatch(itn, /plan:\s*WorksProviderPlan\.FREE/);
assert.match(providerMe, /effectiveWorksProviderPlan/);
assert.match(intelligence, /effectiveWorksProviderPlan/);

const january31 = new Date("2026-01-31T10:15:00.000Z");
assert.equal(addOneCalendarMonthUtc(january31).toISOString(), "2026-02-28T10:15:00.000Z");

const paidThrough = worksPaidThroughEnd({
  lastPaymentAt: new Date("2026-08-10T08:00:00.000Z"),
  startedAt: new Date("2026-08-10T08:00:00.000Z"),
  now: new Date("2026-08-24T08:00:00.000Z"),
});
assert.equal(paidThrough.toISOString(), "2026-09-10T08:00:00.000Z");

assert.equal(
  effectiveWorksProviderPlan(
    { plan: WorksProviderPlan.GROWTH, plan_ends_at: new Date("2026-09-10T08:00:00.000Z") },
    new Date("2026-08-24T08:00:00.000Z"),
  ),
  WorksProviderPlan.GROWTH,
);
assert.equal(
  effectiveWorksProviderPlan(
    { plan: WorksProviderPlan.GROWTH, plan_ends_at: new Date("2026-08-20T08:00:00.000Z") },
    new Date("2026-08-24T08:00:00.000Z"),
  ),
  WorksProviderPlan.FREE,
);

console.log("✓ WORKS legal/compliance and paid-through cancellation contract");
