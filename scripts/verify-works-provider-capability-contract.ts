import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

import { evaluateOfferingFit, type MatchBrief } from "../lib/works/matching/eligibility";

function read(path: string) {
  return readFileSync(path, "utf8");
}

const schema = read("prisma/works/offerings.prisma");
const migration = read("prisma/migrations/20260819153000_add_works_offering_evidence_status/migration.sql");
const providerSeed = read("prisma/seeds/works/providers/seed-provider.ts");
const api = read("app/api/works/provider/offerings/route.ts");
const workspace = read("components/works/provider/provider-capabilities.tsx");
const navigation = read("components/works/provider/provider-nav.tsx");
const matching = read("lib/works/matching/calculate-brief-matches.ts");

assert.match(schema, /enum WorksOfferingEvidenceStatus[\s\S]*SELF_REPORTED[\s\S]*SOURCE_REVIEWED[\s\S]*VERIFIED/);
assert.match(schema, /evidence_status\s+WorksOfferingEvidenceStatus\s+@default\(SELF_REPORTED\)/);
assert.match(migration, /UPDATE "works_offerings"[\s\S]*SOURCE_REVIEWED/);
assert.match(providerSeed, /evidence_status: WorksOfferingEvidenceStatus\.SOURCE_REVIEWED/);

assert.match(api, /const \{ userId \} = auth\(\)/, "Capability mutations must authenticate the Clerk account.");
assert.match(api, /assertOwnership\(userId, providerId, providerMarketId\)/, "Capability mutations must check provider membership.");
assert.match(api, /evidence_status: WorksOfferingEvidenceStatus\.SELF_REPORTED/g, "Provider-created or edited offerings must return to self-reported evidence.");
assert.match(api, /categories: \{ create:/);
assert.match(api, /services: \{ create:/);
assert.match(api, /capabilities: \{ create:/);
assert.match(api, /packaging_formats: \{ create:/);
assert.match(workspace, /Include this offering in customer matching/);
assert.match(workspace, /possible fit/);
assert.match(navigation, /\/works\/provider\/capabilities/);
assert.match(matching, /evidenceStatus: offering\.evidence_status/);

const brief: MatchBrief = {
  categoryKey: "FOOD",
  requirements: [],
  steps: [{ id: "manufacture", serviceKey: "MANUFACTURING", title: "Manufacturing", status: "NEEDED" }],
};

const baseOffering = {
  categoryKeys: ["FOOD"],
  serviceKeys: ["MANUFACTURING"],
  capabilityKeys: [],
  packagingFormatKeys: [],
  providerLocationAreas: [],
  claims: [],
};

const reviewed = evaluateOfferingFit(brief, { ...baseOffering, evidenceStatus: "SOURCE_REVIEWED" });
assert.equal(reviewed.status, "MATCH", "A source-reviewed offering can be a confirmed structural fit.");

const reported = evaluateOfferingFit(brief, { ...baseOffering, evidenceStatus: "SELF_REPORTED" });
assert.equal(reported.status, "UNKNOWN", "A self-reported offering must remain a possible fit.");
assert.ok(
  reported.outcomes.some((outcome) => outcome.criterionKey === "offering.self_reported" && outcome.hardConstraint),
  "The possible fit must retain an explicit hard evidence boundary.",
);

console.log("✓ WORKS provider capability and evidence-boundary contract");
