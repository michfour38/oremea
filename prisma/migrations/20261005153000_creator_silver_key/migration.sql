CREATE TABLE "oremea_creator_silver_key_issuances" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "email_normalized" TEXT NOT NULL,
    "granted_by" TEXT NOT NULL,
    "granted_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "current_user_id" TEXT,
    "attached_at" TIMESTAMPTZ(6),
    "recognition_activated_at" TIMESTAMPTZ(6),
    "recognition_expires_at" TIMESTAMPTZ(6),
    "compass_activated_at" TIMESTAMPTZ(6),
    "compass_expires_at" TIMESTAMPTZ(6),
    "resonance_order_id" UUID,
    "revoked_at" TIMESTAMPTZ(6),
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "oremea_creator_silver_key_issuances_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "oremea_creator_silver_key_invites" (
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

    CONSTRAINT "oremea_creator_silver_key_invites_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "oremea_creator_silver_key_events" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "issuance_id" UUID NOT NULL,
    "event_type" TEXT NOT NULL,
    "actor_id" TEXT,
    "user_id" TEXT,
    "metadata" JSONB NOT NULL DEFAULT '{}',
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "oremea_creator_silver_key_events_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "oremea_creator_silver_key_issuances_email_normalized_key"
ON "oremea_creator_silver_key_issuances"("email_normalized");
CREATE UNIQUE INDEX "oremea_creator_silver_key_issuances_current_user_id_key"
ON "oremea_creator_silver_key_issuances"("current_user_id");
CREATE UNIQUE INDEX "oremea_creator_silver_key_issuances_resonance_order_id_key"
ON "oremea_creator_silver_key_issuances"("resonance_order_id");
CREATE INDEX "oremea_creator_silver_key_issuances_granted_at_idx"
ON "oremea_creator_silver_key_issuances"("granted_at");
CREATE INDEX "oremea_creator_silver_key_issuances_revoked_at_idx"
ON "oremea_creator_silver_key_issuances"("revoked_at");

CREATE UNIQUE INDEX "oremea_creator_silver_key_invites_token_hash_key"
ON "oremea_creator_silver_key_invites"("token_hash");
CREATE INDEX "oremea_creator_silver_key_invites_email_normalized_created_at_idx"
ON "oremea_creator_silver_key_invites"("email_normalized", "created_at");
CREATE INDEX "oremea_creator_silver_key_invites_expires_at_idx"
ON "oremea_creator_silver_key_invites"("expires_at");
CREATE INDEX "oremea_creator_silver_key_invites_claimed_at_idx"
ON "oremea_creator_silver_key_invites"("claimed_at");
CREATE INDEX "oremea_creator_silver_key_invites_issuance_id_idx"
ON "oremea_creator_silver_key_invites"("issuance_id");

CREATE INDEX "oremea_creator_silver_key_events_issuance_id_created_at_idx"
ON "oremea_creator_silver_key_events"("issuance_id", "created_at");
CREATE INDEX "oremea_creator_silver_key_events_event_type_created_at_idx"
ON "oremea_creator_silver_key_events"("event_type", "created_at");
CREATE INDEX "oremea_creator_silver_key_events_user_id_idx"
ON "oremea_creator_silver_key_events"("user_id");

ALTER TABLE "oremea_creator_silver_key_invites"
ADD CONSTRAINT "oremea_creator_silver_key_invites_issuance_id_fkey"
FOREIGN KEY ("issuance_id") REFERENCES "oremea_creator_silver_key_issuances"("id")
ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "oremea_creator_silver_key_events"
ADD CONSTRAINT "oremea_creator_silver_key_events_issuance_id_fkey"
FOREIGN KEY ("issuance_id") REFERENCES "oremea_creator_silver_key_issuances"("id")
ON DELETE RESTRICT ON UPDATE CASCADE;
