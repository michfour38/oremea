CREATE TABLE "oremea_party_registrations" (
  "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "event_key" TEXT NOT NULL,
  "email" TEXT NOT NULL,
  "first_name" TEXT,
  "question" TEXT NOT NULL,
  "referral_code" UUID NOT NULL,
  "invited_by" UUID,
  "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE UNIQUE INDEX "oremea_party_registrations_referral_code_key"
  ON "oremea_party_registrations"("referral_code");
CREATE UNIQUE INDEX "oremea_party_registrations_event_key_email_key"
  ON "oremea_party_registrations"("event_key", "email");
CREATE INDEX "oremea_party_registrations_event_key_idx"
  ON "oremea_party_registrations"("event_key");
CREATE INDEX "oremea_party_registrations_invited_by_idx"
  ON "oremea_party_registrations"("invited_by");
