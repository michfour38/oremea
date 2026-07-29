import {
  WorksRequirementPriority,
  type Prisma,
} from "@prisma/client";
import { NextRequest, NextResponse } from "next/server";

import { recalculateProductBrief } from "@/lib/works/briefs/recalculate-product-brief";
import { upsertBriefRequirement } from "@/lib/works/briefs/upsert-brief-requirement";

type FieldConfig = {
  requirementType: string;
  priority: WorksRequirementPriority;
  appliesToServiceKey?: string;
};

const FOUNDER_FIELDS: Record<string, FieldConfig> = {
  "commercial.target_quantity_flexibility": {
    requirementType: "COMMERCIAL",
    priority: WorksRequirementPriority.OPTIONAL,
  },
  "packaging.fill_volume_ml": {
    requirementType: "SPECIFICATION",
    priority: WorksRequirementPriority.OPTIONAL,
    appliesToServiceKey: "PACKAGING",
  },
  "packaging.fill_size": {
    requirementType: "SPECIFICATION",
    priority: WorksRequirementPriority.OPTIONAL,
    appliesToServiceKey: "PACKAGING",
  },
  "credential.HALAAL.authority_requirement": {
    requirementType: "SPECIFICATION",
    priority: WorksRequirementPriority.OPTIONAL,
    appliesToServiceKey: "MANUFACTURING",
  },
  "credential.HALAAL.specific_authority": {
    requirementType: "CERTIFICATION",
    priority: WorksRequirementPriority.REQUIRED,
    appliesToServiceKey: "MANUFACTURING",
  },
  "credential.HALAAL.logo_required": {
    requirementType: "SPECIFICATION",
    priority: WorksRequirementPriority.OPTIONAL,
    appliesToServiceKey: "PRINTING",
  },
};

function cleanValue(field: string, value: unknown): Prisma.InputJsonValue | null {
  if (field === "packaging.fill_volume_ml" || field === "packaging.fill_size") {
    const parsed = typeof value === "number" ? value : Number(value);
    return Number.isFinite(parsed) && parsed > 0 ? parsed : null;
  }

  if (field === "credential.HALAAL.logo_required") {
    return typeof value === "boolean" ? value : null;
  }

  if (typeof value === "string") {
    const cleaned = value.trim();
    return cleaned ? cleaned : null;
  }

  return null;
}

export async function POST(
  req: NextRequest,
  { params }: { params: { briefId: string } }
) {
  try {
    const body = await req.json();
    const field = typeof body?.field === "string" ? body.field.trim() : "";
    const config = FOUNDER_FIELDS[field];

    if (!config) {
      return NextResponse.json(
        { error: "This WORKS question cannot be answered through the founder intake." },
        { status: 400 }
      );
    }

    const value = cleanValue(field, body?.value);
    if (value == null) {
      return NextResponse.json({ error: "Add an answer to continue." }, { status: 400 });
    }

    await upsertBriefRequirement({
      briefId: params.briefId,
      requirementType: config.requirementType,
      field,
      value,
      displayValue:
        typeof body?.displayValue === "string" ? body.displayValue.trim() : undefined,
      priority: config.priority,
      appliesToServiceKey: config.appliesToServiceKey,
    });

    const result = await recalculateProductBrief(params.briefId);

    return NextResponse.json({
      briefId: params.briefId,
      route: result.route,
      routeError: result.routeError,
    });
  } catch (error) {
    console.error("WORKS founder answer failed:", error);

    const message =
      error instanceof Error ? error.message : "WORKS could not save this answer.";

    return NextResponse.json({ error: message }, { status: 500 });
  }
}
