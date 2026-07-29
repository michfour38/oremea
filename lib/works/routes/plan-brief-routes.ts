import {
  WorksMatchStatus,
  WorksRouteStatus,
} from "@prisma/client";

import { prisma } from "@/lib/prisma";

const ALGORITHM_VERSION = "v1";
const MAX_CANDIDATES_PER_STEP = 5;
const BEAM_WIDTH = 20;
const ROUTE_LIMIT = 3;

type Candidate = {
  stepId: string;
  stepTitle: string;
  stepPosition: number;
  matchId: string;
  offeringId: string;
  offeringName: string;
  providerId: string;
  providerName: string;
  status: "MATCH" | "UNKNOWN";
  candidateScore: number;
  hardUnknownKeys: string[];
  explanation: string;
};

type RouteAssignmentDraft = {
  stepId: string;
  stepTitle: string;
  stepPosition: number;
  candidate: Candidate | null;
};

type RouteDraft = {
  assignments: RouteAssignmentDraft[];
  score: number;
};

function clamp(value: number, min: number, max: number) {
  return Math.max(min, Math.min(max, value));
}

function statusPriority(status: WorksRouteStatus) {
  switch (status) {
    case WorksRouteStatus.VIABLE:
      return 3;
    case WorksRouteStatus.POTENTIAL:
      return 2;
    case WorksRouteStatus.INCOMPLETE:
      return 1;
  }
}

function routeKey(route: RouteDraft) {
  return route.assignments
    .map((assignment) => assignment.candidate?.offeringId ?? "GAP")
    .join("|");
}

function previousProviderId(route: RouteDraft) {
  for (let index = route.assignments.length - 1; index >= 0; index -= 1) {
    const providerId = route.assignments[index]?.candidate?.providerId;
    if (providerId) return providerId;
  }
  return null;
}

function extendRoute(route: RouteDraft, candidate: Candidate | null, step: {
  id: string;
  title: string;
  position: number;
}): RouteDraft {
  if (!candidate) {
    return {
      assignments: [
        ...route.assignments,
        {
          stepId: step.id,
          stepTitle: step.title,
          stepPosition: step.position,
          candidate: null,
        },
      ],
      score: route.score - 80,
    };
  }

  const existingProviders = new Set(
    route.assignments
      .map((assignment) => assignment.candidate?.providerId)
      .filter((providerId): providerId is string => Boolean(providerId))
  );
  const previousProvider = previousProviderId(route);

  let transitionScore = 0;
  if (previousProvider === candidate.providerId) {
    transitionScore += 12;
  } else if (previousProvider) {
    transitionScore -= 8;
  }

  if (existingProviders.has(candidate.providerId)) {
    transitionScore += 5;
  }

  return {
    assignments: [
      ...route.assignments,
      {
        stepId: step.id,
        stepTitle: step.title,
        stepPosition: step.position,
        candidate,
      },
    ],
    score: route.score + candidate.candidateScore + transitionScore,
  };
}

function routeMetrics(route: RouteDraft) {
  const assigned = route.assignments.filter(
    (assignment): assignment is RouteAssignmentDraft & { candidate: Candidate } =>
      Boolean(assignment.candidate)
  );

  const providerIds = assigned.map((assignment) => assignment.candidate.providerId);
  const distinctProviders = new Set(providerIds);

  let handoffCount = 0;
  let previousProvider: string | null = null;
  for (const providerId of providerIds) {
    if (previousProvider && previousProvider !== providerId) handoffCount += 1;
    previousProvider = providerId;
  }

  const hardUnknownKeys = new Set(
    assigned.flatMap((assignment) => assignment.candidate.hardUnknownKeys)
  );
  const missingStepCount = route.assignments.length - assigned.length;
  const unknownAssignmentCount = assigned.filter(
    (assignment) => assignment.candidate.status === "UNKNOWN"
  ).length;

  const status = missingStepCount > 0
    ? WorksRouteStatus.INCOMPLETE
    : unknownAssignmentCount > 0
      ? WorksRouteStatus.POTENTIAL
      : WorksRouteStatus.VIABLE;

  const consolidationPenalty = Math.max(0, distinctProviders.size - 1) * 5;

  return {
    status,
    routeScore: route.score - consolidationPenalty,
    providerCount: distinctProviders.size,
    handoffCount,
    assignedStepCount: assigned.length,
    unresolvedStepCount: missingStepCount + unknownAssignmentCount,
    unresolvedRequirementCount: hardUnknownKeys.size,
  };
}

export async function planBriefRoutes(briefId: string) {
  const brief = await prisma.works_product_briefs.findUniqueOrThrow({
    where: { id: briefId },
    include: {
      paths: {
        where: { is_current: true },
        orderBy: { version: "desc" },
        take: 1,
        include: {
          steps: {
            where: { status: "NEEDED" },
            orderBy: { position: "asc" },
            include: { service: { select: { key: true } } },
          },
        },
      },
    },
  });

  const path = brief.paths[0];
  if (!path) {
    throw new Error(`WORKS brief ${briefId} has no current production path.`);
  }

  if (path.steps.length === 0) {
    throw new Error(`WORKS brief ${briefId} has no required open production steps.`);
  }

  const matches = await prisma.works_matches.findMany({
    where: {
      brief_id: brief.id,
      is_current: true,
      status: { in: [WorksMatchStatus.MATCH, WorksMatchStatus.UNKNOWN] },
    },
    include: {
      offering: {
        include: {
          provider_market: {
            include: {
              provider: { select: { id: true, name: true } },
            },
          },
        },
      },
      outcomes: {
        include: {
          requirement: {
            include: {
              applies_to_service: { select: { key: true } },
            },
          },
        },
      },
    },
  });

  if (matches.length === 0) {
    throw new Error(
      `WORKS brief ${briefId} has no current MATCH or UNKNOWN offering evaluations. Calculate matches first.`
    );
  }

  const candidatesByStep = new Map<string, Candidate[]>();

  for (const step of path.steps) {
    const stepCandidates: Candidate[] = [];

    for (const match of matches) {
      const coversStep = match.outcomes.some(
        (outcome) =>
          outcome.step_id === step.id &&
          outcome.criterion_type === "PATH_STEP" &&
          outcome.status === WorksMatchStatus.MATCH
      );
      if (!coversStep) continue;

      const hardUnknownOutcomes = match.outcomes.filter(
        (outcome) =>
          outcome.hard_constraint &&
          outcome.status === WorksMatchStatus.UNKNOWN &&
          (!outcome.requirement?.applies_to_service?.key ||
            outcome.requirement.applies_to_service.key === step.service?.key ||
            outcome.criterion_type === "QUANTITY")
      );

      const evidenceBackedMatches = match.outcomes.filter(
        (outcome) =>
          outcome.status === WorksMatchStatus.MATCH && Boolean(outcome.source_claim_id)
      ).length;
      const geographyMatch = match.outcomes.some(
        (outcome) =>
          outcome.criterion_type === "GEOGRAPHY" &&
          outcome.status === WorksMatchStatus.MATCH
      );

      const fitContribution = Math.round(
        clamp(match.fit_score ?? 0, -20, 60) / 4
      );
      const candidateScore =
        (match.status === WorksMatchStatus.MATCH ? 42 : 22) +
        fitContribution +
        (geographyMatch ? 5 : 0) +
        Math.min(evidenceBackedMatches * 2, 8) -
        hardUnknownOutcomes.length * 10 -
        match.failed_count * 10;

      const provider = match.offering.provider_market.provider;
      stepCandidates.push({
        stepId: step.id,
        stepTitle: step.title,
        stepPosition: step.position,
        matchId: match.id,
        offeringId: match.offering.id,
        offeringName: match.offering.name,
        providerId: provider.id,
        providerName: provider.name,
        status: match.status === WorksMatchStatus.MATCH ? "MATCH" : "UNKNOWN",
        candidateScore,
        hardUnknownKeys: hardUnknownOutcomes.map(
          (outcome) => `${match.id}:${outcome.criterion_type}:${outcome.criterion_key}`
        ),
        explanation:
          match.status === WorksMatchStatus.MATCH
            ? `${provider.name} has a confirmed fit for ${step.title} through ${match.offering.name}.`
            : `${provider.name} can cover ${step.title} through ${match.offering.name}, with unresolved hard facts still attached to this offering.`,
      });
    }

    stepCandidates.sort((a, b) => {
      if (a.status !== b.status) return a.status === "MATCH" ? -1 : 1;
      if (a.candidateScore !== b.candidateScore) {
        return b.candidateScore - a.candidateScore;
      }
      return a.providerName.localeCompare(b.providerName);
    });

    candidatesByStep.set(
      step.id,
      stepCandidates.slice(0, MAX_CANDIDATES_PER_STEP)
    );
  }

  let beam: RouteDraft[] = [{ assignments: [], score: 0 }];

  for (const step of path.steps) {
    const candidates = candidatesByStep.get(step.id) ?? [];
    const next: RouteDraft[] = [];

    for (const route of beam) {
      if (candidates.length === 0) {
        next.push(extendRoute(route, null, step));
        continue;
      }

      for (const candidate of candidates) {
        next.push(extendRoute(route, candidate, step));
      }
    }

    const unique = new Map<string, RouteDraft>();
    for (const route of next) {
      const key = routeKey(route);
      const existing = unique.get(key);
      if (!existing || route.score > existing.score) unique.set(key, route);
    }

    beam = [...unique.values()]
      .sort((a, b) => b.score - a.score)
      .slice(0, BEAM_WIDTH);
  }

  const ranked = beam
    .map((route) => ({ route, metrics: routeMetrics(route) }))
    .sort((a, b) => {
      const statusDifference =
        statusPriority(b.metrics.status) - statusPriority(a.metrics.status);
      if (statusDifference !== 0) return statusDifference;
      if (a.metrics.handoffCount !== b.metrics.handoffCount) {
        return a.metrics.handoffCount - b.metrics.handoffCount;
      }
      if (a.metrics.providerCount !== b.metrics.providerCount) {
        return a.metrics.providerCount - b.metrics.providerCount;
      }
      if (a.metrics.unresolvedRequirementCount !== b.metrics.unresolvedRequirementCount) {
        return (
          a.metrics.unresolvedRequirementCount -
          b.metrics.unresolvedRequirementCount
        );
      }
      return b.metrics.routeScore - a.metrics.routeScore;
    })
    .slice(0, ROUTE_LIMIT);

  const calculatedAt = new Date();

  await prisma.$transaction(async (tx) => {
    await tx.works_route_options.updateMany({
      where: { brief_id: brief.id, is_current: true },
      data: { is_current: false },
    });

    for (const [index, item] of ranked.entries()) {
      const route = await tx.works_route_options.create({
        data: {
          brief_id: brief.id,
          path_id: path.id,
          rank: index + 1,
          status: item.metrics.status,
          route_score: item.metrics.routeScore,
          provider_count: item.metrics.providerCount,
          handoff_count: item.metrics.handoffCount,
          assigned_step_count: item.metrics.assignedStepCount,
          unresolved_step_count: item.metrics.unresolvedStepCount,
          unresolved_requirement_count:
            item.metrics.unresolvedRequirementCount,
          algorithm_version: ALGORITHM_VERSION,
          is_current: true,
          calculated_at: calculatedAt,
        },
        select: { id: true },
      });

      await tx.works_route_assignments.createMany({
        data: item.route.assignments.map((assignment) => ({
          route_id: route.id,
          step_id: assignment.stepId,
          match_id: assignment.candidate?.matchId,
          offering_id: assignment.candidate?.offeringId,
          position: assignment.stepPosition,
          status: assignment.candidate
            ? assignment.candidate.status === "MATCH"
              ? WorksMatchStatus.MATCH
              : WorksMatchStatus.UNKNOWN
            : WorksMatchStatus.UNKNOWN,
          explanation:
            assignment.candidate?.explanation ??
            `No current eligible offering covers ${assignment.stepTitle}.`,
        })),
      });
    }
  });

  return prisma.works_route_options.findMany({
    where: { brief_id: brief.id, is_current: true },
    orderBy: { rank: "asc" },
    include: {
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
                  provider: { select: { name: true, slug: true } },
                },
              },
            },
          },
          match: {
            include: {
              outcomes: {
                where: { hard_constraint: true, status: WorksMatchStatus.UNKNOWN },
                include: {
                  requirement: {
                    select: { field: true, display_value: true },
                  },
                  source_claim: {
                    select: { field: true, display_value: true, status: true },
                  },
                },
              },
            },
          },
        },
      },
    },
  });
}
