CREATE TABLE "works_provider_public_settings" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "provider_id" UUID NOT NULL,
    "show_legal_name" BOOLEAN NOT NULL DEFAULT false,
    "show_website" BOOLEAN NOT NULL DEFAULT true,
    "show_email" BOOLEAN NOT NULL DEFAULT false,
    "show_phone" BOOLEAN NOT NULL DEFAULT false,
    "show_description" BOOLEAN NOT NULL DEFAULT true,
    "show_location" BOOLEAN NOT NULL DEFAULT false,
    "show_capacity" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "works_provider_public_settings_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "works_provider_public_settings_provider_id_key"
ON "works_provider_public_settings"("provider_id");

CREATE INDEX "works_provider_public_settings_provider_id_idx"
ON "works_provider_public_settings"("provider_id");

ALTER TABLE "works_provider_public_settings"
ADD CONSTRAINT "works_provider_public_settings_provider_id_fkey"
FOREIGN KEY ("provider_id") REFERENCES "works_providers"("id") ON DELETE CASCADE ON UPDATE CASCADE;