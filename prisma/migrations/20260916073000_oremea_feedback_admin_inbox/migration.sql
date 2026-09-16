CREATE TABLE "oremea_feedback_messages" (
  "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "user_id" TEXT,
  "category" TEXT NOT NULL,
  "product" TEXT NOT NULL DEFAULT 'Oremea generally',
  "message" TEXT,
  "name" TEXT,
  "email" TEXT,
  "reply_requested" BOOLEAN NOT NULL DEFAULT false,
  "source" TEXT,
  "before_clarity" INTEGER,
  "after_clarity" INTEGER,
  "fit_score" INTEGER,
  "recommend_score" INTEGER,
  "what_changed" TEXT,
  "most_useful" TEXT,
  "improvement" TEXT,
  "anything_else" TEXT,
  "status" TEXT NOT NULL DEFAULT 'new'
    CHECK ("status" IN ('new', 'in_progress', 'handled', 'archived')),
  "admin_note" TEXT,
  "handled_by" TEXT,
  "handled_at" TIMESTAMPTZ(6),
  "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CHECK ("before_clarity" IS NULL OR "before_clarity" BETWEEN 1 AND 5),
  CHECK ("after_clarity" IS NULL OR "after_clarity" BETWEEN 1 AND 5),
  CHECK ("fit_score" IS NULL OR "fit_score" BETWEEN 1 AND 5),
  CHECK ("recommend_score" IS NULL OR "recommend_score" BETWEEN 0 AND 10)
);

CREATE INDEX "oremea_feedback_messages_status_created_at_idx"
  ON "oremea_feedback_messages"("status", "created_at");

CREATE INDEX "oremea_feedback_messages_category_created_at_idx"
  ON "oremea_feedback_messages"("category", "created_at");

CREATE INDEX "oremea_feedback_messages_user_id_idx"
  ON "oremea_feedback_messages"("user_id");

CREATE INDEX "oremea_feedback_messages_email_idx"
  ON "oremea_feedback_messages"("email");
