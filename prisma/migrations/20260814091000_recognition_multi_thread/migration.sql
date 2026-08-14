ALTER TABLE "recognition_threads"
ADD COLUMN "archived_at" TIMESTAMPTZ(6);

DROP INDEX IF EXISTS "recognition_threads_user_id_key";

CREATE INDEX "recognition_threads_user_id_idx"
ON "recognition_threads"("user_id");

CREATE INDEX "recognition_threads_user_id_status_idx"
ON "recognition_threads"("user_id", "status");

CREATE INDEX "recognition_threads_archived_at_idx"
ON "recognition_threads"("archived_at");

CREATE UNIQUE INDEX "recognition_threads_one_active_per_user"
ON "recognition_threads"("user_id")
WHERE "status" = 'active';
