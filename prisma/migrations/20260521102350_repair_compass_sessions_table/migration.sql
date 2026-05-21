-- CreateTable
CREATE TABLE "compass_sessions" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'active',
    "phase" TEXT,
    "selected_area" TEXT,
    "area_responses" JSONB,
    "recursive_layers" JSONB,
    "resistance_map" JSONB,
    "discussion_messages" JSONB,
    "proposed_step" TEXT,
    "final_step" TEXT,
    "detected_patterns" JSONB,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "compass_sessions_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "compass_sessions_user_id_idx" ON "compass_sessions"("user_id");

-- CreateIndex
CREATE INDEX "compass_sessions_status_idx" ON "compass_sessions"("status");
