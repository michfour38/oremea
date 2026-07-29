ALTER TABLE "works_provider_reviews"
ALTER COLUMN "reviewer_name" DROP NOT NULL;

ALTER TABLE "works_provider_reviews"
ADD COLUMN "public_identity" BOOLEAN NOT NULL DEFAULT false;