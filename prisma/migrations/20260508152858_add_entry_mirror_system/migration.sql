-- CreateTable
CREATE TABLE "journey_day_continues" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "user_id" TEXT NOT NULL,
    "week_number" INTEGER NOT NULL,
    "day_number" INTEGER NOT NULL,
    "continued_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "journey_day_continues_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "entry_mirror_sessions" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "lead_id" UUID NOT NULL,
    "entry_type" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'active',
    "started_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "completed_at" TIMESTAMPTZ(6),
    "mirror_generated_at" TIMESTAMPTZ(6),
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "entry_mirror_sessions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "entry_mirror_responses" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "session_id" UUID NOT NULL,
    "question_key" TEXT NOT NULL,
    "question_text" TEXT NOT NULL,
    "response" TEXT NOT NULL,
    "response_order" INTEGER NOT NULL,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "entry_mirror_responses_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "entry_mirror_outputs" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "session_id" UUID NOT NULL,
    "output" TEXT NOT NULL,
    "questions" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "themes_detected" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "tensions_detected" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "input_snapshot" JSONB NOT NULL DEFAULT '{}',
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "entry_mirror_outputs_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "journey_day_continues_user_id_idx" ON "journey_day_continues"("user_id");

-- CreateIndex
CREATE INDEX "journey_day_continues_week_number_day_number_idx" ON "journey_day_continues"("week_number", "day_number");

-- CreateIndex
CREATE UNIQUE INDEX "journey_day_continues_user_id_week_number_day_number_key" ON "journey_day_continues"("user_id", "week_number", "day_number");

-- CreateIndex
CREATE INDEX "entry_mirror_sessions_lead_id_idx" ON "entry_mirror_sessions"("lead_id");

-- CreateIndex
CREATE INDEX "entry_mirror_sessions_entry_type_idx" ON "entry_mirror_sessions"("entry_type");

-- CreateIndex
CREATE INDEX "entry_mirror_sessions_status_idx" ON "entry_mirror_sessions"("status");

-- CreateIndex
CREATE INDEX "entry_mirror_responses_session_id_idx" ON "entry_mirror_responses"("session_id");

-- CreateIndex
CREATE INDEX "entry_mirror_responses_response_order_idx" ON "entry_mirror_responses"("response_order");

-- CreateIndex
CREATE UNIQUE INDEX "entry_mirror_responses_session_id_question_key_key" ON "entry_mirror_responses"("session_id", "question_key");

-- CreateIndex
CREATE INDEX "entry_mirror_outputs_session_id_idx" ON "entry_mirror_outputs"("session_id");

-- AddForeignKey
ALTER TABLE "entry_mirror_sessions" ADD CONSTRAINT "entry_mirror_sessions_lead_id_fkey" FOREIGN KEY ("lead_id") REFERENCES "entry_leads"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "entry_mirror_responses" ADD CONSTRAINT "entry_mirror_responses_session_id_fkey" FOREIGN KEY ("session_id") REFERENCES "entry_mirror_sessions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "entry_mirror_outputs" ADD CONSTRAINT "entry_mirror_outputs_session_id_fkey" FOREIGN KEY ("session_id") REFERENCES "entry_mirror_sessions"("id") ON DELETE CASCADE ON UPDATE CASCADE;
