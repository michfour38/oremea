import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";

import { prisma } from "@/lib/prisma";

export async function GET() {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "Sign in to open the WORKS provider inbox." }, { status: 401 });

  const memberships = await prisma.works_provider_memberships.findMany({
    where: { clerk_user_id: userId, active: true },
    select: { provider_id: true, provider: { select: { id: true, name: true, slug: true } } },
  });

  const providerIds = memberships.map((membership) => membership.provider_id);
  if (providerIds.length === 0) return NextResponse.json({ providers: [], opportunities: [] });

  const outreach = await prisma.works_provider_outreach.findMany({
    where: { provider_id: { in: providerIds } },
    orderBy: { created_at: "desc" },
    take: 100,
    include: {
      provider: { select: { id: true, name: true, slug: true } },
      brief: {
        select: {
          id: true,
          product_description: true,
          stage: true,
          target_quantity: true,
          quantity_unit: true,
          administrative_area: true,
          timeline_date: true,
          requested_services: true,
        },
      },
      procurement_request: {
        select: { status: true, created_at: true },
      },
    },
  });

  return NextResponse.json({
    providers: memberships.map((membership) => membership.provider),
    opportunities: outreach.map((item) => ({
      id: item.id,
      provider: item.provider,
      status: item.status,
      relevantSteps: item.relevant_steps,
      briefSnapshot: item.brief_snapshot,
      sentAt: item.sent_at,
      respondedAt: item.responded_at,
      decision: item.decision,
      moqValue: item.moq_value?.toString() ?? null,
      moqUnit: item.moq_unit,
      leadTimeText: item.lead_time_text,
      capacityDate: item.capacity_date,
      pricingNotes: item.pricing_notes,
      certificationNotes: item.certification_notes,
      providerNotes: item.provider_notes,
      procurementStatus: item.procurement_request.status,
      brief: {
        id: item.brief.id,
        productDescription: item.brief.product_description,
        stage: item.brief.stage,
        targetQuantity: item.brief.target_quantity?.toString() ?? null,
        quantityUnit: item.brief.quantity_unit,
        administrativeArea: item.brief.administrative_area,
        timelineDate: item.brief.timeline_date,
        requestedServices: item.brief.requested_services,
      },
      createdAt: item.created_at,
    })),
  });
}
