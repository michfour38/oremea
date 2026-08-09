ALTER TABLE "compass_sessions"
ADD COLUMN "resolution_text" TEXT,
ADD COLUMN "resolution_confirmed_at" TIMESTAMP(3),
ADD COLUMN "final_step_confirmed_at" TIMESTAMP(3);
