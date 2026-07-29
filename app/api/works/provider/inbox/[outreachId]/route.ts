import { auth } from "@clerk/nextjs/server";
import { WorksProviderOutreachStatus, WorksProviderResponseDecision } from "@prisma/client";
import { NextResponse } from "next/server";

import { prisma } from "@/lib/prisma";

const DECISIONS = new Set(Object.values(WorksProviderResponseDecision));

function optionalString(value: unknown) {
  return typeof value === "string" && value.trim() ? value.trim() : null;
}

function optionalPositiveNumber(value: unknown) {
  if (value === null || value === undefined || value === "") return null;
  const numeric = Number(value);
  return Number.isFinite(numeric) && numeric > 0 ? numeric : null;
}

export async function PATCH(request: Request, { params }: { params: { outreachId: string } }) {
  const { userId } = auth();
  if (!userId) return NextResponse.json({ error: "Sign in to respond to this WORKS brief." }, { status: 401 });

  const outreach = await prisma.works_provider_outreach.findUnique({
    where: { id: params.outreachId },
    select: { id: true, provider_id: true },
  });
  if (!outreach) return NextResponse.json({ error: "This WORKS opportunity could not be found." }, { status: 404 });

  const membership = await prisma.works_provider_memberships.findFirst({
    where: { provider_id: outreach.provider_id, clerk_user_id: userId, active: true },
    select: { id: true },
  });
  if (!membership) return NextResponse.json({ error: "This opportunity is not available to this provider account." }, { status: 403 });

  const body = await request.json().catch(() => null) as Record<string, unknown> | null;
  const decision = typeof body?.decision === "string" && DECISIONS.has(body.decision as WorksProviderResponseDecision)
    ? body.decision as WorksProviderResponseDecision
    : null;
  if (!decision) return NextResponse.json({ error: "Choose whether this looks like a fit." }, { status: 400 });

  const capacityDate = typeof body?.capacityDate === "string" && body.capacityDate
    ? new Date(`${body.capacityDate}T00:00:00.000Z`)
    : null;
  if (capacityDate && Number.isNaN(capacityDate.getTime())) {
    return NextResponse.json({ error: "Add a valid capacity date." }, { status: 400 });
  }

  const updated = await prisma.works_provider_outreach.update({
    where: { id: outreach.id },
    data: {
      decision,
      status: decision === WorksProviderResponseDecision.OUTSIDE_CAPABILITY
        ? WorksProviderOutreachStatus.DECLINED
        : WorksProviderOutreachStatus.RESPONDED,
      responded_at: new Date(),
      moq_value: optionalPositiveNumber(body?.moqValue),
      moq_unit: optionalString(body?.moqUnit),
      lead_time_text: optionalString(body?.leadTimeText),
      capacity_date: capacityDate,
      pricing_notes: optionalString(body?.pricingNotes),
      certification_notes: optionalString(body?.certificationNotes),
      provider_notes: optionalString(body?.providerNotes),
    },
  });

  return NextResponse.json({
    opportunity: {
      id: updated.id,
      status: updated.status,
      decision: updated.decision,
      respondedAt: updated.responded_at,
      moqValue: updated.moq_value?.toString() ?? null,
      moqUnit: updated.moq_unit,
      leadTimeText: updated.lead_time_text,
      capacityDate: updated.capacity_date,
      pricingNotes: updated.pricing_notes,
      certificationNotes: updated.certification_notes,
      providerNotes: updated.provider_notes,
    },
  });
}
