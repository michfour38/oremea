CREATE TABLE "resonance_week_runs" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "user_id" TEXT NOT NULL,
    "week_number" INTEGER NOT NULL,
    "run_number" INTEGER NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'active',
    "purchase_source" TEXT,
    "purchase_reference" TEXT,
    "purchased_at" TIMESTAMPTZ(6),
    "started_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "completed_at" TIMESTAMPTZ(6),
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "resonance_week_runs_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "resonance_week_runs_week_number_check" CHECK ("week_number" BETWEEN 1 AND 10),
    CONSTRAINT "resonance_week_runs_run_number_check" CHECK ("run_number" >= 1)
);

CREATE UNIQUE INDEX "resonance_week_runs_user_id_week_number_run_number_key"
ON "resonance_week_runs"("user_id", "week_number", "run_number");

CREATE UNIQUE INDEX "resonance_week_runs_purchase_reference_key"
ON "resonance_week_runs"("purchase_reference")
WHERE "purchase_reference" IS NOT NULL;

CREATE INDEX "resonance_week_runs_user_id_week_number_idx"
ON "resonance_week_runs"("user_id", "week_number");

CREATE INDEX "resonance_week_runs_user_id_status_idx"
ON "resonance_week_runs"("user_id", "status");

-- Preserve existing Resonance history as Run 1. The actual reflections, 2Q,
-- continues and Mirrors are attached to these rows in the follow-up migration.
WITH activity AS (
    SELECT
        pc."user_id",
        rw."week_number",
        MIN(pc."created_at") AS first_activity,
        MAX(GREATEST(pc."created_at", pc."updated_at")) AS last_activity
    FROM "prompt_completions" pc
    JOIN "day_prompts" dp ON dp."id" = pc."prompt_id"
    JOIN "journey_days" rd ON rd."id" = dp."day_id"
    JOIN "journey_weeks" rw ON rw."id" = rd."week_id"
    GROUP BY pc."user_id", rw."week_number"

    UNION ALL

    SELECT
        rdc."user_id",
        rdc."week_number",
        MIN(rdc."created_at") AS first_activity,
        MAX(rdc."continued_at") AS last_activity
    FROM "journey_day_continues" rdc
    GROUP BY rdc."user_id", rdc."week_number"

    UNION ALL

    SELECT
        rdg."user_id",
        rdg."week_number",
        MIN(rdg."created_at") AS first_activity,
        MAX(rdg."updated_at") AS last_activity
    FROM "resonance_day_guidance" rdg
    GROUP BY rdg."user_id", rdg."week_number"

    UNION ALL

    SELECT
        mr."user_id",
        mr."week_number",
        MIN(mr."created_at") AS first_activity,
        MAX(mr."created_at") AS last_activity
    FROM "mirror_responses" mr
    GROUP BY mr."user_id", mr."week_number"
),
legacy_weeks AS (
    SELECT
        "user_id",
        "week_number",
        MIN(first_activity) AS first_activity,
        MAX(last_activity) AS last_activity
    FROM activity
    GROUP BY "user_id", "week_number"
),
legacy_completion AS (
    SELECT "user_id", "week_number", MAX("continued_at") AS completed_at
    FROM "journey_day_continues"
    WHERE "day_number" = 7
    GROUP BY "user_id", "week_number"
)
INSERT INTO "resonance_week_runs" (
    "user_id",
    "week_number",
    "run_number",
    "status",
    "purchase_source",
    "started_at",
    "completed_at",
    "created_at",
    "updated_at"
)
SELECT
    lw."user_id",
    lw."week_number",
    1,
    CASE WHEN lc.completed_at IS NULL THEN 'preserved' ELSE 'completed' END,
    'legacy',
    lw.first_activity,
    lc.completed_at,
    lw.first_activity,
    COALESCE(lc.completed_at, lw.last_activity)
FROM legacy_weeks lw
LEFT JOIN legacy_completion lc
    ON lc."user_id" = lw."user_id"
   AND lc."week_number" = lw."week_number"
ON CONFLICT ("user_id", "week_number", "run_number") DO NOTHING;

-- The old product could contain more than one unfinished historical week.
-- Preserve them all, but resume only the most recently active unfinished one.
WITH ranked_unfinished AS (
    SELECT
        "id",
        ROW_NUMBER() OVER (
            PARTITION BY "user_id"
            ORDER BY "updated_at" DESC, "started_at" DESC, "week_number" DESC
        ) AS position
    FROM "resonance_week_runs"
    WHERE "status" = 'preserved'
)
UPDATE "resonance_week_runs" r
SET "status" = 'active'
FROM ranked_unfinished ranked
WHERE r."id" = ranked."id"
  AND ranked.position = 1;

CREATE UNIQUE INDEX "resonance_week_runs_one_active_per_user_key"
ON "resonance_week_runs"("user_id")
WHERE "status" = 'active';
