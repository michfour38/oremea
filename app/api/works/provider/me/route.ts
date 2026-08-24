import { auth } from "@clerk/nextjs/server";
import { WorksProviderCapacityStatus } from "@prisma/client";
import { NextResponse } from "next/server";

import { prisma } from "@/lib/prisma";
import { effectiveWorksProviderPlan } from "@/lib/works/billing/period";

const CAPACITY_VALUES = new Set(Object.values(WorksProviderCapacityStatus));

function stringArray(value: unknown) {
  if (!Array.isArray(value)) return [];
  return [...new Set(value.filter((item): item is string => typeof item === "string" && item.trim().length > 0).map((item) => item.trim()))];
}

function optionalString(value: unknown) {
  return typeof value === "string" && value.trim() ? value.trim() : null;
}

function visibilityValue(value: unknown, fallback: boolean) {
  return typeof value === "boolean" ? value : fallback;
}

const DEFAULT_VISIBILITY = {
  show_legal_name: false,
  show_website: true,
  show_email: false,
  show_phone: false,
  show_description: true,
  show_location: false,
  show_capacity: false,
};

export async function GET() {
  const { userId } = auth();
  if (!userId) return NextResponse.json({ error: "Sign in to manage a WORKS provider profile." }, { status: 401 });

  const memberships = await prisma.works_provider_memberships.findMany({
    where: { clerk_user_id: userId, active: true },
    orderBy: { created_at: "asc" },
    include: {
      provider: {
        include: {
          commercial_profile: true,
          public_settings: true,
          reviews: { where: { status: "PUBLISHED" }, orderBy: { created_at: "desc" }, take: 20 },
        },
      },
    },
  });

  const now = new Date();
  return NextResponse.json({
    providers: memberships.map((membership) => {
      const commercial = membership.provider.commercial_profile;
      return {
        id: membership.provider.id,
        name: membership.provider.name,
        slug: membership.provider.slug,
        legalName: membership.provider.legal_name,
        website: membership.provider.website,
        email: membership.provider.email,
        phone: membership.provider.phone,
        description: membership.provider.description,
        profileStatus: membership.provider.profile_status,
        role: membership.role,
        reviews: membership.provider.reviews,
        visibility: membership.provider.public_settings ?? DEFAULT_VISIBILITY,
        commercial: commercial
          ? { ...commercial, plan: effectiveWorksProviderPlan(commercial, now) }
          : {
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
      };
    }),
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
  const targetServiceKeys = stringArray(body?.targetServiceKeys);
  const targetCategoryKeys = stringArray(body?.targetCategoryKeys);

  const name = typeof body?.name === "string" && body.name.trim().length >= 2 ? body.name.trim() : null;
  if (!name) return NextResponse.json({ error: "Add your business name." }, { status: 400 });

  const visibility = body?.visibility && typeof body.visibility === "object" && !Array.isArray(body.visibility)
    ? body.visibility as Record<string, unknown>
    : {};

  const visibilityData = {
    show_legal_name: visibilityValue(visibility.show_legal_name, false),
    show_website: visibilityValue(visibility.show_website, true),
    show_email: visibilityValue(visibility.show_email, false),
    show_phone: visibilityValue(visibility.show_phone, false),
    show_description: visibilityValue(visibility.show_description, true),
    show_location: visibilityValue(visibility.show_location, false),
    show_capacity: visibilityValue(visibility.show_capacity, false),
  };

  const [provider, commercial, publicSettings] = await prisma.$transaction([
    prisma.works_providers.update({
      where: { id: providerId },
      data: {
        name,
        legal_name: optionalString(body?.legalName),
        website: optionalString(body?.website),
        email: optionalString(body?.email),
        phone: optionalString(body?.phone),
        description: optionalString(body?.description),
        last_profile_reviewed_at: new Date(),
      },
    }),
    prisma.works_provider_commercial_profiles.upsert({
      where: { provider_id: providerId },
      create: {
        provider_id: providerId,
        marketing_opt_in: marketingOptIn,
        wants_more_work: wantsMoreWork,
        capacity_status: capacityStatus,
        capacity_note: optionalString(body?.capacityNote),
        target_service_keys: targetServiceKeys,
        target_category_keys: targetCategoryKeys,
        marketing_note: optionalString(body?.marketingNote),
        activated_at: marketingOptIn || wantsMoreWork ? new Date() : null,
      },
      update: {
        marketing_opt_in: marketingOptIn,
        wants_more_work: wantsMoreWork,
        capacity_status: capacityStatus,
        capacity_note: optionalString(body?.capacityNote),
        target_service_keys: targetServiceKeys,
        target_category_keys: targetCategoryKeys,
        marketing_note: optionalString(body?.marketingNote),
        activated_at: marketingOptIn || wantsMoreWork ? undefined : null,
      },
    }),
    prisma.works_provider_public_settings.upsert({
      where: { provider_id: providerId },
      create: { provider_id: providerId, ...visibilityData },
      update: visibilityData,
    }),
  ]);

  return NextResponse.json({
    provider: {
      id: provider.id,
      name: provider.name,
      legalName: provider.legal_name,
      website: provider.website,
      email: provider.email,
      phone: provider.phone,
      description: provider.description,
    },
    commercial,
    visibility: publicSettings,
  });
}
