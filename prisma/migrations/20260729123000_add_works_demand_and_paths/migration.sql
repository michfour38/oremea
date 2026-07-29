-- CreateEnum
CREATE TYPE "WorksRequirementPriority" AS ENUM ('REQUIRED', 'PREFERRED', 'OPTIONAL');

-- CreateEnum
CREATE TYPE "WorksProductionStepStatus" AS ENUM ('COMPLETE', 'NEEDED', 'UNSURE', 'NOT_APPLICABLE');

-- CreateEnum
CREATE TYPE "WorksProductionStepSource" AS ENUM ('SYSTEM_GENERATED', 'USER_ADDED', 'SUPPLIER_RECOMMENDED');

-- CreateTable
CREATE TABLE "works_product_briefs" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "market_id" UUID NOT NULL,
    "category_id" UUID,
    "product_description" TEXT NOT NULL,
    "product_type" TEXT,
    "stage" TEXT,
    "target_quantity" DECIMAL(14,3),
    "quantity_unit" TEXT,
    "location_preference" TEXT,
    "administrative_area" TEXT,
    "timeline_date" DATE,
    "contact_email" TEXT,
    "status" TEXT NOT NULL DEFAULT 'DRAFT',
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "works_product_briefs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "works_requirements" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "brief_id" UUID NOT NULL,
    "requirement_type" TEXT NOT NULL,
    "field" TEXT NOT NULL,
    "value" JSONB NOT NULL,
    "display_value" TEXT,
    "priority" "WorksRequirementPriority" NOT NULL DEFAULT 'REQUIRED',
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "works_requirements_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "works_production_paths" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "brief_id" UUID NOT NULL,
    "version" INTEGER NOT NULL DEFAULT 1,
    "is_current" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "works_production_paths_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "works_production_steps" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "path_id" UUID NOT NULL,
    "service_id" UUID,
    "step_key" TEXT,
    "title" TEXT NOT NULL,
    "position" INTEGER NOT NULL,
    "status" "WorksProductionStepStatus" NOT NULL DEFAULT 'NEEDED',
    "source" "WorksProductionStepSource" NOT NULL DEFAULT 'SYSTEM_GENERATED',
    "dependency_keys" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "notes" TEXT,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "works_production_steps_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "works_product_briefs_market_id_status_idx" ON "works_product_briefs"("market_id", "status");
CREATE INDEX "works_product_briefs_category_id_idx" ON "works_product_briefs"("category_id");
CREATE INDEX "works_product_briefs_administrative_area_idx" ON "works_product_briefs"("administrative_area");
CREATE INDEX "works_product_briefs_created_at_idx" ON "works_product_briefs"("created_at");
CREATE INDEX "works_requirements_brief_id_idx" ON "works_requirements"("brief_id");
CREATE INDEX "works_requirements_brief_id_field_idx" ON "works_requirements"("brief_id", "field");
CREATE INDEX "works_requirements_brief_id_priority_idx" ON "works_requirements"("brief_id", "priority");
CREATE INDEX "works_requirements_requirement_type_idx" ON "works_requirements"("requirement_type");
CREATE UNIQUE INDEX "works_production_paths_brief_id_version_key" ON "works_production_paths"("brief_id", "version");
CREATE INDEX "works_production_paths_brief_id_is_current_idx" ON "works_production_paths"("brief_id", "is_current");
CREATE INDEX "works_production_steps_path_id_position_idx" ON "works_production_steps"("path_id", "position");
CREATE INDEX "works_production_steps_service_id_idx" ON "works_production_steps"("service_id");
CREATE INDEX "works_production_steps_status_idx" ON "works_production_steps"("status");
CREATE INDEX "works_production_steps_source_idx" ON "works_production_steps"("source");

-- AddForeignKey
ALTER TABLE "works_product_briefs" ADD CONSTRAINT "works_product_briefs_market_id_fkey" FOREIGN KEY ("market_id") REFERENCES "works_markets"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "works_product_briefs" ADD CONSTRAINT "works_product_briefs_category_id_fkey" FOREIGN KEY ("category_id") REFERENCES "works_categories"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "works_requirements" ADD CONSTRAINT "works_requirements_brief_id_fkey" FOREIGN KEY ("brief_id") REFERENCES "works_product_briefs"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "works_production_paths" ADD CONSTRAINT "works_production_paths_brief_id_fkey" FOREIGN KEY ("brief_id") REFERENCES "works_product_briefs"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "works_production_steps" ADD CONSTRAINT "works_production_steps_path_id_fkey" FOREIGN KEY ("path_id") REFERENCES "works_production_paths"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "works_production_steps" ADD CONSTRAINT "works_production_steps_service_id_fkey" FOREIGN KEY ("service_id") REFERENCES "works_services"("id") ON DELETE SET NULL ON UPDATE CASCADE;
