CREATE TABLE "current_launch_state" (
    "id" TEXT NOT NULL,
    "launched_at" TIMESTAMPTZ(6),
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "current_launch_state_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "current_qualifications" (
    "user_id" TEXT NOT NULL,
    "source_product" TEXT NOT NULL,
    "source_instance_id" TEXT NOT NULL,
    "trigger_key" TEXT NOT NULL,
    "qualified_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "invited_at" TIMESTAMPTZ(6),

    CONSTRAINT "current_qualifications_pkey" PRIMARY KEY ("user_id")
);

CREATE INDEX "current_qualifications_qualified_at_idx"
ON "current_qualifications"("qualified_at");

CREATE INDEX "current_qualifications_invited_at_idx"
ON "current_qualifications"("invited_at");
