-- CreateEnum
CREATE TYPE "WorksProviderSourceType" AS ENUM (
  'PROVIDER_WEBSITE',
  'PUBLIC_REGISTRY',
  'PROFESSIONAL_REGISTER',
  'ACCREDITATION_BODY',
  'CERTIFICATION_BODY',
  'EDUCATION_PROVIDER',
  'ASSOCIATION',
  'PROVIDER_CONFIRMATION',
  'DOCUMENT',
  'PROJECT_EVIDENCE',
  'WORKS_RESEARCH',
  'OTHER'
);

-- CreateEnum
CREATE TYPE "WorksClaimStatus" AS ENUM (
  'UNKNOWN',
  'SELF_REPORTED',
  'EVIDENCE_SUPPLIED',
  'SOURCE_CONFIRMED',
  'AUTHORITY_VERIFIED',
  'STALE',
  'CONFLICTING',
  'EXPIRED'
);

-- CreateEnum
CREATE TYPE "WorksVerificationMethod" AS ENUM (
  'NONE',
  'SOURCE_REVIEW',
  'PUBLIC_REGISTER',
  'AUTHORITY_CONFIRMED',
  'QUALIFICATION_AUTHORITY',
  'DOCUMENT_REVIEW',
  'PROVIDER_CONFIRMED',
  'PROJECT_EVIDENCE'
);

-- CreateEnum
CREATE TYPE "WorksEvidenceType" AS ENUM (
  'SOURCE_SNAPSHOT',
  'DOCUMENT',
  'REGISTER_MATCH',
  'PROVIDER_CONFIRMATION',
  'AUTHORITY_CONFIRMATION',
  'PROJECT_RECORD',
  'OTHER'
);

-- CreateTable
CREATE TABLE "works_provider_sources" (
  "id" UUID NOT NULL DEFAULT gen_random_uuid(),
  "provider_id" UUID NOT NULL,
  "source_type" "WorksProviderSourceType" NOT NULL,
  "name" TEXT NOT NULL,
  "url" TEXT,
  "external_reference" TEXT,
  "discovered_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "checked_at" TIMESTAMPTZ(6),
  "active" BOOLEAN NOT NULL DEFAULT true,
  "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT "works_provider_sources_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "works_claims" (
  "id" UUID NOT NULL DEFAULT gen_random_uuid(),
  "provider_id" UUID NOT NULL,
  "claim_type" TEXT NOT NULL,
  "field" TEXT NOT NULL,
  "value" JSONB NOT NULL,
  "display_value" TEXT,
  "unit" TEXT,
  "scope" TEXT,
  "status" "WorksClaimStatus" NOT NULL DEFAULT 'UNKNOWN',
  "verification_method" "WorksVerificationMethod" NOT NULL DEFAULT 'NONE',
  "verified_at" TIMESTAMPTZ(6),
  "valid_from" TIMESTAMPTZ(6),
  "expires_at" TIMESTAMPTZ(6),
  "stale_after" TIMESTAMPTZ(6),
  "supersedes_claim_id" UUID,
  "is_current" BOOLEAN NOT NULL DEFAULT true,
  "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT "works_claims_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "works_evidence" (
  "id" UUID NOT NULL DEFAULT gen_random_uuid(),
  "claim_id" UUID NOT NULL,
  "source_id" UUID,
  "evidence_type" "WorksEvidenceType" NOT NULL,
  "summary" TEXT,
  "url" TEXT,
  "storage_reference" TEXT,
  "snapshot" JSONB,
  "captured_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "checked_at" TIMESTAMPTZ(6),
  "valid_from" TIMESTAMPTZ(6),
  "expires_at" TIMESTAMPTZ(6),
  "confidence" DECIMAL(5,4),
  "verified_by" TEXT,
  "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT "works_evidence_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "works_provider_sources_provider_id_idx" ON "works_provider_sources"("provider_id");
CREATE INDEX "works_provider_sources_provider_id_source_type_idx" ON "works_provider_sources"("provider_id", "source_type");
CREATE INDEX "works_provider_sources_active_idx" ON "works_provider_sources"("active");

CREATE UNIQUE INDEX "works_claims_supersedes_claim_id_key" ON "works_claims"("supersedes_claim_id");
CREATE INDEX "works_claims_provider_id_idx" ON "works_claims"("provider_id");
CREATE INDEX "works_claims_provider_id_field_is_current_idx" ON "works_claims"("provider_id", "field", "is_current");
CREATE INDEX "works_claims_provider_id_claim_type_idx" ON "works_claims"("provider_id", "claim_type");
CREATE INDEX "works_claims_status_idx" ON "works_claims"("status");
CREATE INDEX "works_claims_expires_at_idx" ON "works_claims"("expires_at");
CREATE INDEX "works_claims_stale_after_idx" ON "works_claims"("stale_after");

CREATE INDEX "works_evidence_claim_id_idx" ON "works_evidence"("claim_id");
CREATE INDEX "works_evidence_source_id_idx" ON "works_evidence"("source_id");
CREATE INDEX "works_evidence_evidence_type_idx" ON "works_evidence"("evidence_type");
CREATE INDEX "works_evidence_expires_at_idx" ON "works_evidence"("expires_at");

-- AddForeignKey
ALTER TABLE "works_provider_sources"
  ADD CONSTRAINT "works_provider_sources_provider_id_fkey"
  FOREIGN KEY ("provider_id") REFERENCES "works_providers"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "works_claims"
  ADD CONSTRAINT "works_claims_provider_id_fkey"
  FOREIGN KEY ("provider_id") REFERENCES "works_providers"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "works_claims"
  ADD CONSTRAINT "works_claims_supersedes_claim_id_fkey"
  FOREIGN KEY ("supersedes_claim_id") REFERENCES "works_claims"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "works_evidence"
  ADD CONSTRAINT "works_evidence_claim_id_fkey"
  FOREIGN KEY ("claim_id") REFERENCES "works_claims"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "works_evidence"
  ADD CONSTRAINT "works_evidence_source_id_fkey"
  FOREIGN KEY ("source_id") REFERENCES "works_provider_sources"("id") ON DELETE SET NULL ON UPDATE CASCADE;
