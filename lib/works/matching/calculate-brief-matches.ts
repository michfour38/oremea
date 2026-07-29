import {
  Prisma,
  WorksMatchStatus,
  WorksRequirementPriority,
} from "@prisma/client";

import { prisma } from "@/lib/prisma";
import {
  evaluateOfferingFit,
  type MatchClaim,
  type WorksMatchStatusValue,
} from "@/lib/works/matching/eligibility";
import { compareWorksMatches } from "@/lib/works/matching/ranking";

const ALGORITHM_VERSION = "v1";

function toMatchStatus(status: WorksMatchStatusValue): WorksMatchStatus {
  return WorksMatchStatus[status];
}

function toPriority(
  priority: "REQUIRED" | "PREFERRED" | "OPTIONAL" | undefined
): WorksRequirementPriority | undefined {
  return priority ? WorksRequirementPriority[priority] : undefined;
}

function toInputJson(value: unknown): Prisma.InputJsonValue | undefined {
  if (value === undefined) return undefined;
  return JSON.parse(JSON.stringify(value)) as Prisma.InputJsonValue;
}

export async function calculateBriefMatches(briefId: string) {
  const brief = await prisma.works_product_briefs.findUniqueOrThrow({
    where: { id: briefId },
    include: {
      category: { select: { key: true } },
      requirements: {
        include: {
          applies_to_service: { select: { key: true } },
        },
        orderBy: { created_at: "asc" },
      },
      paths: {
        where: { is_current: true },
        orderBy: { version: "desc" },
        take: 1,
        include: {
          steps: {
            include: { service: { select: { key: true } } },
            orderBy: { position: "asc" },
          },
        },
      },
    },
  });

  const path = brief.paths[0];
  if (!path) {
    throw new Error(`WORKS brief ${briefId} has no current production path.`);
  }

  const offerings = await prisma.works_offerings.findMany({
    where: {
      active: true,
      provider_market: {
        market_id: brief.market_id,
        active: true,
        provider: { profile_status: { not: "ARCHIVED" } },
      },
    },
    include: {
      categories: { include: { category: { select: { key: true } } } },
      services: { include: { service: { select: { key: true } } } },
      capabilities: { include: { capability: { select: { key: true } } } },
      packaging_formats: {
        include: { packaging_format: { select: { key: true } } },
      },
      provider_market: {
        include: {
          locations: {
            where: { active: true },
            select: { administrative_area: true },
          },
          provider: {
            select: {
              id: true,
              name: true,
              slug: true,
              claims: {
                where: { is_current: true },
                select: {
                  id: true,
                  offering_id: true,
                  field: true,
                  value: true,
                  status: true,
                  scope: true,
                  credential_detail: {
                    select: {
                      credential_name: true,
                      designation: true,
                      scope: true,
                    },
                  },
                },
              },
            },
          },
        },
      },
    },
    orderBy: { name: "asc" },
  });

  const normalizedBrief = {
    categoryKey: brief.category?.key,
    targetQuantity: brief.target_quantity == null ? null : Number(brief.target_quantity),
    quantityUnit: brief.quantity_unit,
    locationPreference: brief.location_preference,
    administrativeArea: brief.administrative_area,
    requirements: brief.requirements.map((requirement) => ({
      id: requirement.id,
      requirementType: requirement.requirement_type,
      field: requirement.field,
      value: requirement.value,
      priority: requirement.priority,
      appliesToServiceKey: requirement.applies_to_service?.key,
    })),
    steps: path.steps.map((step) => ({
      id: step.id,
      serviceKey: step.service?.key,
      title: step.title,
      status: step.status,
    })),
  };

  const evaluations = offerings.map((offering) => {
    const claims: MatchClaim[] = offering.provider_market.provider.claims
      .filter(
        (claim) => claim.offering_id == null || claim.offering_id === offering.id
      )
      .map((claim) => ({
        id: claim.id,
        field: claim.field,
        value: claim.value,
        status: claim.status as MatchClaim["status"],
        credentialName: claim.credential_detail?.credential_name,
        designation: claim.credential_detail?.designation,
        scope: claim.credential_detail?.scope ?? claim.scope,
      }));

    const result = evaluateOfferingFit(normalizedBrief, {
      categoryKeys: offering.categories.map((row) => row.category.key),
      serviceKeys: offering.services.map((row) => row.service.key),
      capabilityKeys: offering.capabilities.map((row) => row.capability.key),
      packagingFormatKeys: offering.packaging_formats.map(
        (row) => row.packaging_format.key
      ),
      moqValue: offering.moq_value == null ? null : Number(offering.moq_value),
      moqUnit: offering.moq_unit,
      maxRunValue:
        offering.max_run_value == null ? null : Number(offering.max_run_value),
      maxRunUnit: offering.max_run_unit,
      providerAdministrativeArea: offering.provider_market.administrative_area,
      providerLocationAreas: offering.provider_market.locations
        .map((location) => location.administrative_area)
        .filter((area): area is string => Boolean(area)),
      claims,
    });

    return { offering, result };
  });

  const calculatedAt = new Date();

  await prisma.$transaction(async (tx) => {
    await tx.works_matches.updateMany({
      where: { brief_id: brief.id, is_current: true },
      data: { is_current: false },
    });

    for (const { offering, result } of evaluations) {
      const match = await tx.works_matches.create({
        data: {
          brief_id: brief.id,
          offering_id: offering.id,
          status: toMatchStatus(result.status),
          fit_score: result.fitScore,
          covered_step_count: result.coveredStepCount,
          matched_count: result.matchedCount,
          unknown_count: result.unknownCount,
          failed_count: result.failedCount,
          algorithm_version: ALGORITHM_VERSION,
          is_current: true,
          calculated_at: calculatedAt,
        },
        select: { id: true },
      });

      if (result.outcomes.length > 0) {
        await tx.works_match_outcomes.createMany({
          data: result.outcomes.map((outcome) => ({
            match_id: match.id,
            requirement_id: outcome.requirementId,
            step_id: outcome.stepId,
            source_claim_id: outcome.sourceClaimId,
            criterion_type: outcome.criterionType,
            criterion_key: outcome.criterionKey,
            status: toMatchStatus(outcome.status),
            priority: toPriority(outcome.priority),
            hard_constraint: outcome.hardConstraint,
            score_delta: outcome.scoreDelta,
            expected_value: toInputJson(outcome.expectedValue),
            actual_value: toInputJson(outcome.actualValue),
            explanation: outcome.explanation,
          })),
        });
      }
    }
  });

  const matches = await prisma.works_matches.findMany({
    where: { brief_id: brief.id, is_current: true },
    include: {
      offering: {
        include: {
          provider_market: {
            include: {
              provider: { select: { name: true, slug: true } },
            },
          },
        },
      },
      outcomes: {
        orderBy: [{ hard_constraint: "desc" }, { score_delta: "desc" }],
        include: {
          requirement: { select: { field: true, display_value: true } },
          step: { select: { title: true, step_key: true } },
          source_claim: {
            select: { field: true, display_value: true, status: true },
          },
        },
      },
    },
  });

  return matches.sort(compareWorksMatches);
}
