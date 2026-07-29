import {
  Prisma,
  WorksProductionStepSource,
  WorksRequirementPriority,
} from "@prisma/client";

import { prisma } from "@/lib/prisma";
import {
  isWorksExistingAsset,
  isWorksLocationPreference,
  isWorksProductStage,
  type WorksExistingAsset,
  type WorksLocationPreference,
  type WorksProductStage,
} from "@/lib/works/briefs/constants";
import {
  isWorksQuantityUnit,
  type WorksQuantityUnit,
} from "@/lib/works/offerings/constants";
import { buildProductionPath } from "@/lib/works/paths/build-production-path";

export type CreateProductBriefRequirement = {
  requirementType: string;
  field: string;
  value: Prisma.InputJsonValue;
  displayValue?: string;
  priority?: WorksRequirementPriority;
};

export type CreateProductBriefInput = {
  marketSlug: string;
  categoryKey?: string;
  productDescription: string;
  productType?: string;
  stage?: WorksProductStage;
  targetQuantity?: number;
  quantityUnit?: WorksQuantityUnit;
  locationPreference?: WorksLocationPreference;
  administrativeArea?: string;
  timelineDate?: Date;
  contactEmail?: string;
  existingAssets?: WorksExistingAsset[];
  requestedServiceKeys?: string[];
  requirements?: CreateProductBriefRequirement[];
};

export async function createProductBrief(input: CreateProductBriefInput) {
  if (!input.productDescription.trim()) {
    throw new Error("A product description is required.");
  }

  if (input.stage && !isWorksProductStage(input.stage)) {
    throw new Error(`Unsupported WORKS product stage: ${input.stage}`);
  }

  if (input.quantityUnit && !isWorksQuantityUnit(input.quantityUnit)) {
    throw new Error(`Unsupported WORKS quantity unit: ${input.quantityUnit}`);
  }

  if (
    input.locationPreference &&
    !isWorksLocationPreference(input.locationPreference)
  ) {
    throw new Error(
      `Unsupported WORKS location preference: ${input.locationPreference}`
    );
  }

  for (const asset of input.existingAssets ?? []) {
    if (!isWorksExistingAsset(asset)) {
      throw new Error(`Unsupported WORKS existing asset: ${asset}`);
    }
  }

  const market = await prisma.works_markets.findUnique({
    where: { slug: input.marketSlug.toLowerCase() },
    select: { id: true, active: true },
  });

  if (!market?.active) {
    throw new Error(`WORKS market ${input.marketSlug} is not active.`);
  }

  const category = input.categoryKey
    ? await prisma.works_categories.findFirst({
        where: {
          key: input.categoryKey,
          active: true,
          markets: {
            some: {
              market_id: market.id,
              enabled: true,
            },
          },
        },
        select: { id: true },
      })
    : null;

  if (input.categoryKey && !category) {
    throw new Error(
      `WORKS category ${input.categoryKey} is not enabled for ${input.marketSlug}.`
    );
  }

  const requirements = input.requirements ?? [];
  const pathDefinition = buildProductionPath({
    stage: input.stage,
    existingAssets: input.existingAssets,
    requestedServiceKeys: input.requestedServiceKeys,
    requirements: requirements.map((requirement) => ({
      requirementType: requirement.requirementType,
      field: requirement.field,
      priority: requirement.priority ?? WorksRequirementPriority.REQUIRED,
    })),
  });

  const serviceKeys = Array.from(
    new Set(pathDefinition.map((step) => step.serviceKey))
  );
  const services = await prisma.works_services.findMany({
    where: { key: { in: serviceKeys }, active: true },
    select: { id: true, key: true },
  });
  const serviceIdByKey = new Map(
    services.map((service) => [service.key, service.id])
  );

  for (const serviceKey of serviceKeys) {
    if (!serviceIdByKey.has(serviceKey)) {
      throw new Error(`Missing WORKS service ${serviceKey} while building path.`);
    }
  }

  return prisma.$transaction(async (tx) => {
    const brief = await tx.works_product_briefs.create({
      data: {
        market_id: market.id,
        category_id: category?.id,
        product_description: input.productDescription.trim(),
        product_type: input.productType,
        stage: input.stage,
        target_quantity: input.targetQuantity,
        quantity_unit: input.quantityUnit,
        existing_assets: input.existingAssets ?? [],
        requested_services: input.requestedServiceKeys ?? [],
        location_preference: input.locationPreference,
        administrative_area: input.administrativeArea,
        timeline_date: input.timelineDate,
        contact_email: input.contactEmail,
        status: "ACTIVE",
        requirements: {
          create: requirements.map((requirement) => ({
            requirement_type: requirement.requirementType,
            field: requirement.field,
            value: requirement.value,
            display_value: requirement.displayValue,
            priority:
              requirement.priority ?? WorksRequirementPriority.REQUIRED,
          })),
        },
      },
      select: { id: true },
    });

    const path = await tx.works_production_paths.create({
      data: {
        brief_id: brief.id,
        version: 1,
        is_current: true,
      },
      select: { id: true },
    });

    if (pathDefinition.length > 0) {
      await tx.works_production_steps.createMany({
        data: pathDefinition.map((step, index) => ({
          path_id: path.id,
          service_id: serviceIdByKey.get(step.serviceKey),
          step_key: step.stepKey,
          title: step.title,
          position: index + 1,
          status: step.status,
          source: WorksProductionStepSource.SYSTEM_GENERATED,
          dependency_keys: step.dependencyKeys,
          notes: step.notes,
        })),
      });
    }

    return tx.works_product_briefs.findUniqueOrThrow({
      where: { id: brief.id },
      include: {
        category: { select: { key: true, slug: true } },
        requirements: { orderBy: { created_at: "asc" } },
        paths: {
          where: { is_current: true },
          include: {
            steps: {
              orderBy: { position: "asc" },
              include: { service: { select: { key: true, slug: true } } },
            },
          },
        },
      },
    });
  });
}
