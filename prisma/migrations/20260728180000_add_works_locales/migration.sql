-- CreateTable
CREATE TABLE "works_locales" (
  "id" UUID NOT NULL DEFAULT gen_random_uuid(),
  "market_id" UUID NOT NULL,
  "code" TEXT NOT NULL,
  "language_code" TEXT NOT NULL,
  "region_code" TEXT,
  "name" TEXT NOT NULL,
  "local_name" TEXT NOT NULL,
  "is_default" BOOLEAN NOT NULL DEFAULT false,
  "active" BOOLEAN NOT NULL DEFAULT true,
  "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT "works_locales_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "works_locales_market_id_code_key"
ON "works_locales"("market_id", "code");

-- CreateIndex
CREATE INDEX "works_locales_market_id_idx"
ON "works_locales"("market_id");

-- AddForeignKey
ALTER TABLE "works_locales"
ADD CONSTRAINT "works_locales_market_id_fkey"
FOREIGN KEY ("market_id") REFERENCES "works_markets"("id")
ON DELETE CASCADE ON UPDATE CASCADE;
