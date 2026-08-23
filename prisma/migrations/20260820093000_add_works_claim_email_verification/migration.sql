ALTER TABLE "works_provider_claims"
ADD COLUMN "verification_token_hash" TEXT,
ADD COLUMN "verification_expires_at" TIMESTAMPTZ(6),
ADD COLUMN "business_email_verified_at" TIMESTAMPTZ(6);

CREATE UNIQUE INDEX "works_provider_claims_verification_token_hash_key"
ON "works_provider_claims"("verification_token_hash");

CREATE INDEX "works_provider_claims_verification_expires_at_idx"
ON "works_provider_claims"("verification_expires_at");
