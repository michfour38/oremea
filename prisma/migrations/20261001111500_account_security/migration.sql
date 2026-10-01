CREATE TABLE "account_security" (
  "user_id" TEXT NOT NULL,
  "status" TEXT NOT NULL DEFAULT 'active',
  "suspended_at" TIMESTAMPTZ(6),
  "suspended_reason" TEXT,
  "suspended_source" TEXT,
  "suspended_by" TEXT,
  "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "account_security_pkey" PRIMARY KEY ("user_id")
);

CREATE TABLE "account_security_events" (
  "id" UUID NOT NULL DEFAULT gen_random_uuid(),
  "user_id" TEXT NOT NULL,
  "event_type" TEXT NOT NULL,
  "source" TEXT NOT NULL,
  "reason" TEXT,
  "actor_id" TEXT,
  "metadata" JSONB NOT NULL DEFAULT '{}',
  "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "account_security_events_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "account_security_status_idx" ON "account_security"("status");
CREATE INDEX "account_security_suspended_at_idx" ON "account_security"("suspended_at");
CREATE INDEX "account_security_events_user_id_created_at_idx" ON "account_security_events"("user_id", "created_at");
CREATE INDEX "account_security_events_event_type_created_at_idx" ON "account_security_events"("event_type", "created_at");

ALTER TABLE "account_security_events"
ADD CONSTRAINT "account_security_events_user_id_fkey"
FOREIGN KEY ("user_id") REFERENCES "account_security"("user_id") ON DELETE CASCADE ON UPDATE CASCADE;
