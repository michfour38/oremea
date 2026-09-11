CREATE TABLE "resonance_visit_orders" (
  "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "user_id" TEXT NOT NULL,
  "buyer_email" TEXT NOT NULL,
  "kind" TEXT NOT NULL CHECK ("kind" IN ('initial', 'completion', 'smaller')),
  "quantity" INTEGER NOT NULL CHECK ("quantity" BETWEEN 1 AND 10),
  "amount_cents" INTEGER NOT NULL CHECK ("amount_cents" > 0),
  "remaining_quantity" INTEGER NOT NULL DEFAULT 0,
  "status" TEXT NOT NULL DEFAULT 'created'
    CHECK ("status" IN ('created', 'pending', 'paid', 'failed', 'unknown', 'refunded')),
  "parent_id" UUID REFERENCES "resonance_visit_orders"("id"),
  "offer_closed_at" TIMESTAMPTZ(6),
  "whop_plan_id" TEXT NOT NULL,
  "whop_checkout_id" TEXT,
  "whop_payment_id" TEXT,
  "whop_member_id" TEXT,
  "whop_payment_method_id" TEXT,
  "paid_at" TIMESTAMPTZ(6),
  "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CHECK ("remaining_quantity" BETWEEN 0 AND "quantity"),
  CHECK ("status" = 'paid' OR "remaining_quantity" = 0),
  CHECK (("kind" = 'initial') = ("parent_id" IS NULL))
);
CREATE UNIQUE INDEX "resonance_visit_orders_parent_id_key" ON "resonance_visit_orders"("parent_id");
CREATE UNIQUE INDEX "resonance_visit_orders_whop_checkout_id_key" ON "resonance_visit_orders"("whop_checkout_id");
CREATE UNIQUE INDEX "resonance_visit_orders_whop_payment_id_key" ON "resonance_visit_orders"("whop_payment_id");
CREATE INDEX "resonance_visit_orders_user_id_status_created_at_idx" ON "resonance_visit_orders"("user_id", "status", "created_at");

CREATE TABLE "resonance_visit_redemptions" (
  "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "user_id" TEXT NOT NULL,
  "order_id" UUID NOT NULL REFERENCES "resonance_visit_orders"("id"),
  "run_id" UUID NOT NULL REFERENCES "resonance_week_runs"("id"),
  "request_id" UUID NOT NULL,
  "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE UNIQUE INDEX "resonance_visit_redemptions_run_id_key" ON "resonance_visit_redemptions"("run_id");
CREATE UNIQUE INDEX "resonance_visit_redemptions_request_id_key" ON "resonance_visit_redemptions"("request_id");
CREATE INDEX "resonance_visit_redemptions_order_id_idx" ON "resonance_visit_redemptions"("order_id");
CREATE INDEX "resonance_visit_redemptions_user_id_idx" ON "resonance_visit_redemptions"("user_id");
