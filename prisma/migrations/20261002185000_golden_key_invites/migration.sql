CREATE TABLE "oremea_eternal_key_issuances" (
  "id" UUID NOT NULL DEFAULT gen_random_uuid(),
  "email_normalized" TEXT NOT NULL,
  "granted_by" TEXT,
  "granted_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "current_user_id" TEXT,
  "attached_at" TIMESTAMPTZ(6),
  "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "oremea_eternal_key_issuances_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "oremea_eternal_key_invites" (
  "id" UUID NOT NULL DEFAULT gen_random_uuid(),
  "email_normalized" TEXT NOT NULL,
  "token_hash" TEXT NOT NULL,
  "created_by" TEXT NOT NULL,
  "expires_at" TIMESTAMPTZ(6) NOT NULL,
  "claimed_at" TIMESTAMPTZ(6),
  "claimed_by_user_id" TEXT,
  "revoked_at" TIMESTAMPTZ(6),
  "issuance_id" UUID,
  "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "oremea_eternal_key_invites_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "oremea_eternal_key_issuances_email_normalized_key"
ON "oremea_eternal_key_issuances"("email_normalized");
CREATE INDEX "oremea_eternal_key_issuances_current_user_id_idx"
ON "oremea_eternal_key_issuances"("current_user_id");
CREATE INDEX "oremea_eternal_key_issuances_granted_at_idx"
ON "oremea_eternal_key_issuances"("granted_at");

CREATE UNIQUE INDEX "oremea_eternal_key_invites_token_hash_key"
ON "oremea_eternal_key_invites"("token_hash");
CREATE INDEX "oremea_eternal_key_invites_email_normalized_created_at_idx"
ON "oremea_eternal_key_invites"("email_normalized", "created_at");
CREATE INDEX "oremea_eternal_key_invites_expires_at_idx"
ON "oremea_eternal_key_invites"("expires_at");
CREATE INDEX "oremea_eternal_key_invites_claimed_at_idx"
ON "oremea_eternal_key_invites"("claimed_at");
CREATE INDEX "oremea_eternal_key_invites_issuance_id_idx"
ON "oremea_eternal_key_invites"("issuance_id");

ALTER TABLE "oremea_eternal_key_invites"
ADD CONSTRAINT "oremea_eternal_key_invites_issuance_id_fkey"
FOREIGN KEY ("issuance_id") REFERENCES "oremea_eternal_key_issuances"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
