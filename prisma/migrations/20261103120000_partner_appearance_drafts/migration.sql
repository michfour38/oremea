-- Additive: dedicated draft-only appearance settings and private uploaded imagery.
-- No existing subscriptions, product prices, content or user entitlements change.
CREATE TABLE "oremea_partner_appearances" (
 "partner_slug" TEXT NOT NULL PRIMARY KEY,
 "draft" JSONB NOT NULL,
 "revision" INTEGER NOT NULL DEFAULT 1,
 "updated_by" TEXT NOT NULL,
 "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
 "updated_at" TIMESTAMPTZ(6) NOT NULL
);
CREATE TABLE "oremea_partner_appearance_editors" (
 "id" TEXT NOT NULL PRIMARY KEY,
 "partner_slug" TEXT NOT NULL,
 "user_id" TEXT NOT NULL,
 "granted_by" TEXT NOT NULL,
 "revoked_at" TIMESTAMPTZ(6),
 "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
 "updated_at" TIMESTAMPTZ(6) NOT NULL
);
CREATE UNIQUE INDEX "oremea_partner_appearance_editors_partner_slug_user_id_key"
  ON "oremea_partner_appearance_editors"("partner_slug", "user_id");
CREATE INDEX "oremea_partner_appearance_editors_user_id_revoked_at_idx"
  ON "oremea_partner_appearance_editors"("user_id", "revoked_at");
CREATE TABLE "oremea_partner_appearance_assets" (
 "id" TEXT NOT NULL PRIMARY KEY,
 "partner_slug" TEXT NOT NULL,
 "filename" TEXT NOT NULL,
 "content_type" TEXT NOT NULL,
 "file_size" INTEGER NOT NULL,
 "sha256" TEXT NOT NULL,
 "file_bytes" BYTEA NOT NULL,
 "uploaded_by" TEXT NOT NULL,
 "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE UNIQUE INDEX "oremea_partner_appearance_assets_filename_key"
  ON "oremea_partner_appearance_assets"("filename");
CREATE INDEX "oremea_partner_appearance_assets_partner_slug_created_at_idx"
  ON "oremea_partner_appearance_assets"("partner_slug", "created_at");
