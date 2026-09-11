ALTER TABLE "oremea_party_registrations"
  ADD COLUMN "invite_allowance" INTEGER NOT NULL DEFAULT 0;

UPDATE "oremea_party_registrations"
SET "invite_allowance" = 2
WHERE "invited_by" IS NULL;

ALTER TABLE "oremea_party_registrations"
  ADD CONSTRAINT "oremea_party_registrations_invite_allowance_check"
  CHECK ("invite_allowance" BETWEEN 0 AND 2);
