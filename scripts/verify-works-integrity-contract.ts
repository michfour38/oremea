import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

import {
  evaluateOfferingFit,
  type MatchBrief,
} from "../lib/works/matching/eligibility";

function read(path: string) {
  return readFileSync(path, "utf8");
}

const doctrine = read("docs/works-integrity-doctrine.md");
const eligibility = read("lib/works/matching/eligibility.ts");
const matching = read("lib/works/matching/calculate-brief-matches.ts");
const ranking = read("lib/works/matching/ranking.ts");
const routePlanner = read("lib/works/routes/plan-brief-routes.ts");
const routeSummary = read("lib/works/routes/get-route-summary.ts");
const outreach = read("app/api/works/provider-outreach/route.ts");
const response = read("app/api/works/provider-outreach/respond/[token]/route.ts");
const reviews = read("app/api/works/reviews/route.ts");
const reviewsPolicy = read("app/works/reviews-policy/page.tsx");
const offeringApi = read("app/api/works/provider/offerings/route.ts");
const claimApi = read("app/api/works/provider-claims/route.ts");
const freshness = read("lib/works/evidence/freshness.ts");
const publicProfile = read("app/works/providers/[slug]/page.tsx");
const categoryLanding = read("app/works/manufacturers/[category]/page.tsx");
const plans = read("app/works/providers/plans/page.tsx");
const procurement = read("app/api/works/procurement-requests/route.ts");

// Doctrine exists in-repo so implementation and future product decisions share one boundary.
assert.match(doctrine, /Unknown remains unknown until evidence supports a stronger claim/);
assert.match(doctrine, /Paid plans buy workflow and demand tools, never suitability or ranking/);
assert.match(doctrine, /WORKS is not a lead-spray system/);

// Unknown, stale, conflicting and expired evidence may never silently become MATCH.
assert.match(eligibility, /"STALE"/);
assert.match(eligibility, /"CONFLICTING"/);
assert.match(eligibility, /"EXPIRED"/);
assert.match(eligibility, /WORKS_EVIDENCE_FRESHNESS_DAYS = 180/);
assert.match(eligibility, /criterionKey: "offering\.stale"/);
assert.match(eligibility, /The provider supplied this offering information/);
assert.match(eligibility, /status: "UNKNOWN"/);
assert.match(freshness, /WORKS_EVIDENCE_FRESHNESS_DAYS = 180/);
assert.match(freshness, /Previously reviewed · needs reconfirmation/);

const structuralBrief: MatchBrief = {
  categoryKey: "FOOD",
  requirements: [],
  steps: [
    {
      id: "manufacturing",
      serviceKey: "MANUFACTURING",
      title: "Manufacturing",
      status: "NEEDED",
    },
  ],
};
const structuralOffering = {
  categoryKeys: ["FOOD"],
  serviceKeys: ["MANUFACTURING"],
  capabilityKeys: [],
  packagingFormatKeys: [],
  providerLocationAreas: [],
  claims: [],
};
const staleReviewed = evaluateOfferingFit(structuralBrief, {
  ...structuralOffering,
  evidenceStatus: "SOURCE_REVIEWED" as const,
  evidenceAgeDays: 181,
});
assert.equal(
  staleReviewed.status,
  "UNKNOWN",
  "A reviewed offering older than the freshness boundary must become provisional.",
);
assert.ok(
  staleReviewed.outcomes.some(
    (outcome) =>
      outcome.criterionKey === "offering.stale" &&
      outcome.status === "UNKNOWN" &&
      outcome.hardConstraint,
  ),
  "A stale offering must carry an explicit hard evidence boundary.",
);

const regulatedBrief: MatchBrief = {
  ...structuralBrief,
  requirements: [
    {
      id: "halaal",
      requirementType: "CREDENTIAL",
      field: "credential.HALAAL.required",
      value: true,
      priority: "REQUIRED",
    },
  ],
};
const selfReportedCredential = evaluateOfferingFit(regulatedBrief, {
  ...structuralOffering,
  evidenceStatus: "SOURCE_REVIEWED" as const,
  claims: [
    {
      id: "claim-self",
      field: "credential.HALAAL.required",
      value: true,
      status: "SELF_REPORTED" as const,
    },
  ],
});
assert.equal(
  selfReportedCredential.status,
  "UNKNOWN",
  "A provider's self-reported regulated credential cannot produce a confirmed match.",
);

const explicitConflict = evaluateOfferingFit(regulatedBrief, {
  ...structuralOffering,
  evidenceStatus: "SOURCE_REVIEWED" as const,
  claims: [
    {
      id: "claim-no",
      field: "credential.HALAAL.required",
      value: false,
      status: "SOURCE_CONFIRMED" as const,
    },
  ],
});
assert.equal(
  explicitConflict.status,
  "NO_MATCH",
  "A current explicit conflict with a required fact must fail closed.",
);

// Credential expiry is re-evaluated at match time rather than trusting a stale DB badge.
assert.match(matching, /credential_detail:\s*\{[\s\S]*expires_at: true/);
assert.match(matching, /credentialExpired/);
assert.match(matching, /\? "EXPIRED"/);
assert.match(matching, /evidenceAgeDays/);
assert.match(matching, /ALGORITHM_VERSION = "v2-integrity"/);

// Commercial plans must never enter suitability/ranking calculations.
for (const source of [eligibility, matching, ranking, routePlanner]) {
  assert.doesNotMatch(source, /commercial_profile|priceMonthly|WorksProviderPlan|plan:\s*true|plan_key/i);
}

// Hard NO_MATCH providers never become route candidates. Fit and unresolved facts outrank convenience.
assert.match(routePlanner, /status: \{ in: \[WorksMatchStatus\.MATCH, WorksMatchStatus\.UNKNOWN\] \}/);
assert.doesNotMatch(routePlanner, /status: \{ in: \[[^\]]*NO_MATCH/);
assert.match(routePlanner, /criterion_type === "LOCATION"/);
assert.match(routePlanner, /ALGORITHM_VERSION = "v2-integrity"/);
assert.match(routePlanner, /unresolvedRequirementCount[\s\S]*routeScore[\s\S]*handoffCount/);
assert.match(routePlanner, /Handoffs\/provider count are final tie-breakers only/);
assert.match(routeSummary, /const gaps = route\.assignments[\s\S]*!assignment\.offering/);
assert.match(routeSummary, /unresolved: \[\.\.\.unresolved\.values\(\)\]/);
assert.match(routeSummary, /gaps,/);

// Outreach must be qualified and bounded, never arbitrary broadcast lead-selling.
assert.match(outreach, /MAX_DISTINCT_PROVIDER_CONTACTS_PER_BRIEF = 5/);
assert.match(outreach, /allowedRouteProviderIds/);
assert.match(outreach, /outsideRoute/);
assert.match(outreach, /alreadyContacted\.size \+ newDistinctContacts\.length/);
assert.match(outreach, /identified your business as a possible fit/);
assert.match(outreach, /not a statement that WORKS has verified your current capacity/);
assert.doesNotMatch(outreach, /WORKS matched your business to part of a production route/);
assert.match(outreach, /This provider has already been contacted for this brief/);
assert.match(outreach, /not a request for unpaid formulation, design, samples, engineering or other detailed technical development/);

// Contact disclosure follows the buyer's explicit preference; a phone number is not leaked just because it exists.
assert.match(outreach, /preferred_contact_method: true/);
assert.match(outreach, /preferred_contact_method !== "EMAIL"/);
assert.match(outreach, /requesterPhone: requesterPhoneForProvider/);
assert.doesNotMatch(outreach, /requesterPhone: procurement\.phone/);

// WORKS must hand the commercial relationship to buyer/provider rather than trap it.
assert.match(outreach, /replyTo: procurement\.email/);
assert.match(response, /replyTo: outreach\.provider\.email/);
assert.match(response, /Reply to this email to continue directly with/);
assert.match(response, /Any unanswered questions remain open for confirmation/);

// Reviews require substantive interaction; declining unsuitable work alone cannot trigger retaliation.
assert.match(reviews, /REVIEWABLE_OUTREACH[\s\S]*WorksProviderOutreachStatus\.RESPONDED/);
assert.doesNotMatch(reviews, /REVIEWABLE_OUTREACH[\s\S]{0,180}WorksProviderOutreachStatus\.DECLINED/);
assert.match(reviews, /Declining work alone is not reviewable/);
assert.match(reviewsPolicy, /declining a brief because the work is outside its capability does not, by itself, create review eligibility/i);
assert.match(reviews, /WorksProviderReviewStatus\.PENDING/);

// Providers can never retain a stronger evidence badge after changing their own offering.
const selfReportedWrites = offeringApi.match(/evidence_status: WorksOfferingEvidenceStatus\.SELF_REPORTED/g) ?? [];
assert.ok(selfReportedWrites.length >= 2, "Both provider offering creation and edit must set SELF_REPORTED evidence.");
assert.match(offeringApi, /Because the provider changed it, WORKS will review the new information before treating it as confirmed/);

// Public discovery must downgrade stale evidence and not emit stale reviewed offers as structured claims.
assert.match(publicProfile, /updated_at: true/);
assert.match(publicProfile, /isWorksEvidenceFresh\(offering\.updated_at, now\)/);
assert.match(publicProfile, /worksEvidencePublicLabel/);
assert.match(categoryLanding, /updated_at: true/);
assert.match(categoryLanding, /worksEvidencePublicLabel/);

// Provider ownership/claim protection remains fail-closed.
assert.match(claimApi, /PUBLIC_EMAIL_DOMAINS/);
assert.match(claimApi, /sameOrganizationDomain/);
assert.match(claimApi, /This business is already managed on WORKS/);
assert.match(claimApi, /verification_token_hash/);
assert.match(claimApi, /expires in one hour/i);

// Paid plans explicitly cannot buy ranking, credentials, reviews or guaranteed demand.
assert.match(plans, /What they never buy/);
assert.match(plans, /Ranking, credentials, verification status, favourable reviews or a guaranteed number of enquiries/);

// Dead ends convert to a retained sourcing request and notification rather than disappearing.
assert.match(procurement, /status: "SOURCING_REQUESTED"/);
assert.match(procurement, /notifyOremeaOfSourcingLead/);
assert.match(procurement, /WORKS will continue looking for suitable providers/);

console.log("✓ WORKS marketplace integrity guardrails contract");
