ALTER TABLE "works_search_sessions"
ADD COLUMN "clerk_user_id" TEXT;

CREATE INDEX "works_search_sessions_clerk_user_id_updated_at_idx"
ON "works_search_sessions"("clerk_user_id", "updated_at");