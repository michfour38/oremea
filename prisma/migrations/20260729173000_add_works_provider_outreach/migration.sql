-- CreateEnum
CREATE TYPE "WorksProviderOutreachStatus" AS ENUM (
  'DRAFT',
  'SENT',
  'RESPONDED',
  'DECLINED',
  'FAILED'
);

CREATE TYPE "WorksProviderResponseDecision" AS ENUM (
  'YES',
  'POSSIBLE',
  'OUTSIDE_CAPABILITY'
);

-- CreateTable
CREATE TABLE "works_provider_outreach" (
  "id" UUID NOT NULL DEFAULT gen_random_uuid(),
  "procurement_request_id" UUID NOT NULL,
  "brief_id" UUID NOT NULL,
  "provider_id" UUID NOT NULL,
  "route_option_id" UUID,
  "response_token_hash" TEXT NOT NULL,
  "status" "WorksProviderOutreachStatus" NOT NULL DEFAULT 'DRAFT',
  "relevant_steps" TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
  "brief_snapshot" JSONB NOT NULL,
  "sent_to_email" TEXT,
  "sent_at" TIMESTAMPTZ(6),
  "responded_at" TIMESTAMPTZ(6),
  "decision" "WorksProviderResponseDecision",
  "moq_value" DECIMAL(14,3),
  "moq_unit" TEXT,
  "lead_time_text" TEXT,
  "capacity_date" DATE,
  "pricing_notes" TEXT,
  "certification_notes" TEXT,
  "provider_notes" TEXT,
  "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "works_provider_outreach_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "works_provider_outreach_response_token_hash_key"
ON "works_provider_outreach"("response_token_hash");

CREATE UNIQUE INDEX "works_provider_outreach_procurement_request_id_provider_id_key"
ON "works_provider_outreach"("procurement_request_id", "provider_id");

CREATE INDEX "works_provider_outreach_brief_id_status_idx"
ON "works_provider_outreach"("brief_id", "status");

CREATE INDEX "works_provider_outreach_provider_id_status_idx"
ON "works_provider_outreach"("provider_id", "status");

CREATE INDEX "works_provider_outreach_created_at_idx"
ON "works_provider_outreach"("created_at");

ALTER TABLE "works_provider_outreach"
ADD CONSTRAINT "works_provider_outreach_procurement_request_id_fkey"
FOREIGN KEY ("procurement_request_id") REFERENCES "works_procurement_requests"("id")
ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "works_provider_outreach"
ADD CONSTRAINT "works_provider_outreach_brief_id_fkey"
FOREIGN KEY ("brief_id") REFERENCES "works_product_briefs"("id")
ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "works_provider_outreach"
ADD CONSTRAINT "works_provider_outreach_provider_id_fkey"
FOREIGN KEY ("provider_id") REFERENCES "works_providers"("id")
ON DELETE CASCADE ON UPDATE CASCADE;
