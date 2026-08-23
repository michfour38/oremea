CREATE TYPE "WorksOfferingEvidenceStatus" AS ENUM (
  'SELF_REPORTED',
  'SOURCE_REVIEWED',
  'VERIFIED'
);

ALTER TABLE "works_offerings"
ADD COLUMN "evidence_status" "WorksOfferingEvidenceStatus" NOT NULL DEFAULT 'SELF_REPORTED';

-- Offerings present before self-service capability editing were created through
-- the researched WORKS supply graph. New provider-entered offerings keep the
-- SELF_REPORTED default until WORKS reviews their supporting source or evidence.
UPDATE "works_offerings"
SET "evidence_status" = 'SOURCE_REVIEWED';
