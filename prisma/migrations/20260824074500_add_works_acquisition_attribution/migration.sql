-- DAWN acquisition attribution for WORKS anonymous search and lead conversion.
ALTER TABLE "works_search_sessions"
  ADD COLUMN "landing_path" VARCHAR(1024),
  ADD COLUMN "referrer_host" VARCHAR(255),
  ADD COLUMN "utm_source" VARCHAR(255),
  ADD COLUMN "utm_medium" VARCHAR(255),
  ADD COLUMN "utm_campaign" VARCHAR(255),
  ADD COLUMN "utm_term" VARCHAR(255),
  ADD COLUMN "utm_content" VARCHAR(255);

ALTER TABLE "works_procurement_requests"
  ADD COLUMN "capture_point" VARCHAR(80);

CREATE INDEX "works_search_sessions_utm_source_created_at_idx"
  ON "works_search_sessions"("utm_source", "created_at");
CREATE INDEX "works_search_sessions_utm_campaign_created_at_idx"
  ON "works_search_sessions"("utm_campaign", "created_at");
CREATE INDEX "works_procurement_requests_capture_point_created_at_idx"
  ON "works_procurement_requests"("capture_point", "created_at");
