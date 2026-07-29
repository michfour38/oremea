-- CreateEnum
CREATE TYPE "WorksRouteStatus" AS ENUM ('VIABLE', 'POTENTIAL', 'INCOMPLETE');

-- CreateTable
CREATE TABLE "works_route_options" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "brief_id" UUID NOT NULL,
    "path_id" UUID NOT NULL,
    "rank" INTEGER NOT NULL,
    "status" "WorksRouteStatus" NOT NULL,
    "route_score" INTEGER NOT NULL DEFAULT 0,
    "provider_count" INTEGER NOT NULL DEFAULT 0,
    "handoff_count" INTEGER NOT NULL DEFAULT 0,
    "assigned_step_count" INTEGER NOT NULL DEFAULT 0,
    "unresolved_step_count" INTEGER NOT NULL DEFAULT 0,
    "unresolved_requirement_count" INTEGER NOT NULL DEFAULT 0,
    "algorithm_version" TEXT NOT NULL DEFAULT 'v1',
    "is_current" BOOLEAN NOT NULL DEFAULT true,
    "calculated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "works_route_options_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "works_route_assignments" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "route_id" UUID NOT NULL,
    "step_id" UUID NOT NULL,
    "match_id" UUID,
    "offering_id" UUID,
    "position" INTEGER NOT NULL,
    "status" "WorksMatchStatus" NOT NULL DEFAULT 'UNKNOWN',
    "explanation" TEXT NOT NULL,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "works_route_assignments_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "works_route_options_brief_id_is_current_rank_idx" ON "works_route_options"("brief_id", "is_current", "rank");
CREATE INDEX "works_route_options_brief_id_status_idx" ON "works_route_options"("brief_id", "status");
CREATE INDEX "works_route_options_path_id_idx" ON "works_route_options"("path_id");
CREATE INDEX "works_route_options_route_score_idx" ON "works_route_options"("route_score");
CREATE UNIQUE INDEX "works_route_assignments_route_id_step_id_key" ON "works_route_assignments"("route_id", "step_id");
CREATE INDEX "works_route_assignments_route_id_position_idx" ON "works_route_assignments"("route_id", "position");
CREATE INDEX "works_route_assignments_step_id_idx" ON "works_route_assignments"("step_id");
CREATE INDEX "works_route_assignments_match_id_idx" ON "works_route_assignments"("match_id");
CREATE INDEX "works_route_assignments_offering_id_idx" ON "works_route_assignments"("offering_id");
CREATE INDEX "works_route_assignments_status_idx" ON "works_route_assignments"("status");

-- AddForeignKey
ALTER TABLE "works_route_options" ADD CONSTRAINT "works_route_options_brief_id_fkey" FOREIGN KEY ("brief_id") REFERENCES "works_product_briefs"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "works_route_options" ADD CONSTRAINT "works_route_options_path_id_fkey" FOREIGN KEY ("path_id") REFERENCES "works_production_paths"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "works_route_assignments" ADD CONSTRAINT "works_route_assignments_route_id_fkey" FOREIGN KEY ("route_id") REFERENCES "works_route_options"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "works_route_assignments" ADD CONSTRAINT "works_route_assignments_step_id_fkey" FOREIGN KEY ("step_id") REFERENCES "works_production_steps"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "works_route_assignments" ADD CONSTRAINT "works_route_assignments_match_id_fkey" FOREIGN KEY ("match_id") REFERENCES "works_matches"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "works_route_assignments" ADD CONSTRAINT "works_route_assignments_offering_id_fkey" FOREIGN KEY ("offering_id") REFERENCES "works_offerings"("id") ON DELETE SET NULL ON UPDATE CASCADE;
