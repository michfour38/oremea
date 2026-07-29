-- Attach Resonance journey data to a specific week run so repeat purchases can
-- preserve earlier visits instead of overwriting them.

ALTER TABLE "prompt_completions"
ADD COLUMN "run_id" UUID;

ALTER TABLE "resonance_day_guidance"
ADD COLUMN "run_id" UUID;

ALTER TABLE "journey_day_continues"
ADD COLUMN "run_id" UUID;

ALTER TABLE "mirror_responses"
ADD COLUMN "run_id" UUID;

-- Every legacy row belongs to the Run 1 created by the preceding
-- resonance_week_runs migration.
UPDATE "prompt_completions" pc
SET "run_id" = r."id"
FROM "day_prompts" dp
JOIN "journey_days" rd ON rd."id" = dp."day_id"
JOIN "journey_weeks" rw ON rw."id" = rd."week_id"
JOIN "resonance_week_runs" r
  ON r."week_number" = rw."week_number"
 AND r."run_number" = 1
WHERE pc."prompt_id" = dp."id"
  AND r."user_id" = pc."user_id";

UPDATE "resonance_day_guidance" g
SET "run_id" = r."id"
FROM "resonance_week_runs" r
WHERE r."user_id" = g."user_id"
  AND r."week_number" = g."week_number"
  AND r."run_number" = 1;

UPDATE "journey_day_continues" c
SET "run_id" = r."id"
FROM "resonance_week_runs" r
WHERE r."user_id" = c."user_id"
  AND r."week_number" = c."week_number"
  AND r."run_number" = 1;

UPDATE "mirror_responses" m
SET "run_id" = r."id"
FROM "resonance_week_runs" r
WHERE r."user_id" = m."user_id"
  AND r."week_number" = m."week_number"
  AND r."run_number" = 1;

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM "prompt_completions" WHERE "run_id" IS NULL) THEN
    RAISE EXCEPTION 'Could not attach every prompt completion to a Resonance run';
  END IF;

  IF EXISTS (SELECT 1 FROM "resonance_day_guidance" WHERE "run_id" IS NULL) THEN
    RAISE EXCEPTION 'Could not attach every 2Q record to a Resonance run';
  END IF;

  IF EXISTS (SELECT 1 FROM "journey_day_continues" WHERE "run_id" IS NULL) THEN
    RAISE EXCEPTION 'Could not attach every day continuation to a Resonance run';
  END IF;

  IF EXISTS (SELECT 1 FROM "mirror_responses" WHERE "run_id" IS NULL) THEN
    RAISE EXCEPTION 'Could not attach every Mirror to a Resonance run';
  END IF;
END $$;

ALTER TABLE "prompt_completions"
ALTER COLUMN "run_id" SET NOT NULL;

ALTER TABLE "resonance_day_guidance"
ALTER COLUMN "run_id" SET NOT NULL;

ALTER TABLE "journey_day_continues"
ALTER COLUMN "run_id" SET NOT NULL;

ALTER TABLE "mirror_responses"
ALTER COLUMN "run_id" SET NOT NULL;

ALTER TABLE "prompt_completions"
ADD CONSTRAINT "prompt_completions_run_id_fkey"
FOREIGN KEY ("run_id") REFERENCES "resonance_week_runs"("id")
ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "resonance_day_guidance"
ADD CONSTRAINT "resonance_day_guidance_run_id_fkey"
FOREIGN KEY ("run_id") REFERENCES "resonance_week_runs"("id")
ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "journey_day_continues"
ADD CONSTRAINT "journey_day_continues_run_id_fkey"
FOREIGN KEY ("run_id") REFERENCES "resonance_week_runs"("id")
ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "mirror_responses"
ADD CONSTRAINT "mirror_responses_run_id_fkey"
FOREIGN KEY ("run_id") REFERENCES "resonance_week_runs"("id")
ON DELETE CASCADE ON UPDATE CASCADE;

-- Remove the first-visit-only uniqueness rules. Keep both possible historical
-- names because Prisma's mapped table names changed the generated index names
-- across earlier migrations.
DROP INDEX IF EXISTS "prompt_completions_prompt_id_user_id_key";
DROP INDEX IF EXISTS "resonance_day_guidance_user_id_week_number_day_number_key";
DROP INDEX IF EXISTS "journey_day_continues_user_id_week_number_day_number_key";
DROP INDEX IF EXISTS "resonance_day_continues_user_id_week_number_day_number_key";
DROP INDEX IF EXISTS "mirror_responses_user_id_week_number_day_number_key";

CREATE UNIQUE INDEX "prompt_completions_prompt_id_run_id_key"
ON "prompt_completions"("prompt_id", "run_id");

CREATE UNIQUE INDEX "resonance_day_guidance_run_id_day_number_key"
ON "resonance_day_guidance"("run_id", "day_number");

CREATE UNIQUE INDEX "journey_day_continues_run_id_day_number_key"
ON "journey_day_continues"("run_id", "day_number");

CREATE UNIQUE INDEX "mirror_responses_run_id_day_number_key"
ON "mirror_responses"("run_id", "day_number");

CREATE INDEX "prompt_completions_run_id_idx"
ON "prompt_completions"("run_id");

CREATE INDEX "resonance_day_guidance_run_id_idx"
ON "resonance_day_guidance"("run_id");

CREATE INDEX "journey_day_continues_run_id_idx"
ON "journey_day_continues"("run_id");

CREATE INDEX "mirror_responses_run_id_idx"
ON "mirror_responses"("run_id");
