-- CreateEnum
CREATE TYPE "WorksSearchSessionStatus" AS ENUM (
  'IN_PROGRESS',
  'ROUTE_BUILT',
  'SOURCING_REQUESTED',
  'COMPLETED',
  'ABANDONED'
);

-- CreateEnum
CREATE TYPE "WorksProcurementRequestStatus" AS ENUM (
  'REQUESTED',
  'SEARCHING',
  'PROVIDERS_FOUND',
  'CONTACTED',
  'COMPLETED',
  'CLOSED'
);

-- CreateTable
CREATE TABLE "works_search_sessions" (
  "id" UUID NOT NULL DEFAULT gen_random_uuid(),
  "market_id" UUID NOT NULL,
  "browser_session_id" TEXT,
  "answers" JSONB NOT NULL DEFAULT '{}'::jsonb,
  "current_step" TEXT,
  "status" "WorksSearchSessionStatus" NOT NULL DEFAULT 'IN_PROGRESS',
  "brief_id" UUID,
  "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "completed_at" TIMESTAMPTZ(6),

  CONSTRAINT "works_search_sessions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "works_procurement_requests" (
  "id" UUID NOT NULL DEFAULT gen_random_uuid(),
  "search_session_id" UUID NOT NULL,
  "brief_id" UUID NOT NULL,
  "name" TEXT NOT NULL,
  "email" TEXT NOT NULL,
  "phone" TEXT,
  "preferred_contact_method" TEXT,
  "status" "WorksProcurementRequestStatus" NOT NULL DEFAULT 'REQUESTED',
  "consented_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT "works_procurement_requests_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "works_search_sessions_brief_id_key"
ON "works_search_sessions"("brief_id");

CREATE INDEX "works_search_sessions_market_id_status_idx"
ON "works_search_sessions"("market_id", "status");

CREATE INDEX "works_search_sessions_browser_session_id_idx"
ON "works_search_sessions"("browser_session_id");

CREATE INDEX "works_search_sessions_updated_at_idx"
ON "works_search_sessions"("updated_at");

CREATE UNIQUE INDEX "works_procurement_requests_search_session_id_key"
ON "works_procurement_requests"("search_session_id");

CREATE UNIQUE INDEX "works_procurement_requests_brief_id_key"
ON "works_procurement_requests"("brief_id");

CREATE INDEX "works_procurement_requests_status_idx"
ON "works_procurement_requests"("status");

CREATE INDEX "works_procurement_requests_email_idx"
ON "works_procurement_requests"("email");

CREATE INDEX "works_procurement_requests_created_at_idx"
ON "works_procurement_requests"("created_at");

-- AddForeignKey
ALTER TABLE "works_search_sessions"
ADD CONSTRAINT "works_search_sessions_market_id_fkey"
FOREIGN KEY ("market_id") REFERENCES "works_markets"("id")
ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "works_search_sessions"
ADD CONSTRAINT "works_search_sessions_brief_id_fkey"
FOREIGN KEY ("brief_id") REFERENCES "works_product_briefs"("id")
ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "works_procurement_requests"
ADD CONSTRAINT "works_procurement_requests_search_session_id_fkey"
FOREIGN KEY ("search_session_id") REFERENCES "works_search_sessions"("id")
ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "works_procurement_requests"
ADD CONSTRAINT "works_procurement_requests_brief_id_fkey"
FOREIGN KEY ("brief_id") REFERENCES "works_product_briefs"("id")
ON DELETE CASCADE ON UPDATE CASCADE;
