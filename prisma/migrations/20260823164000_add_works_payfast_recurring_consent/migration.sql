ALTER TABLE "works_provider_payfast_subscriptions"
  ADD COLUMN "recurring_consent_at" TIMESTAMPTZ(6),
  ADD COLUMN "recurring_consent_version" VARCHAR(40),
  ADD COLUMN "recurring_consent_summary" TEXT,
  ADD COLUMN "recurring_consent_user_id" VARCHAR(255);
