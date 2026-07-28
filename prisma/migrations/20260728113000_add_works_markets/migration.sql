-- CreateEnum
CREATE TYPE "WorksMarketLaunchStatus" AS ENUM (
  'PLANNED',
  'RESEARCHING',
  'SEEDING',
  'BETA',
  'LIVE',
  'PAUSED'
);

-- CreateTable
CREATE TABLE "works_markets" (
  "id" UUID NOT NULL DEFAULT gen_random_uuid(),
  "code" TEXT NOT NULL,
  "slug" TEXT NOT NULL,
  "name" TEXT NOT NULL,
  "local_name" TEXT NOT NULL,
  "default_locale" TEXT NOT NULL,
  "currency_code" TEXT NOT NULL,
  "currency_symbol" TEXT NOT NULL,
  "calling_code" TEXT,
  "active" BOOLEAN NOT NULL DEFAULT false,
  "launch_status" "WorksMarketLaunchStatus" NOT NULL DEFAULT 'PLANNED',
  "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT "works_markets_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "works_markets_code_key" ON "works_markets"("code");

-- CreateIndex
CREATE UNIQUE INDEX "works_markets_slug_key" ON "works_markets"("slug");
