CREATE TABLE "works_provider_payfast_subscriptions" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "provider_id" UUID NOT NULL,
    "plan" "WorksProviderPlan" NOT NULL,
    "merchant_payment_id" VARCHAR(100) NOT NULL,
    "subscription_token" VARCHAR(64),
    "status" VARCHAR(24) NOT NULL DEFAULT 'PENDING',
    "amount_cents" INTEGER NOT NULL,
    "currency" VARCHAR(3) NOT NULL DEFAULT 'ZAR',
    "started_at" TIMESTAMPTZ(6),
    "cancelled_at" TIMESTAMPTZ(6),
    "last_payment_at" TIMESTAMPTZ(6),
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "works_provider_payfast_subscriptions_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "works_provider_payfast_events" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "subscription_id" UUID NOT NULL,
    "event_key" VARCHAR(64) NOT NULL,
    "payfast_payment_id" VARCHAR(100),
    "payment_status" VARCHAR(40) NOT NULL,
    "amount_cents" INTEGER,
    "received_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "works_provider_payfast_events_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "works_provider_payfast_subscriptions_merchant_payment_id_key"
ON "works_provider_payfast_subscriptions"("merchant_payment_id");
CREATE UNIQUE INDEX "works_provider_payfast_subscriptions_subscription_token_key"
ON "works_provider_payfast_subscriptions"("subscription_token");
CREATE INDEX "works_provider_payfast_subscriptions_provider_id_status_idx"
ON "works_provider_payfast_subscriptions"("provider_id", "status");
CREATE INDEX "works_provider_payfast_subscriptions_plan_idx"
ON "works_provider_payfast_subscriptions"("plan");

CREATE UNIQUE INDEX "works_provider_payfast_events_event_key_key"
ON "works_provider_payfast_events"("event_key");
CREATE UNIQUE INDEX "works_provider_payfast_events_payfast_payment_id_key"
ON "works_provider_payfast_events"("payfast_payment_id");
CREATE INDEX "works_provider_payfast_events_subscription_id_received_at_idx"
ON "works_provider_payfast_events"("subscription_id", "received_at");
CREATE INDEX "works_provider_payfast_events_payment_status_idx"
ON "works_provider_payfast_events"("payment_status");

ALTER TABLE "works_provider_payfast_subscriptions"
ADD CONSTRAINT "works_provider_payfast_subscriptions_provider_id_fkey"
FOREIGN KEY ("provider_id") REFERENCES "works_providers"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "works_provider_payfast_events"
ADD CONSTRAINT "works_provider_payfast_events_subscription_id_fkey"
FOREIGN KEY ("subscription_id") REFERENCES "works_provider_payfast_subscriptions"("id") ON DELETE CASCADE ON UPDATE CASCADE;
