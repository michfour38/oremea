import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

import {
  evaluateOfferingFit,
  type MatchBrief,
} from "../lib/works/matching/eligibility";

const eligibility = readFileSync("lib/works/matching/eligibility.ts", "utf8");

assert.match(eligibility, /REGULATED_CLAIM_STATUSES/);
assert.match(eligibility, /"SOURCE_CONFIRMED"/);
assert.match(eligibility, /"AUTHORITY_VERIFIED"/);
assert.match(eligibility, /Evidence has been supplied for this regulated requirement, but WORKS still needs source or authority confirmation/);
assert.match(eligibility, /!NON_CURRENT_CLAIM_STATUSES\.has\(claim\.status\)/);

const brief: MatchBrief = {
  categoryKey: "FOOD",
  requirements: [
    {
      id: "halaal",
      requirementType: "CREDENTIAL",
      field: "credential.HALAAL.required",
      value: true,
      priority: "REQUIRED",
    },
  ],
  steps: [
    {
      id: "manufacturing",
      serviceKey: "MANUFACTURING",
      title: "Manufacturing",
      status: "NEEDED",
    },
  ],
};

const baseOffering = {
  evidenceStatus: "SOURCE_REVIEWED" as const,
  categoryKeys: ["FOOD"],
  serviceKeys: ["MANUFACTURING"],
  capabilityKeys: [],
  packagingFormatKeys: [],
  providerLocationAreas: [],
};

const evidenceOnly = evaluateOfferingFit(brief, {
  ...baseOffering,
  claims: [
    {
      id: "claim-evidence-only",
      field: "credential.HALAAL.required",
      value: true,
      status: "EVIDENCE_SUPPLIED" as const,
    },
  ],
});
assert.equal(
  evidenceOnly.status,
  "UNKNOWN",
  "Uploaded evidence alone must not confirm a regulated credential.",
);
assert.ok(
  evidenceOnly.outcomes.some(
    (outcome) =>
      outcome.criterionKey === "credential.HALAAL.required" &&
      outcome.status === "UNKNOWN" &&
      outcome.hardConstraint,
  ),
  "Evidence-only regulated claims must retain a hard UNKNOWN boundary.",
);

const sourceConfirmed = evaluateOfferingFit(brief, {
  ...baseOffering,
  claims: [
    {
      id: "claim-source-confirmed",
      field: "credential.HALAAL.required",
      value: true,
      status: "SOURCE_CONFIRMED" as const,
    },
  ],
});
assert.equal(
  sourceConfirmed.status,
  "MATCH",
  "Source-confirmed regulated evidence may satisfy a required credential.",
);

const authorityVerified = evaluateOfferingFit(brief, {
  ...baseOffering,
  claims: [
    {
      id: "claim-authority-verified",
      field: "credential.HALAAL.required",
      value: true,
      status: "AUTHORITY_VERIFIED" as const,
    },
  ],
});
assert.equal(
  authorityVerified.status,
  "MATCH",
  "Authority-verified regulated evidence may satisfy a required credential.",
);

const staleNegative = evaluateOfferingFit(brief, {
  ...baseOffering,
  claims: [
    {
      id: "claim-stale-negative",
      field: "credential.HALAAL.required",
      value: false,
      status: "STALE" as const,
    },
  ],
});
assert.equal(
  staleNegative.status,
  "UNKNOWN",
  "A stale negative credential claim must not create a current hard mismatch.",
);

const currentNegative = evaluateOfferingFit(brief, {
  ...baseOffering,
  claims: [
    {
      id: "claim-current-negative",
      field: "credential.HALAAL.required",
      value: false,
      status: "SELF_REPORTED" as const,
    },
  ],
});
assert.equal(
  currentNegative.status,
  "NO_MATCH",
  "A provider's current explicit no may safely rule the provider out of a required credential.",
);

console.log("✓ WORKS regulated-claims evidence contract");
