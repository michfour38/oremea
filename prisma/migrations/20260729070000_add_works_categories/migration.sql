-- CreateTable
CREATE TABLE "works_categories" (
  "id" UUID NOT NULL DEFAULT gen_random_uuid(),
  "key" TEXT NOT NULL,
  "slug" TEXT NOT NULL,
  "active" BOOLEAN NOT NULL DEFAULT true,
  "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT "works_categories_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "works_category_translations" (
  "id" UUID NOT NULL DEFAULT gen_random_uuid(),
  "category_id" UUID NOT NULL,
  "locale_id" UUID NOT NULL,
  "name" TEXT NOT NULL,
  "description" TEXT,
  "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT "works_category_translations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "works_market_categories" (
  "id" UUID NOT NULL DEFAULT gen_random_uuid(),
  "market_id" UUID NOT NULL,
  "category_id" UUID NOT NULL,
  "enabled" BOOLEAN NOT NULL DEFAULT true,
  "sort_order" INTEGER NOT NULL DEFAULT 0,
  "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT "works_market_categories_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "works_categories_key_key" ON "works_categories"("key");

-- CreateIndex
CREATE UNIQUE INDEX "works_categories_slug_key" ON "works_categories"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "works_category_translations_category_id_locale_id_key"
ON "works_category_translations"("category_id", "locale_id");

-- CreateIndex
CREATE INDEX "works_category_translations_category_id_idx"
ON "works_category_translations"("category_id");

-- CreateIndex
CREATE INDEX "works_category_translations_locale_id_idx"
ON "works_category_translations"("locale_id");

-- CreateIndex
CREATE UNIQUE INDEX "works_market_categories_market_id_category_id_key"
ON "works_market_categories"("market_id", "category_id");

-- CreateIndex
CREATE INDEX "works_market_categories_market_id_enabled_sort_order_idx"
ON "works_market_categories"("market_id", "enabled", "sort_order");

-- CreateIndex
CREATE INDEX "works_market_categories_category_id_idx"
ON "works_market_categories"("category_id");

-- AddForeignKey
ALTER TABLE "works_category_translations"
ADD CONSTRAINT "works_category_translations_category_id_fkey"
FOREIGN KEY ("category_id") REFERENCES "works_categories"("id")
ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "works_category_translations"
ADD CONSTRAINT "works_category_translations_locale_id_fkey"
FOREIGN KEY ("locale_id") REFERENCES "works_locales"("id")
ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "works_market_categories"
ADD CONSTRAINT "works_market_categories_market_id_fkey"
FOREIGN KEY ("market_id") REFERENCES "works_markets"("id")
ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "works_market_categories"
ADD CONSTRAINT "works_market_categories_category_id_fkey"
FOREIGN KEY ("category_id") REFERENCES "works_categories"("id")
ON DELETE CASCADE ON UPDATE CASCADE;
