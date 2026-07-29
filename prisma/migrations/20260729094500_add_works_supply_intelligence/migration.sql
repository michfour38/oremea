-- CreateTable
CREATE TABLE "works_services" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "key" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "sort_order" INTEGER NOT NULL DEFAULT 0,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "works_services_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "works_service_translations" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "service_id" UUID NOT NULL,
    "locale_id" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "works_service_translations_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "works_service_categories" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "service_id" UUID NOT NULL,
    "category_id" UUID NOT NULL,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "works_service_categories_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "works_capabilities" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "key" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "sort_order" INTEGER NOT NULL DEFAULT 0,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "works_capabilities_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "works_capability_translations" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "capability_id" UUID NOT NULL,
    "locale_id" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "works_capability_translations_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "works_capability_categories" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "capability_id" UUID NOT NULL,
    "category_id" UUID NOT NULL,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "works_capability_categories_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "works_offerings" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "provider_market_id" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "description" TEXT,
    "production_model" TEXT,
    "moq_value" DECIMAL(14,3),
    "moq_unit" TEXT,
    "max_run_value" DECIMAL(14,3),
    "max_run_unit" TEXT,
    "lead_time_min_days" INTEGER,
    "lead_time_max_days" INTEGER,
    "sample_available" BOOLEAN,
    "sample_cost_amount" DECIMAL(14,2),
    "sample_cost_currency" TEXT,
    "startup_friendly" BOOLEAN,
    "quote_required" BOOLEAN NOT NULL DEFAULT true,
    "pricing_model" TEXT,
    "packaging_supplied" BOOLEAN,
    "client_packaging_accepted" BOOLEAN,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "works_offerings_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "works_offering_categories" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "offering_id" UUID NOT NULL,
    "category_id" UUID NOT NULL,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "works_offering_categories_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "works_offering_services" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "offering_id" UUID NOT NULL,
    "service_id" UUID NOT NULL,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "works_offering_services_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "works_offering_capabilities" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "offering_id" UUID NOT NULL,
    "capability_id" UUID NOT NULL,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "works_offering_capabilities_pkey" PRIMARY KEY ("id")
);

-- Offering-scoped claim provenance
ALTER TABLE "works_claims" ADD COLUMN "offering_id" UUID;
DROP INDEX "works_claims_provider_id_field_is_current_idx";

-- Unique indexes
CREATE UNIQUE INDEX "works_services_key_key" ON "works_services"("key");
CREATE UNIQUE INDEX "works_services_slug_key" ON "works_services"("slug");
CREATE UNIQUE INDEX "works_service_translations_service_id_locale_id_key" ON "works_service_translations"("service_id", "locale_id");
CREATE UNIQUE INDEX "works_service_categories_service_id_category_id_key" ON "works_service_categories"("service_id", "category_id");
CREATE UNIQUE INDEX "works_capabilities_key_key" ON "works_capabilities"("key");
CREATE UNIQUE INDEX "works_capabilities_slug_key" ON "works_capabilities"("slug");
CREATE UNIQUE INDEX "works_capability_translations_capability_id_locale_id_key" ON "works_capability_translations"("capability_id", "locale_id");
CREATE UNIQUE INDEX "works_capability_categories_capability_id_category_id_key" ON "works_capability_categories"("capability_id", "category_id");
CREATE UNIQUE INDEX "works_offerings_provider_market_id_slug_key" ON "works_offerings"("provider_market_id", "slug");
CREATE UNIQUE INDEX "works_offering_categories_offering_id_category_id_key" ON "works_offering_categories"("offering_id", "category_id");
CREATE UNIQUE INDEX "works_offering_services_offering_id_service_id_key" ON "works_offering_services"("offering_id", "service_id");
CREATE UNIQUE INDEX "works_offering_capabilities_offering_id_capability_id_key" ON "works_offering_capabilities"("offering_id", "capability_id");

-- Search indexes
CREATE INDEX "works_services_active_sort_order_idx" ON "works_services"("active", "sort_order");
CREATE INDEX "works_service_translations_locale_id_idx" ON "works_service_translations"("locale_id");
CREATE INDEX "works_service_categories_service_id_idx" ON "works_service_categories"("service_id");
CREATE INDEX "works_service_categories_category_id_idx" ON "works_service_categories"("category_id");
CREATE INDEX "works_capabilities_active_sort_order_idx" ON "works_capabilities"("active", "sort_order");
CREATE INDEX "works_capability_translations_locale_id_idx" ON "works_capability_translations"("locale_id");
CREATE INDEX "works_capability_categories_capability_id_idx" ON "works_capability_categories"("capability_id");
CREATE INDEX "works_capability_categories_category_id_idx" ON "works_capability_categories"("category_id");
CREATE INDEX "works_offerings_provider_market_id_active_idx" ON "works_offerings"("provider_market_id", "active");
CREATE INDEX "works_offerings_production_model_idx" ON "works_offerings"("production_model");
CREATE INDEX "works_offerings_moq_value_idx" ON "works_offerings"("moq_value");
CREATE INDEX "works_offerings_lead_time_min_days_lead_time_max_days_idx" ON "works_offerings"("lead_time_min_days", "lead_time_max_days");
CREATE INDEX "works_offering_categories_offering_id_idx" ON "works_offering_categories"("offering_id");
CREATE INDEX "works_offering_categories_category_id_idx" ON "works_offering_categories"("category_id");
CREATE INDEX "works_offering_services_offering_id_idx" ON "works_offering_services"("offering_id");
CREATE INDEX "works_offering_services_service_id_idx" ON "works_offering_services"("service_id");
CREATE INDEX "works_offering_capabilities_offering_id_idx" ON "works_offering_capabilities"("offering_id");
CREATE INDEX "works_offering_capabilities_capability_id_idx" ON "works_offering_capabilities"("capability_id");
CREATE INDEX "works_claims_offering_id_idx" ON "works_claims"("offering_id");
CREATE INDEX "works_claims_provider_id_offering_id_field_is_current_idx" ON "works_claims"("provider_id", "offering_id", "field", "is_current");

-- Foreign keys
ALTER TABLE "works_service_translations" ADD CONSTRAINT "works_service_translations_service_id_fkey" FOREIGN KEY ("service_id") REFERENCES "works_services"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "works_service_translations" ADD CONSTRAINT "works_service_translations_locale_id_fkey" FOREIGN KEY ("locale_id") REFERENCES "works_locales"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "works_service_categories" ADD CONSTRAINT "works_service_categories_service_id_fkey" FOREIGN KEY ("service_id") REFERENCES "works_services"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "works_service_categories" ADD CONSTRAINT "works_service_categories_category_id_fkey" FOREIGN KEY ("category_id") REFERENCES "works_categories"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "works_capability_translations" ADD CONSTRAINT "works_capability_translations_capability_id_fkey" FOREIGN KEY ("capability_id") REFERENCES "works_capabilities"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "works_capability_translations" ADD CONSTRAINT "works_capability_translations_locale_id_fkey" FOREIGN KEY ("locale_id") REFERENCES "works_locales"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "works_capability_categories" ADD CONSTRAINT "works_capability_categories_capability_id_fkey" FOREIGN KEY ("capability_id") REFERENCES "works_capabilities"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "works_capability_categories" ADD CONSTRAINT "works_capability_categories_category_id_fkey" FOREIGN KEY ("category_id") REFERENCES "works_categories"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "works_offerings" ADD CONSTRAINT "works_offerings_provider_market_id_fkey" FOREIGN KEY ("provider_market_id") REFERENCES "works_provider_markets"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "works_offering_categories" ADD CONSTRAINT "works_offering_categories_offering_id_fkey" FOREIGN KEY ("offering_id") REFERENCES "works_offerings"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "works_offering_categories" ADD CONSTRAINT "works_offering_categories_category_id_fkey" FOREIGN KEY ("category_id") REFERENCES "works_categories"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "works_offering_services" ADD CONSTRAINT "works_offering_services_offering_id_fkey" FOREIGN KEY ("offering_id") REFERENCES "works_offerings"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "works_offering_services" ADD CONSTRAINT "works_offering_services_service_id_fkey" FOREIGN KEY ("service_id") REFERENCES "works_services"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "works_offering_capabilities" ADD CONSTRAINT "works_offering_capabilities_offering_id_fkey" FOREIGN KEY ("offering_id") REFERENCES "works_offerings"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "works_offering_capabilities" ADD CONSTRAINT "works_offering_capabilities_capability_id_fkey" FOREIGN KEY ("capability_id") REFERENCES "works_capabilities"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "works_claims" ADD CONSTRAINT "works_claims_offering_id_fkey" FOREIGN KEY ("offering_id") REFERENCES "works_offerings"("id") ON DELETE SET NULL ON UPDATE CASCADE;
