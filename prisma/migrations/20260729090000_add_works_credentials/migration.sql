-- CreateEnum
CREATE TYPE "WorksCredentialType" AS ENUM (
  'QUALIFICATION',
  'PROFESSIONAL_REGISTRATION',
  'LICENCE',
  'ACCREDITATION',
  'CERTIFICATION',
  'PROFESSIONAL_MEMBERSHIP',
  'SHORT_COURSE',
  'EXPERIENCE_CLAIM'
);

-- CreateEnum
CREATE TYPE "WorksCredentialAuthorityType" AS ENUM (
  'QUALIFICATION_AUTHORITY',
  'PROFESSIONAL_REGULATOR',
  'LICENSING_AUTHORITY',
  'ACCREDITATION_BODY',
  'CERTIFICATION_BODY',
  'EDUCATION_PROVIDER',
  'PROFESSIONAL_ASSOCIATION',
  'INDUSTRY_ASSOCIATION',
  'OTHER'
);

-- CreateTable
CREATE TABLE "works_credential_authorities" (
  "id" UUID NOT NULL DEFAULT gen_random_uuid(),
  "key" TEXT NOT NULL,
  "name" TEXT NOT NULL,
  "short_name" TEXT,
  "authority_type" "WorksCredentialAuthorityType" NOT NULL,
  "website" TEXT,
  "verification_url" TEXT,
  "verification_method" "WorksVerificationMethod" NOT NULL DEFAULT 'NONE',
  "requires_holder_consent" BOOLEAN NOT NULL DEFAULT false,
  "active" BOOLEAN NOT NULL DEFAULT true,
  "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT "works_credential_authorities_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "works_credential_authority_markets" (
  "id" UUID NOT NULL DEFAULT gen_random_uuid(),
  "authority_id" UUID NOT NULL,
  "market_id" UUID NOT NULL,
  "active" BOOLEAN NOT NULL DEFAULT true,
  "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT "works_credential_authority_markets_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "works_credential_claims" (
  "id" UUID NOT NULL DEFAULT gen_random_uuid(),
  "claim_id" UUID NOT NULL,
  "credential_type" "WorksCredentialType" NOT NULL,
  "authority_id" UUID,
  "holder_name" TEXT,
  "credential_name" TEXT NOT NULL,
  "credential_number" TEXT,
  "designation" TEXT,
  "field" TEXT,
  "scope" TEXT,
  "issued_at" TIMESTAMPTZ(6),
  "expires_at" TIMESTAMPTZ(6),
  "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT "works_credential_claims_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "works_credential_authorities_key_key" ON "works_credential_authorities"("key");
CREATE INDEX "works_credential_authorities_authority_type_idx" ON "works_credential_authorities"("authority_type");
CREATE INDEX "works_credential_authorities_active_idx" ON "works_credential_authorities"("active");

CREATE UNIQUE INDEX "works_credential_authority_markets_authority_id_market_id_key" ON "works_credential_authority_markets"("authority_id", "market_id");
CREATE INDEX "works_credential_authority_markets_market_id_idx" ON "works_credential_authority_markets"("market_id");
CREATE INDEX "works_credential_authority_markets_authority_id_idx" ON "works_credential_authority_markets"("authority_id");

CREATE UNIQUE INDEX "works_credential_claims_claim_id_key" ON "works_credential_claims"("claim_id");
CREATE INDEX "works_credential_claims_credential_type_idx" ON "works_credential_claims"("credential_type");
CREATE INDEX "works_credential_claims_authority_id_idx" ON "works_credential_claims"("authority_id");
CREATE INDEX "works_credential_claims_credential_number_idx" ON "works_credential_claims"("credential_number");
CREATE INDEX "works_credential_claims_expires_at_idx" ON "works_credential_claims"("expires_at");

-- AddForeignKey
ALTER TABLE "works_credential_authority_markets"
  ADD CONSTRAINT "works_credential_authority_markets_authority_id_fkey"
  FOREIGN KEY ("authority_id") REFERENCES "works_credential_authorities"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "works_credential_authority_markets"
  ADD CONSTRAINT "works_credential_authority_markets_market_id_fkey"
  FOREIGN KEY ("market_id") REFERENCES "works_markets"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "works_credential_claims"
  ADD CONSTRAINT "works_credential_claims_claim_id_fkey"
  FOREIGN KEY ("claim_id") REFERENCES "works_claims"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "works_credential_claims"
  ADD CONSTRAINT "works_credential_claims_authority_id_fkey"
  FOREIGN KEY ("authority_id") REFERENCES "works_credential_authorities"("id") ON DELETE SET NULL ON UPDATE CASCADE;
