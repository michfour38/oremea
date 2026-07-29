-- CreateTable
CREATE TABLE "works_provider_types" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "key" TEXT NOT NULL,
    "sort_order" INTEGER NOT NULL DEFAULT 0,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "works_provider_types_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "works_provider_type_translations" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "provider_type_id" UUID NOT NULL,
    "locale_id" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "works_provider_type_translations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "works_provider_type_links" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "provider_id" UUID NOT NULL,
    "provider_type_id" UUID NOT NULL,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "works_provider_type_links_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "works_provider_types_key_key" ON "works_provider_types"("key");

-- CreateIndex
CREATE INDEX "works_provider_types_active_sort_order_idx" ON "works_provider_types"("active", "sort_order");

-- CreateIndex
CREATE UNIQUE INDEX "works_provider_type_translations_provider_type_id_locale_id_key" ON "works_provider_type_translations"("provider_type_id", "locale_id");

-- CreateIndex
CREATE INDEX "works_provider_type_translations_locale_id_idx" ON "works_provider_type_translations"("locale_id");

-- CreateIndex
CREATE UNIQUE INDEX "works_provider_type_links_provider_id_provider_type_id_key" ON "works_provider_type_links"("provider_id", "provider_type_id");

-- CreateIndex
CREATE INDEX "works_provider_type_links_provider_id_idx" ON "works_provider_type_links"("provider_id");

-- CreateIndex
CREATE INDEX "works_provider_type_links_provider_type_id_idx" ON "works_provider_type_links"("provider_type_id");

-- AddForeignKey
ALTER TABLE "works_provider_type_translations" ADD CONSTRAINT "works_provider_type_translations_provider_type_id_fkey" FOREIGN KEY ("provider_type_id") REFERENCES "works_provider_types"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "works_provider_type_translations" ADD CONSTRAINT "works_provider_type_translations_locale_id_fkey" FOREIGN KEY ("locale_id") REFERENCES "works_locales"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "works_provider_type_links" ADD CONSTRAINT "works_provider_type_links_provider_id_fkey" FOREIGN KEY ("provider_id") REFERENCES "works_providers"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "works_provider_type_links" ADD CONSTRAINT "works_provider_type_links_provider_type_id_fkey" FOREIGN KEY ("provider_type_id") REFERENCES "works_provider_types"("id") ON DELETE CASCADE ON UPDATE CASCADE;
