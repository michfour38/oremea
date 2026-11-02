-- Additive only: partner memberships cannot overwrite direct product entitlements.
CREATE TABLE "oremea_partner_memberships" (
  "id" UUID NOT NULL DEFAULT gen_random_uuid(),
  "whop_membership_id" TEXT NOT NULL,
  "whop_product_id" TEXT NOT NULL,
  "whop_plan_id" TEXT NOT NULL,
  "user_id" TEXT NOT NULL,
  "partner_slug" TEXT NOT NULL,
  "offer_key" TEXT NOT NULL,
  "product_keys" TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
  "status" TEXT NOT NULL DEFAULT 'inactive',
  "last_event_at" TIMESTAMPTZ(6) NOT NULL,
  "period_end" TIMESTAMPTZ(6),
  "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMPTZ(6) NOT NULL,
  CONSTRAINT "oremea_partner_memberships_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "oremea_partner_memberships_whop_membership_id_key"
  ON "oremea_partner_memberships"("whop_membership_id");
CREATE INDEX "oremea_partner_memberships_user_id_status_period_end_idx"
  ON "oremea_partner_memberships"("user_id", "status", "period_end");
CREATE INDEX "oremea_partner_memberships_partner_slug_offer_key_idx"
  ON "oremea_partner_memberships"("partner_slug", "offer_key");
CREATE INDEX "oremea_partner_memberships_whop_product_id_whop_plan_id_idx"
  ON "oremea_partner_memberships"("whop_product_id", "whop_plan_id");
