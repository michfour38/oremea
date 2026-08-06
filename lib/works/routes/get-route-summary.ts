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

const FOUNDER_CHOICE_LABELS: Record<string, string> = {
  EXACT: "Exactly this quantity",
  APPROXIMATE: "Roughly this quantity",
  AT_LEAST: "At least this quantity",
  MAXIMUM: "This is my maximum",
  ANY_RECOGNISED_CURRENT_CERTIFICATION: "Any recognised current certification",
  SPECIFIC_AUTHORITY_REQUIRED: "A specific authority is required",
  UNSURE: "I am not sure yet",
};

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
  const quantity = jsonNumber(record.minimum) ?? jsonNumber(record.value);
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
                    select: { id: true, name: true, slug: true, email: true },
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
      hasEmail: boolean;
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
        hasEmail: Boolean(provider.email),
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

  const outreachRows = providerGroups.size > 0
    ? await prisma.works_provider_outreach.findMany({
        where: {
          brief_id: briefId,
          provider_id: { in: [...providerGroups.keys()] },
        },
        select: {
          provider_id: true,
          status: true,
          decision: true,
          sent_at: true,
          responded_at: true,
          moq_value: true,
          moq_unit: true,
          lead_time_text: true,
          capacity_date: true,
          pricing_notes: true,
          certification_notes: true,
          provider_notes: true,
        },
      })
    : [];
  const outreachByProvider = new Map(outreachRows.map((row) => [row.provider_id, row]));

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
  const quantityMinimum = jsonNumber(
    route.brief.requirements.find(
      (item) => item.field === "commercial.quantity.minimum"
    )?.value
  );
  const quantityPreferred = jsonNumber(
    route.brief.requirements.find(
      (item) => item.field === "commercial.quantity.preferred"
    )?.value
  );
  const quantityMaximum = jsonNumber(
    route.brief.requirements.find(
      (item) => item.field === "commercial.quantity.maximum"
    )?.value
  );
  const quantityFlexibility = jsonString(
    route.brief.requirements.find(
      (item) => item.field === "commercial.target_quantity_flexibility"
    )?.value
  );
  const halaalRequired = route.brief.requirements.some(
    (item) =>
      item.priority === WorksRequirementPriority.REQUIRED &&
      item.field === "credential.HALAAL"
  );
  const halaalAuthorityRequirement = jsonString(
    route.brief.requirements.find(
      (item) => item.field === "credential.HALAAL.authority_requirement"
    )?.value
  );
  const halaalSpecificAuthority = jsonString(
    route.brief.requirements.find(
      (item) => item.field === "credential.HALAAL.specific_authority"
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
  const halaalNeedsResolution = Boolean(
    manufacturingAssignment?.match?.outcomes.some((outcome) =>
      outcome.requirement?.field?.startsWith("credential.HALAAL")
    )
  );

  const nextQuestions = buildBridgeQuestions({
    productType: route.brief.product_type,
    targetQuantity:
      route.brief.target_quantity == null
        ? null
        : Number(route.brief.target_quantity),
    quantityMinimum,
    quantityPreferred,
    quantityMaximum,
    quantityUnit: route.brief.quantity_unit,
    quantityFlexibility,
    packagingFormat,
    providerName:
      manufacturingAssignment?.offering?.provider_market.provider.name ?? null,
    providerMinimumValue: providerMinimum?.value ?? null,
    providerMinimumUnit: providerMinimum?.unit ?? null,
    fillVolumeMl,
    fillWeightG,
    halaalRequired: halaalRequired && halaalNeedsResolution,
    halaalAuthorityRequirement,
    halaalSpecificAuthority,
    halaalLogoRequired:
      typeof halaalLogoRequirement === "boolean" ? halaalLogoRequirement : null,
    printingNeeded:
      route.brief.requested_services.includes("PRINTING") ||
      route.assignments.some(
        (assignment) => assignment.step.service?.key === "PRINTING"
      ),
  });

  const founderAnswers: Array<{
    key: string;
    kind: "CHOICE" | "NUMBER" | "TEXT" | "CONFIRMATION";
    prompt: string;
    answer: string;
    value: string | number | boolean;
    answerField: string;
    unit?: string;
    choices?: string[];
  }> = [];

  if (quantityFlexibility) {
    founderAnswers.push({
      key: "FOUNDER_QUANTITY_FLEXIBILITY",
      kind: "CHOICE",
      prompt: `How flexible is your target of ${route.brief.target_quantity ?? "the requested"} finished units?`,
      answer: FOUNDER_CHOICE_LABELS[quantityFlexibility] ?? quantityFlexibility,
      value: quantityFlexibility,
      answerField: "commercial.target_quantity_flexibility",
      choices: ["EXACT", "APPROXIMATE", "AT_LEAST", "MAXIMUM"],
    });
  }

  if (fillVolumeMl != null) {
    founderAnswers.push({
      key: "FOUNDER_TARGET_PACK_SIZE",
      kind: "NUMBER",
      prompt:
        packagingFormat === "BOTTLE"
          ? "How much product should each finished bottle contain?"
          : "What is the target fill size for each finished unit?",
      answer: `${fillVolumeMl} ml`,
      value: fillVolumeMl,
      answerField: "packaging.fill_volume_ml",
      unit: "ML",
    });
  }

  if (halaalAuthorityRequirement) {
    founderAnswers.push({
      key: "FOUNDER_HALAAL_AUTHORITY_REQUIREMENT",
      kind: "CHOICE",
      prompt:
        "Does your customer, retailer or export market require a particular Halaal certifying authority?",
      answer:
        FOUNDER_CHOICE_LABELS[halaalAuthorityRequirement] ??
        halaalAuthorityRequirement,
      value: halaalAuthorityRequirement,
      answerField: "credential.HALAAL.authority_requirement",
      choices: [
        "ANY_RECOGNISED_CURRENT_CERTIFICATION",
        "SPECIFIC_AUTHORITY_REQUIRED",
        "UNSURE",
      ],
    });
  }

  if (halaalSpecificAuthority) {
    founderAnswers.push({
      key: "FOUNDER_HALAAL_SPECIFIC_AUTHORITY",
      kind: "TEXT",
      prompt: "Which Halaal certifying authority or scheme is required?",
      answer: halaalSpecificAuthority,
      value: halaalSpecificAuthority,
      answerField: "credential.HALAAL.specific_authority",
    });
  }

  if (typeof halaalLogoRequirement === "boolean") {
    founderAnswers.push({
      key: "FOUNDER_HALAAL_MARK_ON_LABEL",
      kind: "CONFIRMATION",
      prompt: "Should the Halaal certification mark appear on the finished retail label?",
      answer: halaalLogoRequirement ? "Yes" : "No",
      value: halaalLogoRequirement,
      answerField: "credential.HALAAL.logo_required",
    });
  }

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
    providers: [...providerGroups.values()].map((provider) => {
      const outreach = outreachByProvider.get(provider.id);
      return {
        ...provider,
        offerings: [...provider.offerings],
        outreach: outreach
          ? {
              status: outreach.status,
              decision: outreach.decision,
              sentAt: outreach.sent_at?.toISOString() ?? null,
              respondedAt: outreach.responded_at?.toISOString() ?? null,
              moqValue: outreach.moq_value == null ? null : Number(outreach.moq_value),
              moqUnit: outreach.moq_unit,
              leadTime: outreach.lead_time_text,
              capacityDate: outreach.capacity_date?.toISOString().slice(0, 10) ?? null,
              pricingNotes: outreach.pricing_notes,
              certificationNotes: outreach.certification_notes,
              providerNotes: outreach.provider_notes,
            }
          : null,
      };
    }),
    unresolved: [...unresolved.values()],
    nextQuestions,
    founderAnswers,
    gaps,
  };
}
