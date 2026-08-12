CREATE TABLE "current_invitations" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "user_id" TEXT NOT NULL,
    "source_product" TEXT NOT NULL,
    "source_instance_id" TEXT NOT NULL,
    "trigger_key" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "checkout_started_at" TIMESTAMPTZ(6),
    "accepted_at" TIMESTAMPTZ(6),
    "declined_at" TIMESTAMPTZ(6),
    "resolved_at" TIMESTAMPTZ(6),
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "current_invitations_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "current_invitations_user_id_source_product_source_instance_id_key"
ON "current_invitations"("user_id", "source_product", "source_instance_id");

CREATE INDEX "current_invitations_user_id_status_idx"
ON "current_invitations"("user_id", "status");

CREATE INDEX "current_invitations_source_product_source_instance_id_idx"
ON "current_invitations"("source_product", "source_instance_id");
