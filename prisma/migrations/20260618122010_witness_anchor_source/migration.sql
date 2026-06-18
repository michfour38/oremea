-- CreateTable
CREATE TABLE "harmonize_witness_anchors" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "cycle_id" UUID NOT NULL,
    "entry_id" UUID,
    "anchor_type" TEXT NOT NULL,
    "anchor_name" TEXT NOT NULL,
    "confidence" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "behavioral_markers" JSONB NOT NULL DEFAULT '[]',
    "evidence" JSONB NOT NULL DEFAULT '[]',
    "strength" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "source" TEXT NOT NULL DEFAULT 'entry',
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "harmonize_witness_anchors_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "harmonize_anchor_relationships" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "source_anchor_id" UUID NOT NULL,
    "target_anchor_id" UUID NOT NULL,
    "relationship_type" TEXT NOT NULL,
    "reason" TEXT,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "harmonize_anchor_relationships_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "harmonize_witness_anchors_cycle_id_idx" ON "harmonize_witness_anchors"("cycle_id");

-- CreateIndex
CREATE INDEX "harmonize_witness_anchors_entry_id_idx" ON "harmonize_witness_anchors"("entry_id");

-- CreateIndex
CREATE INDEX "harmonize_witness_anchors_anchor_type_idx" ON "harmonize_witness_anchors"("anchor_type");

-- CreateIndex
CREATE INDEX "harmonize_witness_anchors_source_idx" ON "harmonize_witness_anchors"("source");

-- CreateIndex
CREATE INDEX "harmonize_witness_anchors_strength_idx" ON "harmonize_witness_anchors"("strength");

-- CreateIndex
CREATE INDEX "harmonize_anchor_relationships_source_anchor_id_idx" ON "harmonize_anchor_relationships"("source_anchor_id");

-- CreateIndex
CREATE INDEX "harmonize_anchor_relationships_target_anchor_id_idx" ON "harmonize_anchor_relationships"("target_anchor_id");

-- CreateIndex
CREATE INDEX "harmonize_anchor_relationships_relationship_type_idx" ON "harmonize_anchor_relationships"("relationship_type");

-- AddForeignKey
ALTER TABLE "harmonize_witness_anchors" ADD CONSTRAINT "harmonize_witness_anchors_cycle_id_fkey" FOREIGN KEY ("cycle_id") REFERENCES "harmonize_cycles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "harmonize_witness_anchors" ADD CONSTRAINT "harmonize_witness_anchors_entry_id_fkey" FOREIGN KEY ("entry_id") REFERENCES "harmonize_entries"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "harmonize_anchor_relationships" ADD CONSTRAINT "harmonize_anchor_relationships_source_anchor_id_fkey" FOREIGN KEY ("source_anchor_id") REFERENCES "harmonize_witness_anchors"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "harmonize_anchor_relationships" ADD CONSTRAINT "harmonize_anchor_relationships_target_anchor_id_fkey" FOREIGN KEY ("target_anchor_id") REFERENCES "harmonize_witness_anchors"("id") ON DELETE CASCADE ON UPDATE CASCADE;
