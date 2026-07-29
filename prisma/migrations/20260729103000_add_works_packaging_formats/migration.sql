-- CreateTable
CREATE TABLE "works_packaging_formats" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "key" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "sort_order" INTEGER NOT NULL DEFAULT 0,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "works_packaging_formats_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "works_packaging_format_translations" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "packaging_format_id" UUID NOT NULL,
    "locale_id" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "works_packaging_format_translations_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "works_packaging_format_categories" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "packaging_format_id" UUID NOT NULL,
    "category_id" UUID NOT NULL,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "works_packaging_format_categories_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "works_offering_packaging_formats" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "offering_id" UUID NOT NULL,
    "packaging_format_id" UUID NOT NULL,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "works_offering_packaging_formats_pkey" PRIMARY KEY ("id")
);

-- Unique indexes
CREATE UNIQUE INDEX "works_packaging_formats_key_key" ON "works_packaging_formats"("key");
CREATE UNIQUE INDEX "works_packaging_formats_slug_key" ON "works_packaging_formats"("slug");
CREATE UNIQUE INDEX "works_packaging_format_translations_packaging_format_id_locale_id_key" ON "works_packaging_format_translations"("packaging_format_id", "locale_id");
CREATE UNIQUE INDEX "works_packaging_format_categories_packaging_format_id_category_id_key" ON "works_packaging_format_categories"("packaging_format_id", "category_id");
CREATE UNIQUE INDEX "works_offering_packaging_formats_offering_id_packaging_format_id_key" ON "works_offering_packaging_formats"("offering_id", "packaging_format_id");

-- Search indexes
CREATE INDEX "works_packaging_formats_active_sort_order_idx" ON "works_packaging_formats"("active", "sort_order");
CREATE INDEX "works_packaging_format_translations_locale_id_idx" ON "works_packaging_format_translations"("locale_id");
CREATE INDEX "works_packaging_format_categories_packaging_format_id_idx" ON "works_packaging_format_categories"("packaging_format_id");
CREATE INDEX "works_packaging_format_categories_category_id_idx" ON "works_packaging_format_categories"("category_id");
CREATE INDEX "works_offering_packaging_formats_offering_id_idx" ON "works_offering_packaging_formats"("offering_id");
CREATE INDEX "works_offering_packaging_formats_packaging_format_id_idx" ON "works_offering_packaging_formats"("packaging_format_id");

-- Foreign keys
ALTER TABLE "works_packaging_format_translations" ADD CONSTRAINT "works_packaging_format_translations_packaging_format_id_fkey" FOREIGN KEY ("packaging_format_id") REFERENCES "works_packaging_formats"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "works_packaging_format_translations" ADD CONSTRAINT "works_packaging_format_translations_locale_id_fkey" FOREIGN KEY ("locale_id") REFERENCES "works_locales"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "works_packaging_format_categories" ADD CONSTRAINT "works_packaging_format_categories_packaging_format_id_fkey" FOREIGN KEY ("packaging_format_id") REFERENCES "works_packaging_formats"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "works_packaging_format_categories" ADD CONSTRAINT "works_packaging_format_categories_category_id_fkey" FOREIGN KEY ("category_id") REFERENCES "works_categories"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "works_offering_packaging_formats" ADD CONSTRAINT "works_offering_packaging_formats_offering_id_fkey" FOREIGN KEY ("offering_id") REFERENCES "works_offerings"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "works_offering_packaging_formats" ADD CONSTRAINT "works_offering_packaging_formats_packaging_format_id_fkey" FOREIGN KEY ("packaging_format_id") REFERENCES "works_packaging_formats"("id") ON DELETE CASCADE ON UPDATE CASCADE;
