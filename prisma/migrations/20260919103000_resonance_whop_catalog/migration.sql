CREATE TABLE "resonance_whop_catalog" (
    "catalog_key" TEXT NOT NULL,
    "company_id" TEXT NOT NULL,
    "product_id" TEXT NOT NULL,
    "plans" JSONB NOT NULL DEFAULT '{}',
    "webhook_id" TEXT,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "resonance_whop_catalog_pkey" PRIMARY KEY ("catalog_key")
);

CREATE UNIQUE INDEX "resonance_whop_catalog_product_id_key"
ON "resonance_whop_catalog"("product_id");
