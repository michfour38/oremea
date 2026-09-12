ALTER TABLE "oremea_party_registrations"
  ALTER COLUMN "invite_allowance" SET DEFAULT 2;

UPDATE "oremea_party_registrations"
SET "invite_allowance" = 2
WHERE "invite_allowance" <> 2;
