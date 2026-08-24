import { auth } from "@clerk/nextjs/server";
import { WorksMatchStatus, WorksProviderPlan } from "@prisma/client";
import { NextResponse } from "next/server";

import { prisma } from "@/lib/prisma";

const DETAIL_PLANS = new Set<WorksProviderPlan>([WorksProviderPlan.GROWTH, WorksProviderPlan.ENTERPRISE]);

function humanizeKey(value: string) {
  return value
    .replaceAll("_", " ")
    .replaceAll(".", " ")
    .replace(/\s+/g, " ")
    .trim()
    .replace(/^./, (char) => char.toUpperCase());
}

export async function GET(request: Request) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "Sign in to open provider intelligence." }, { status: 401 });

  const providerId = new URL(request.url).searchParams.get("providerId");
  if (!providerId) return NextResponse.json({ error: "Choose a provider profile." }, { status: 400 });

  const membership = await prisma.works_provider_memberships.findFirst({
    where: { provider_id: providerId, clerk_user_id: userId, active: true },
    include: {
      provider: {
        include: {
          commercial_profile: true,
          markets: {
            where: { active: true },
            include: { offerings: { where: { active: true }, select: { id: true } } },
          },
        },
      },
    },
  });

  if (!membership) return NextResponse.json({ error: "This provider profile is not available to this account." }, { status: 403 });

  const plan = membership.provider.commercial_profile?.plan ?? WorksProviderPlan.FREE;
  const hasDetailedIntelligence = DETAIL_PLANS.has(plan);
  const offeringIds = membership.provider.markets.flatMap((market) => market.offerings.map((offering) => offering.id));
  const since = new Date();
  since.setUTCDate(since.getUTCDate() - 30);

  if (!offeringIds.length) {
    return NextResponse.json({
      provider: { id: membership.provider.id, name: membership.provider.name, plan },
      windowDays: 30,
      summary: { evaluatedBriefs: 0, matchingBriefs: 0, possibleBriefs: 0, missedBriefs: 0 },
      detailAvailable: hasDetailedIntelligence,
      gaps: [],
    });
  }

  const matches = await prisma.works_matches.findMany({
    where: {
      offering_id: { in: offeringIds },
      is_current: true,
      calculated_at: { gte: since },
    },
    select: {
      brief_id: true,
      status: true,
      outcomes: {
        where: { status: { in: [WorksMatchStatus.NO_MATCH, WorksMatchStatus.UNKNOWN] } },
        select: { status: true, criterion_key: true, hard_constraint: true },
      },
    },
  });

  const byBrief = new Map<string, Set<WorksMatchStatus>>();
  for (const match of matches) {
    const statuses = byBrief.get(match.brief_id) ?? new Set<WorksMatchStatus>();
    statuses.add(match.status);
    byBrief.set(match.brief_id, statuses);
  }

  let matchingBriefs = 0;
  let possibleBriefs = 0;
  let missedBriefs = 0;
  for (const statuses of byBrief.values()) {
    if (statuses.has(WorksMatchStatus.MATCH)) matchingBriefs += 1;
    else if (statuses.has(WorksMatchStatus.UNKNOWN)) possibleBriefs += 1;
    else if (statuses.has(WorksMatchStatus.NO_MATCH)) missedBriefs += 1;
  }

  const gapCounts = new Map<string, { noMatch: number; unknown: number; hard: number }>();
  if (hasDetailedIntelligence) {
    for (const match of matches) {
      for (const outcome of match.outcomes) {
        const key = outcome.criterion_key || "other";
        const current = gapCounts.get(key) ?? { noMatch: 0, unknown: 0, hard: 0 };
        if (outcome.status === WorksMatchStatus.NO_MATCH) current.noMatch += 1;
        if (outcome.status === WorksMatchStatus.UNKNOWN) current.unknown += 1;
        if (outcome.hard_constraint) current.hard += 1;
        gapCounts.set(key, current);
      }
    }
  }

  const gaps = [...gapCounts.entries()]
    .map(([key, counts]) => ({ key, label: humanizeKey(key), ...counts, total: counts.noMatch + counts.unknown }))
    .sort((a, b) => b.hard - a.hard || b.total - a.total)
    .slice(0, 8);

  return NextResponse.json({
    provider: { id: membership.provider.id, name: membership.provider.name, plan },
    windowDays: 30,
    summary: {
      evaluatedBriefs: byBrief.size,
      matchingBriefs,
      possibleBriefs,
      missedBriefs,
    },
    detailAvailable: hasDetailedIntelligence,
    gaps,
  });
}
