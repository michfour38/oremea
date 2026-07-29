CREATE TYPE "WorksProviderMembershipRole" AS ENUM ('OWNER', 'MANAGER');

CREATE TABLE "works_provider_memberships" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "provider_id" UUID NOT NULL,
    "clerk_user_id" TEXT NOT NULL,
    "role" "WorksProviderMembershipRole" NOT NULL DEFAULT 'MANAGER',
    "active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "works_provider_memberships_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "works_provider_memberships_provider_id_clerk_user_id_key"
ON "works_provider_memberships"("provider_id", "clerk_user_id");

CREATE INDEX "works_provider_memberships_clerk_user_id_active_idx"
ON "works_provider_memberships"("clerk_user_id", "active");

CREATE INDEX "works_provider_memberships_provider_id_active_idx"
ON "works_provider_memberships"("provider_id", "active");

ALTER TABLE "works_provider_memberships"
ADD CONSTRAINT "works_provider_memberships_provider_id_fkey"
FOREIGN KEY ("provider_id") REFERENCES "works_providers"("id") ON DELETE CASCADE ON UPDATE CASCADE;