CREATE TABLE "recognition_threads" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "user_id" TEXT NOT NULL,
    "primary_email" TEXT,
    "status" TEXT NOT NULL DEFAULT 'active',
    "memory_snapshot" JSONB NOT NULL DEFAULT '{}',
    "message_count" INTEGER NOT NULL DEFAULT 0,
    "last_message_at" TIMESTAMPTZ(6),
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "recognition_threads_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "recognition_messages" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "thread_id" UUID NOT NULL,
    "role" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "turn_index" INTEGER NOT NULL,
    "client_message_id" TEXT,
    "evidence_snapshot" JSONB NOT NULL DEFAULT '{}',
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "recognition_messages_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "recognition_threads_user_id_key" ON "recognition_threads"("user_id");
CREATE INDEX "recognition_threads_status_idx" ON "recognition_threads"("status");
CREATE INDEX "recognition_threads_last_message_at_idx" ON "recognition_threads"("last_message_at");
CREATE UNIQUE INDEX "recognition_messages_thread_id_turn_index_key" ON "recognition_messages"("thread_id", "turn_index");
CREATE UNIQUE INDEX "recognition_messages_thread_id_client_message_id_key" ON "recognition_messages"("thread_id", "client_message_id");
CREATE INDEX "recognition_messages_thread_id_created_at_idx" ON "recognition_messages"("thread_id", "created_at");
CREATE INDEX "recognition_messages_role_idx" ON "recognition_messages"("role");

ALTER TABLE "recognition_messages"
ADD CONSTRAINT "recognition_messages_thread_id_fkey"
FOREIGN KEY ("thread_id") REFERENCES "recognition_threads"("id") ON DELETE CASCADE ON UPDATE CASCADE;
