ALTER TABLE "works_provider_reviews"
ADD COLUMN "brief_id" UUID,
ADD COLUMN "outreach_id" UUID,
ADD COLUMN "reviewer_clerk_id" TEXT;

CREATE UNIQUE INDEX "works_provider_reviews_outreach_id_key"
ON "works_provider_reviews"("outreach_id");

CREATE INDEX "works_provider_reviews_brief_id_idx"
ON "works_provider_reviews"("brief_id");

CREATE INDEX "works_provider_reviews_reviewer_clerk_id_created_at_idx"
ON "works_provider_reviews"("reviewer_clerk_id", "created_at");

ALTER TABLE "works_provider_reviews"
ADD CONSTRAINT "works_provider_reviews_brief_id_fkey"
FOREIGN KEY ("brief_id") REFERENCES "works_product_briefs"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "works_provider_reviews"
ADD CONSTRAINT "works_provider_reviews_outreach_id_fkey"
FOREIGN KEY ("outreach_id") REFERENCES "works_provider_outreach"("id") ON DELETE SET NULL ON UPDATE CASCADE;