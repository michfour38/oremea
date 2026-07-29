import {
  WorksRequirementPriority,
  type Prisma,
} from "@prisma/client";
import { NextRequest, NextResponse } from "next/server";

import { prisma } from "@/lib/prisma";
import {
  createProductBrief,
  type CreateProductBriefRequirement,
} from "@/lib/works/briefs/create-product-brief";
import { recalculateProductBrief } from "@/lib/works/briefs/recalculate-product-brief";

const STRING_ARRAY_LIMIT = 20;

function stringValue(value: unknown) {
  return typeof value === "string" ? value.trim() : "";
}

function optionalString(value: unknown) {
  const cleaned = stringValue(value);
  return cleaned || undefined;
}

function stringArray(value: unknown) {
  if (!Array.isArray(value)) return [];
  return value
    .filter((item): item is string => typeof item === "string")
    .map((item) => item.trim())
    .filter(Boolean)
    .slice(0, STRING_ARRAY_LIMIT);
}

function positiveNumber(value: unknown) {
  const parsed = typeof value === "number" ? value : Number(value);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : undefined;
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    const marketSlug = stringValue(body?.marketSlug).toLowerCase();
    const searchSessionId = optionalString(body?.searchSessionId);
    const productDescription = stringValue(body?.productDescription);
    const categoryKey = optionalString(body?.categoryKey)?.toUpperCase();
    const stage = optionalString(body?.stage)?.toUpperCase();
    const targetQuantity = positiveNumber(body?.targetQuantity);
    const quantityUnit = optionalString(body?.quantityUnit)?.toUpperCase();
    const packagingFormat = optionalString(body?.packagingFormat)?.toUpperCase();
    const locationPreference = optionalString(body?.locationPreference)?.toUpperCase();
    const administrativeArea = optionalString(body?.administrativeArea);
    const contactEmail = optionalString(body?.contactEmail)?.toLowerCase();
    const existingAssets = stringArray(body?.existingAssets).map((value) =>
      value.toUpperCase()
    );
    const requestedServiceKeys = stringArray(body?.requestedServiceKeys).map(
      (value) => value.toUpperCase()
    );
    const halaalRequired = body?.halaalRequired === true;

    if (!marketSlug) {
      return NextResponse.json({ error: "Market is required." }, { status: 400 });
    }

    if (searchSessionId) {
      const searchSession = await prisma.works_search_sessions.findUnique({
        where: { id: searchSessionId },
        select: { market: { select: { slug: true } } },
      });

      if (!searchSession || searchSession.market.slug !== marketSlug) {
        return NextResponse.json(
          { error: "This WORKS search does not belong to the selected market." },
          { status: 400 }
        );
      }
    }

    if (productDescription.length < 3) {
      return NextResponse.json(
        { error: "Tell WORKS what you are trying to make." },
        { status: 400 }
      );
    }

    if (!categoryKey) {
      return NextResponse.json(
        { error: "Choose the closest product category." },
        { status: 400 }
      );
    }

    if (!stage) {
      return NextResponse.json(
        { error: "Choose where the product is currently." },
        { status: 400 }
      );
    }

    if (targetQuantity == null || !quantityUnit) {
      return NextResponse.json(
        { error: "Add a target production quantity." },
        { status: 400 }
      );
    }

    const requirements: CreateProductBriefRequirement[] = [];

    if (packagingFormat && packagingFormat !== "UNSURE") {
      requirements.push({
        requirementType: "PACKAGING",
        field: "packaging.format",
        value: packagingFormat as Prisma.InputJsonValue,
        displayValue: `${packagingFormat.replaceAll("_", " ").toLowerCase()} packaging is required.`,
        priority: WorksRequirementPriority.REQUIRED,
        appliesToServiceKey: "PACKAGING_SUPPLY",
      });

      if (
        packagingFormat === "BOTTLE" &&
        requestedServiceKeys.includes("PACKAGING")
      ) {
        requirements.push({
          requirementType: "CAPABILITY",
          field: "capability.BOTTLING",
          value: "BOTTLING",
          displayValue: "The production route must support bottling.",
          priority: WorksRequirementPriority.REQUIRED,
          appliesToServiceKey: "PACKAGING",
        });
      }
    }

    if (halaalRequired) {
      requirements.push({
        requirementType: "CERTIFICATION",
        field: "credential.HALAAL",
        value: "HALAAL",
        displayValue: "Halaal certification is required for manufacturing.",
        priority: WorksRequirementPriority.REQUIRED,
        appliesToServiceKey: "MANUFACTURING",
      });
    }

    const brief = await createProductBrief({
      marketSlug,
      categoryKey,
      productDescription,
      productType: productDescription.slice(0, 120),
      stage: stage as never,
      targetQuantity,
      quantityUnit: quantityUnit as never,
      locationPreference: locationPreference as never,
      administrativeArea,
      contactEmail,
      existingAssets: existingAssets as never,
      requestedServiceKeys,
      requirements,
    });

    const result = await recalculateProductBrief(brief.id);

    if (searchSessionId) {
      await prisma.works_search_sessions.update({
        where: { id: searchSessionId },
        data: {
          brief_id: brief.id,
          current_step: null,
          status: "ROUTE_BUILT",
        },
      });
    }

    return NextResponse.json({
      briefId: brief.id,
      route: result.route,
      routeError: result.routeError,
    });
  } catch (error) {
    console.error("WORKS brief intake failed:", error);

    const message =
      error instanceof Error ? error.message : "WORKS could not create this brief.";

    return NextResponse.json({ error: message }, { status: 500 });
  }
}
