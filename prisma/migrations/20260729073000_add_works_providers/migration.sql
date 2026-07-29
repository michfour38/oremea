-- CreateEnum
CREATE TYPE "WorksProviderKind" AS ENUM (
  'ORGANIZATION',
  'INDIVIDUAL'
);

-- CreateEnum
CREATE TYPE "WorksProviderProfileStatus" AS ENUM (
  'RESEARCHED',
  'CLAIM_INVITED',
  'CLAIMED',
  'ACTIVE',
  'ARCHIVED'
);

-- CreateTable
CREATE TABLE "works_providers" (
  "id" UUID NOT NULL DEFAULT gen_random_uuid(),
  "kind" "WorksProviderKind" NOT NULL DEFAULT 'ORGANIZATION',
  "name" TEXT NOT NULL,
  "slug" TEXT NOT NULL,
  "legal_name" TEXT,
  "website" TEXT,
  "email" TEXT,
  "phone" TEXT,
  "description" TEXT,
  "profile_status" "WorksProviderProfileStatus" NOT NULL DEFAULT 'RESEARCHED',
  "founding_provider" BOOLEAN NOT NULL DEFAULT false,
  "last_profile_reviewed_at" TIMESTAMPTZ(6),
  "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT "works_providers_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "works_provider_markets" (
  "id" UUID NOT NULL DEFAULT gen_random_uuid(),
  "provider_id" UUID NOT NULL,
  "market_id" UUID NOT NULL,
  "administrative_area" TEXT,
  "locality" TEXT,
  "latitude" DECIMAL(9,6),
  "longitude" DECIMAL(9,6),
  "serves_nationally" BOOLEAN,
  "accepts_remote_clients" BOOLEAN,
  "exports" BOOLEAN,
  "export_regions" TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
  "active" BOOLEAN NOT NULL DEFAULT true,
  "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT "works_provider_markets_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "works_providers_slug_key" ON "works_providers"("slug");

-- CreateIndex
CREATE INDEX "works_providers_name_idx" ON "works_providers"("name");

-- CreateIndex
CREATE INDEX "works_providers_profile_status_idx" ON "works_providers"("profile_status");

-- CreateIndex
CREATE INDEX "works_providers_founding_provider_idx" ON "works_providers"("founding_provider");

-- CreateIndex
CREATE UNIQUE INDEX "works_provider_markets_provider_id_market_id_key" ON "works_provider_markets"("provider_id", "market_id");

-- CreateIndex
CREATE INDEX "works_provider_markets_provider_id_idx" ON "works_provider_markets"("provider_id");

-- CreateIndex
CREATE INDEX "works_provider_markets_market_id_idx" ON "works_provider_markets"("market_id");

-- CreateIndex
CREATE INDEX "works_provider_markets_market_id_administrative_area_idx" ON "works_provider_markets"("market_id", "administrative_area");

-- CreateIndex
CREATE INDEX "works_provider_markets_market_id_locality_idx" ON "works_provider_markets"("market_id", "locality");

-- CreateIndex
CREATE INDEX "works_provider_markets_market_id_active_idx" ON "works_provider_markets"("market_id", "active");

-- AddForeignKey
ALTER TABLE "works_provider_markets"
ADD CONSTRAINT "works_provider_markets_provider_id_fkey"
FOREIGN KEY ("provider_id") REFERENCES "works_providers"("id")
ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "works_provider_markets"
ADD CONSTRAINT "works_provider_markets_market_id_fkey"
FOREIGN KEY ("market_id") REFERENCES "works_markets"("id")
ON DELETE CASCADE ON UPDATE CASCADE;
