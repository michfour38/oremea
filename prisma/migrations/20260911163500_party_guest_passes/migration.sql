CREATE TABLE "oremea_party_guest_passes" (
  "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "event_key" TEXT NOT NULL,
  "owner_registration_id" UUID NOT NULL REFERENCES "oremea_party_registrations"("id") ON DELETE CASCADE,
  "slot" INTEGER NOT NULL,
  "token" UUID NOT NULL UNIQUE,
  "claimed_by_registration_id" UUID REFERENCES "oremea_party_registrations"("id") ON DELETE SET NULL,
  "claimed_at" TIMESTAMPTZ(6),
  "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE UNIQUE INDEX "oremea_party_guest_passes_owner_registration_id_slot_key"
  ON "oremea_party_guest_passes"("owner_registration_id", "slot");
CREATE INDEX "oremea_party_guest_passes_event_key_idx"
  ON "oremea_party_guest_passes"("event_key");
CREATE INDEX "oremea_party_guest_passes_owner_registration_id_idx"
  ON "oremea_party_guest_passes"("owner_registration_id");
CREATE INDEX "oremea_party_guest_passes_claimed_at_idx"
  ON "oremea_party_guest_passes"("claimed_at");
