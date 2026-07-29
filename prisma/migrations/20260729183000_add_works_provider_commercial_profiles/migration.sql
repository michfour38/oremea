CREATE TYPE "WorksProviderPlan" AS ENUM ('FREE', 'VERIFIED', 'GROWTH', 'ENTERPRISE');

CREATE TYPE "WorksProviderCapacityStatus" AS ENUM ('OPEN', 'LIMITED', 'FULL', 'PAUSED');

CREATE TABLE "works_provider_commercial_profiles" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "provider_id" UUID NOT NULL,
    "plan" "WorksProviderPlan" NOT NULL DEFAULT 'FREE',
    "marketing_opt_in" BOOLEAN NOT NULL DEFAULT false,
    "wants_more_work" BOOLEAN NOT NULL DEFAULT false,
    "capacity_status" "WorksProviderCapacityStatus" NOT NULL DEFAULT 'OPEN',
    "capacity_note" TEXT,
    "target_service_keys" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "target_category_keys" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "marketing_note" TEXT,
    "activated_at" TIMESTAMPTZ(6),
    "plan_started_at" TIMESTAMPTZ(6),
    "plan_ends_at" TIMESTAMPTZ(6),
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "works_provider_commercial_profiles_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "works_provider_commercial_profiles_provider_id_key" ON "works_provider_commercial_profiles"("provider_id");
CREATE INDEX "works_provider_commercial_profiles_plan_idx" ON "works_provider_commercial_profiles"("plan");
CREATE INDEX "works_provider_commercial_profiles_marketing_opt_in_wants_more_work_idx" ON "works_provider_commercial_profiles"("marketing_opt_in", "wants_more_work");
CREATE INDEX "works_provider_commercial_profiles_capacity_status_idx" ON "works_provider_commercial_profiles"("capacity_status");

ALTER TABLE "works_provider_commercial_profiles"
ADD CONSTRAINT "works_provider_commercial_profiles_provider_id_fkey"
FOREIGN KEY ("provider_id") REFERENCES "works_providers"("id") ON DELETE CASCADE ON UPDATE CASCADE;
