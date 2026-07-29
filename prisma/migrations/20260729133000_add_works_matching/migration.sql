-- Scope requirements to the production service they constrain.
ALTER TABLE "works_requirements" ADD COLUMN "applies_to_service_id" UUID;

CREATE INDEX "works_requirements_applies_to_service_id_idx" ON "works_requirements"("applies_to_service_id");

ALTER TABLE "works_requirements"
ADD CONSTRAINT "works_requirements_applies_to_service_id_fkey"
FOREIGN KEY ("applies_to_service_id") REFERENCES "works_services"("id")
ON DELETE SET NULL ON UPDATE CASCADE;

-- Match state is deliberately three-valued: absence of evidence remains UNKNOWN.
CREATE TYPE "WorksMatchStatus" AS ENUM ('MATCH', 'NO_MATCH', 'UNKNOWN');

CREATE TABLE "works_matches" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "brief_id" UUID NOT NULL,
    "offering_id" UUID NOT NULL,
    "status" "WorksMatchStatus" NOT NULL DEFAULT 'UNKNOWN',
    "fit_score" INTEGER,
    "covered_step_count" INTEGER NOT NULL DEFAULT 0,
    "matched_count" INTEGER NOT NULL DEFAULT 0,
    "unknown_count" INTEGER NOT NULL DEFAULT 0,
    "failed_count" INTEGER NOT NULL DEFAULT 0,
    "algorithm_version" TEXT NOT NULL DEFAULT 'v1',
    "is_current" BOOLEAN NOT NULL DEFAULT true,
    "calculated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "works_matches_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "works_match_outcomes" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "match_id" UUID NOT NULL,
    "requirement_id" UUID,
    "step_id" UUID,
    "source_claim_id" UUID,
    "criterion_type" TEXT NOT NULL,
    "criterion_key" TEXT NOT NULL,
    "status" "WorksMatchStatus" NOT NULL,
    "priority" "WorksRequirementPriority",
    "hard_constraint" BOOLEAN NOT NULL DEFAULT false,
    "score_delta" INTEGER NOT NULL DEFAULT 0,
    "expected_value" JSONB,
    "actual_value" JSONB,
    "explanation" TEXT NOT NULL,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "works_match_outcomes_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "works_matches_brief_id_is_current_status_idx" ON "works_matches"("brief_id", "is_current", "status");
CREATE INDEX "works_matches_brief_id_offering_id_is_current_idx" ON "works_matches"("brief_id", "offering_id", "is_current");
CREATE INDEX "works_matches_offering_id_idx" ON "works_matches"("offering_id");
CREATE INDEX "works_matches_fit_score_idx" ON "works_matches"("fit_score");
CREATE INDEX "works_match_outcomes_match_id_idx" ON "works_match_outcomes"("match_id");
CREATE INDEX "works_match_outcomes_requirement_id_idx" ON "works_match_outcomes"("requirement_id");
CREATE INDEX "works_match_outcomes_step_id_idx" ON "works_match_outcomes"("step_id");
CREATE INDEX "works_match_outcomes_source_claim_id_idx" ON "works_match_outcomes"("source_claim_id");
CREATE INDEX "works_match_outcomes_status_idx" ON "works_match_outcomes"("status");
CREATE INDEX "works_match_outcomes_criterion_type_criterion_key_idx" ON "works_match_outcomes"("criterion_type", "criterion_key");

ALTER TABLE "works_matches"
ADD CONSTRAINT "works_matches_brief_id_fkey"
FOREIGN KEY ("brief_id") REFERENCES "works_product_briefs"("id")
ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "works_matches"
ADD CONSTRAINT "works_matches_offering_id_fkey"
FOREIGN KEY ("offering_id") REFERENCES "works_offerings"("id")
ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "works_match_outcomes"
ADD CONSTRAINT "works_match_outcomes_match_id_fkey"
FOREIGN KEY ("match_id") REFERENCES "works_matches"("id")
ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "works_match_outcomes"
ADD CONSTRAINT "works_match_outcomes_requirement_id_fkey"
FOREIGN KEY ("requirement_id") REFERENCES "works_requirements"("id")
ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "works_match_outcomes"
ADD CONSTRAINT "works_match_outcomes_step_id_fkey"
FOREIGN KEY ("step_id") REFERENCES "works_production_steps"("id")
ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "works_match_outcomes"
ADD CONSTRAINT "works_match_outcomes_source_claim_id_fkey"
FOREIGN KEY ("source_claim_id") REFERENCES "works_claims"("id")
ON DELETE SET NULL ON UPDATE CASCADE;
