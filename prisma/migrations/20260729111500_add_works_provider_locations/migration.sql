-- CreateTable
CREATE TABLE "works_provider_locations" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "provider_market_id" UUID NOT NULL,
    "key" TEXT NOT NULL,
    "label" TEXT,
    "location_type" TEXT,
    "address_line_1" TEXT,
    "address_line_2" TEXT,
    "administrative_area" TEXT,
    "locality" TEXT,
    "postal_code" TEXT,
    "latitude" DECIMAL(9,6),
    "longitude" DECIMAL(9,6),
    "is_primary" BOOLEAN NOT NULL DEFAULT false,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "works_provider_locations_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "works_provider_locations_provider_market_id_key_key"
ON "works_provider_locations"("provider_market_id", "key");

CREATE INDEX "works_provider_locations_provider_market_id_active_idx"
ON "works_provider_locations"("provider_market_id", "active");

CREATE INDEX "works_provider_locations_administrative_area_idx"
ON "works_provider_locations"("administrative_area");

CREATE INDEX "works_provider_locations_locality_idx"
ON "works_provider_locations"("locality");

ALTER TABLE "works_provider_locations"
ADD CONSTRAINT "works_provider_locations_provider_market_id_fkey"
FOREIGN KEY ("provider_market_id") REFERENCES "works_provider_markets"("id")
ON DELETE CASCADE ON UPDATE CASCADE;
