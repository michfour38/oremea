CREATE TABLE "compass_daily_goals" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "scheduled_for" DATE NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'active',
    "completed_at" TIMESTAMPTZ(6),
    "completed_on" DATE,
    "archived_at" TIMESTAMPTZ(6),
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "compass_daily_goals_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "compass_daily_goals_user_id_scheduled_for_status_idx"
    ON "compass_daily_goals"("user_id", "scheduled_for", "status");

CREATE INDEX "compass_daily_goals_user_id_completed_on_idx"
    ON "compass_daily_goals"("user_id", "completed_on");

CREATE INDEX "compass_daily_goals_user_id_created_at_idx"
    ON "compass_daily_goals"("user_id", "created_at");
