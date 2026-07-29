import { auth } from "@clerk/nextjs/server";
import { WorksProviderCapacityStatus } from "@prisma/client";
import { NextResponse } from "next/server";

import { prisma } from "@/lib/prisma";

const CAPACITY_VALUES = new Set(Object.values(WorksProviderCapacityStatus));

function stringArray(value: unknown) {
  if (!Array.isArray(value)) return [];
  return [...new Set(value.filter((item): item is string => typeof item === "string" && item.trim().length > 0).map((item) => item.trim()))];
}

export async function GET() {
  const { userId } = auth();
  if (!userId) return NextResponse.json({ error: "Sign in to manage a WORKS provider profile." }, { status: 401 });

  const memberships = await prisma.works_provider_memberships.findMany({
    where: { clerk_user_id: userId, active: true },
    orderBy: { created_at: "asc" },
    include: {
      provider: {
        include: { commercial_profile: true },
      },
    },
  });

  return NextResponse.json({
    providers: memberships.map((membership) => ({
      id: membership.provider.id,
      name: membership.provider.name,
      slug: membership.provider.slug,
      website: membership.provider.website,
      email: membership.provider.email,
      phone: membership.provider.phone,
      profileStatus: membership.provider.profile_status,
      role: membership.role,
      commercial: membership.provider.commercial_profile ?? {
        plan: "FREE",
        marketing_opt_in: false,
        wants_more_work: false,
        capacity_status: "OPEN",
        capacity_note: null,
        target_service_keys: [],
        target_category_keys: [],
        marketing_note: null,
        activated_at: null,
        plan_started_at: null,
        plan_ends_at: null,
      },
    })),
  });
}

export async function PATCH(request: Request) {
  const { userId } = auth();
  if (!userId) return NextResponse.json({ error: "Sign in to manage a WORKS provider profile." }, { status: 401 });

  const body = await request.json().catch(() => null) as Record<string, unknown> | null;
  const providerId = typeof body?.providerId === "string" ? body.providerId : null;
  if (!providerId) return NextResponse.json({ error: "Choose a provider profile." }, { status: 400 });

  const membership = await prisma.works_provider_memberships.findFirst({
    where: { provider_id: providerId, clerk_user_id: userId, active: true },
    select: { id: true },
  });
  if (!membership) return NextResponse.json({ error: "This provider profile is not available to this account." }, { status: 403 });

  const capacityStatus = typeof body?.capacityStatus === "string" && CAPACITY_VALUES.has(body.capacityStatus as WorksProviderCapacityStatus)
    ? body.capacityStatus as WorksProviderCapacityStatus
    : WorksProviderCapacityStatus.OPEN;
  const marketingOptIn = body?.marketingOptIn === true;
  const wantsMoreWork = body?.wantsMoreWork === true;
  const capacityNote = typeof body?.capacityNote === "string" && body.capacityNote.trim() ? body.capacityNote.trim() : null;
  const marketingNote = typeof body?.marketingNote === "string" && body.marketingNote.trim() ? body.marketingNote.trim() : null;
  const targetServiceKeys = stringArray(body?.targetServiceKeys);
  const targetCategoryKeys = stringArray(body?.targetCategoryKeys);

  const commercial = await prisma.works_provider_commercial_profiles.upsert({
    where: { provider_id: providerId },
    create: {
      provider_id: providerId,
      marketing_opt_in: marketingOptIn,
      wants_more_work: wantsMoreWork,
      capacity_status: capacityStatus,
      capacity_note: capacityNote,
      target_service_keys: targetServiceKeys,
      target_category_keys: targetCategoryKeys,
      marketing_note: marketingNote,
      activated_at: marketingOptIn || wantsMoreWork ? new Date() : null,
    },
    update: {
      marketing_opt_in: marketingOptIn,
      wants_more_work: wantsMoreWork,
      capacity_status: capacityStatus,
      capacity_note: capacityNote,
      target_service_keys: targetServiceKeys,
      target_category_keys: targetCategoryKeys,
      marketing_note: marketingNote,
      activated_at: marketingOptIn || wantsMoreWork ? undefined : null,
    },
  });

  return NextResponse.json({ commercial });
}