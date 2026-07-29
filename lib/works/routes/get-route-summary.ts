import { WorksMatchStatus, WorksRequirementPriority, WorksRouteStatus } from "@prisma/client";

import { prisma } from "@/lib/prisma";
import { buildBridgeQuestions } from "@/lib/works/questions/build-bridge-questions";

const QUANTITY_RELEVANT_ROUTE_SERVICES = new Set([
  "MANUFACTURING",
  "PACKAGING",
  "PRINTING",
  "LABELLING",
  "RAW_MATERIAL_SOURCING",
]);

function routeLabel(status: WorksRouteStatus) {
  switch (status) {
    case WorksRouteStatus.VIABLE:
      return "Recommended production route";
    case WorksRouteStatus.POTENTIAL:
      return "Potential production route";
    case WorksRouteStatus.INCOMPLETE:
      return "Production route with gaps";
  }
}

function jsonString(value: unknown) {
  return typeof value === "string" ? value : null;
}

function jsonNumber(value: unknown) {
  return typeof value === "number" && Number.isFinite(value) ? value : null;
}

function quantityActual(value: unknown) {
  if (!value || typeof value !== "object" || Array.isArray(value)) return null;
  const record = value as Record<string, unknown>;
  const quantity = jsonNumber(record.value);
  const unit = jsonString(record.unit);
  return quantity != null && unit ? { value: quantity, unit } : null;
}

export async function getRouteSummary(briefId: string, rank = 1) {
  const route = await prisma.works_route_options.findFirst({
    where: {
      brief_id: briefId,
      rank,
      is_current: true,
    },
    include: {
      brief: {
        select: {
          product_type: true,
          target_quantity: true,
          quantity_unit: true,
          requested_services: true,
          requirements: {
            select: {
              field: true,
              value: true,
              priority: true,
              requirement_type: true,
            },
          },
        },
      },
      assignments: {
        orderBy: { position: "asc" },
        include: {
          step: {
            include: { service: { select: { key: true } } },
          },
          offering: {
            include: {
              provider_market: {
                include: {
                  provider: {
                    select: { id: true, name: true, slug: true },
                  },
                },
              },
            },
          },
          match: {
            include: {
              outcomes: {
                where: {
                  hard_constraint: true,
                  status: WorksMatchStatus.UNKNOWN,
                },
                include: {
                  requirement: {
                    include: {
                      applies_to_service: { select: { key: true } },
                    },
                  },
                  source_claim: {
                    select: {
                      field: true,
                      display_value: true,
                      status: true,
                    },
                  },
                },
              },
            },
          },
        },
      },
    },
  });

  if (!route) return null;

  const providerGroups = new Map<
    string,
    {
      id: string;
      name: string;
      slug: string;
      steps: string[];
      offerings: Set<string>;
    }
  >();

  const sequence = route.assignments.map((assignment) => {
    const provider = assignment.offering?.provider_market.provider;

    if (provider && assignment.offering) {
      const current = providerGroups.get(provider.id) ?? {
        id: provider.id,
        name: provider.name,
        slug: provider.slug,
        steps: [],
        offerings: new Set<string>(),
      };
      current.steps.push(assignment.step.title);
      current.offerings.add(assignment.offering.name);
      providerGroups.set(provider.id, current);
    }

    return {
      position: assignment.position,
      step: assignment.step.title,
      serviceKey: assignment.step.service?.key ?? null,
      status: assignment.status,
      provider: provider
        ? { name: provider.name, slug: provider.slug }
        : null,
      offering: assignment.offering?.name ?? null,
      explanation: assignment.explanation,
    };
  });

  const unresolved = new Map<
    string,
    {
      key: string;
      provider: string | null;
      step: string;
      field: string | null;
      message: string;
      expectedValue: unknown;
      actualValue: unknown;
    }
  >();

  for (const assignment of route.assignments) {
    if (!assignment.match) continue;

    const serviceKey = assignment.step.service?.key ?? null;
    const providerName =
      assignment.offering?.provider_market.provider.name ?? null;

    for (const outcome of assignment.match.outcomes) {
      const scopedService = outcome.requirement?.applies_to_service?.key;
      const applies = scopedService
        ? scopedService === serviceKey
        : outcome.criterion_type === "QUANTITY"
          ? Boolean(
              serviceKey &&
                QUANTITY_RELEVANT_ROUTE_SERVICES.has(serviceKey)
            )
          : true;

      if (!applies) continue;

      const key = `${assignment.match.id}:${outcome.criterion_type}:${outcome.criterion_key}`;
      if (unresolved.has(key)) continue;

      unresolved.set(key, {
        key,
        provider: providerName,
        step: assignment.step.title,
        field: outcome.requirement?.field ?? null,
        message:
          outcome.requirement?.display_value ?? outcome.explanation,
        expectedValue: outcome.expected_value,
        actualValue: outcome.actual_value,
      });
    }
  }

  const gaps = route.assignments
    .filter((assignment) => !assignment.offering)
    .map((assignment) => ({
      step: assignment.step.title,
      serviceKey: assignment.step.service?.key ?? null,
      message: assignment.explanation,
    }));

  const packagingFormat = jsonString(
    route.brief.requirements.find((item) => item.field === "packaging.format")?.value
  );
  const fillVolumeMl = jsonNumber(
    route.brief.requirements.find(
      (item) => item.field === "packaging.fill_volume_ml"
    )?.value
  );
  const fillWeightG = jsonNumber(
    route.brief.requirements.find(
      (item) => item.field === "packaging.fill_weight_g"
    )?.value
  );
  const halaalRequired = route.brief.requirements.some(
    (item) =>
      item.priority === WorksRequirementPriority.REQUIRED &&
      item.field.startsWith("credential.HALAAL")
  );
  const halaalAuthorityRequirement = jsonString(
    route.brief.requirements.find(
      (item) => item.field === "credential.HALAAL.authority_requirement"
    )?.value
  );
  const halaalLogoRequirement = route.brief.requirements.find(
    (item) => item.field === "credential.HALAAL.logo_required"
  )?.value;

  const manufacturingAssignment = route.assignments.find(
    (assignment) => assignment.step.service?.key === "MANUFACTURING"
  );
  const quantityOutcome = manufacturingAssignment?.match?.outcomes.find(
    (outcome) => outcome.criterion_type === "QUANTITY"
  );
  const providerMinimum = quantityActual(quantityOutcome?.actual_value);

  const nextQuestions = buildBridgeQuestions({
    productType: route.brief.product_type,
    targetQuantity:
      route.brief.target_quantity == null
        ? null
        : Number(route.brief.target_quantity),
    quantityUnit: route.brief.quantity_unit,
    packagingFormat,
    providerName:
      manufacturingAssignment?.offering?.provider_market.provider.name ?? null,
    providerMinimumValue: providerMinimum?.value ?? null,
    providerMinimumUnit: providerMinimum?.unit ?? null,
    fillVolumeMl,
    fillWeightG,
    halaalRequired,
    halaalAuthorityPreferenceKnown:
      Boolean(halaalAuthorityRequirement) &&
      halaalAuthorityRequirement !== "UNSURE",
    halaalLogoPreferenceKnown: typeof halaalLogoRequirement === "boolean",
    printingNeeded:
      route.brief.requested_services.includes("PRINTING") ||
      route.assignments.some(
        (assignment) => assignment.step.service?.key === "PRINTING"
      ),
  });

  return {
    id: route.id,
    rank: route.rank,
    status: route.status,
    label: routeLabel(route.status),
    providerCount: route.provider_count,
    handoffCount: route.handoff_count,
    unresolvedStepCount: route.unresolved_step_count,
    unresolvedRequirementCount: route.unresolved_requirement_count,
    sequence,
    providers: [...providerGroups.values()].map((provider) => ({
      ...provider,
      offerings: [...provider.offerings],
    })),
    unresolved: [...unresolved.values()],
    nextQuestions,
    gaps,
  };
}
