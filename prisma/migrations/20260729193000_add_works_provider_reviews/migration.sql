CREATE TYPE "WorksProviderReviewStatus" AS ENUM ('PENDING', 'PUBLISHED', 'HIDDEN');

CREATE TABLE "works_provider_reviews" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "provider_id" UUID NOT NULL,
    "reviewer_name" TEXT NOT NULL,
    "reviewer_company" TEXT,
    "rating" INTEGER NOT NULL,
    "body" TEXT NOT NULL,
    "verified_brief" BOOLEAN NOT NULL DEFAULT false,
    "status" "WorksProviderReviewStatus" NOT NULL DEFAULT 'PENDING',
    "provider_response" TEXT,
    "provider_replied_at" TIMESTAMPTZ(6),
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "works_provider_reviews_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "works_provider_reviews_provider_id_status_created_at_idx"
ON "works_provider_reviews"("provider_id", "status", "created_at");

CREATE INDEX "works_provider_reviews_provider_id_rating_idx"
ON "works_provider_reviews"("provider_id", "rating");

CREATE INDEX "works_provider_reviews_verified_brief_idx"
ON "works_provider_reviews"("verified_brief");

ALTER TABLE "works_provider_reviews"
ADD CONSTRAINT "works_provider_reviews_provider_id_fkey"
FOREIGN KEY ("provider_id") REFERENCES "works_providers"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "works_provider_reviews"
ADD CONSTRAINT "works_provider_reviews_rating_check"
CHECK ("rating" >= 1 AND "rating" <= 5);