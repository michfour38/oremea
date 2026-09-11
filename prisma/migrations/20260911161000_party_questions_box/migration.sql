ALTER TABLE "oremea_party_registrations"
  ADD COLUMN "questions_token" UUID;

UPDATE "oremea_party_registrations"
SET "questions_token" = gen_random_uuid()
WHERE "questions_token" IS NULL;

ALTER TABLE "oremea_party_registrations"
  ALTER COLUMN "questions_token" SET NOT NULL;

CREATE UNIQUE INDEX "oremea_party_registrations_questions_token_key"
  ON "oremea_party_registrations"("questions_token");

CREATE TABLE "oremea_party_questions" (
  "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "registration_id" UUID NOT NULL REFERENCES "oremea_party_registrations"("id") ON DELETE CASCADE,
  "question" TEXT NOT NULL,
  "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX "oremea_party_questions_registration_id_idx"
  ON "oremea_party_questions"("registration_id");
CREATE INDEX "oremea_party_questions_created_at_idx"
  ON "oremea_party_questions"("created_at");
