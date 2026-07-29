CREATE TYPE "WorksProviderClaimStatus" AS ENUM ('PENDING', 'APPROVED', 'DECLINED', 'CANCELLED');

CREATE TABLE "works_provider_claims" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "provider_id" UUID NOT NULL,
    "clerk_user_id" TEXT NOT NULL,
    "business_email" TEXT NOT NULL,
    "requested_role" "WorksProviderMembershipRole" NOT NULL DEFAULT 'OWNER',
    "note" TEXT,
    "status" "WorksProviderClaimStatus" NOT NULL DEFAULT 'PENDING',
    "reviewed_at" TIMESTAMPTZ(6),
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "works_provider_claims_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "works_provider_claims_provider_id_clerk_user_id_key"
ON "works_provider_claims"("provider_id", "clerk_user_id");

CREATE INDEX "works_provider_claims_clerk_user_id_status_idx"
ON "works_provider_claims"("clerk_user_id", "status");

CREATE INDEX "works_provider_claims_provider_id_status_idx"
ON "works_provider_claims"("provider_id", "status");

CREATE INDEX "works_provider_claims_business_email_idx"
ON "works_provider_claims"("business_email");

ALTER TABLE "works_provider_claims"
ADD CONSTRAINT "works_provider_claims_provider_id_fkey"
FOREIGN KEY ("provider_id") REFERENCES "works_providers"("id") ON DELETE CASCADE ON UPDATE CASCADE;