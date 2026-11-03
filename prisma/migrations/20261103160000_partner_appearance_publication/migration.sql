-- Additive approval gate. Does not alter original images, customer data or Whop.
CREATE TABLE "oremea_partner_appearance_publications" (
  "partner_slug" TEXT NOT NULL PRIMARY KEY,
  "snapshot" JSONB NOT NULL,
  "source_revision" INTEGER NOT NULL,
  "approval_version" INTEGER NOT NULL DEFAULT 1,
  "is_active" BOOLEAN NOT NULL DEFAULT false,
  "approved_by" TEXT NOT NULL,
  "approved_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMPTZ(6) NOT NULL
);
CREATE TABLE "oremea_partner_appearance_public_assets" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "partner_slug" TEXT NOT NULL,
  "filename" TEXT NOT NULL,
  "content_type" TEXT NOT NULL DEFAULT 'image/webp',
  "file_bytes" BYTEA NOT NULL,
  "file_size" INTEGER NOT NULL,
  "sha256" TEXT NOT NULL,
  "source_id" TEXT NOT NULL,
  "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE UNIQUE INDEX "oremea_partner_appearance_public_assets_partner_slug_filename_key"
  ON "oremea_partner_appearance_public_assets" ("partner_slug", "filename");
CREATE INDEX "oremea_partner_appearance_public_assets_partner_slug_created_at_idx"
  ON "oremea_partner_appearance_public_assets" ("partner_slug", "created_at");
CREATE TABLE "oremea_partner_appearance_approval_history" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "partner_slug" TEXT NOT NULL,
  "action" TEXT NOT NULL,
  "source_revision" INTEGER NOT NULL,
  "approval_version" INTEGER NOT NULL,
  "actor_id" TEXT NOT NULL,
  "snapshot" JSONB,
  "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX "oremea_partner_appearance_approval_history_partner_slug_created_at_idx"
  ON "oremea_partner_appearance_approval_history" ("partner_slug", "created_at");
