import { auth } from "@clerk/nextjs/server";
import { WorksProviderClaimStatus, WorksProviderMembershipRole } from "@prisma/client";
import { NextRequest, NextResponse } from "next/server";

import { prisma } from "@/lib/prisma";

export async function GET(request: NextRequest) {
  const { userId } = auth();
  if (!userId) {
    return NextResponse.json({ error: "Sign in to claim a WORKS provider profile." }, { status: 401 });
  }

  const query = request.nextUrl.searchParams.get("q")?.trim() ?? "";

  const ownClaims = await prisma.works_provider_claims.findMany({
    where: { clerk_user_id: userId },
    orderBy: { created_at: "desc" },
    select: {
      id: true,
      status: true,
      business_email: true,
      created_at: true,
      provider: { select: { id: true, name: true, slug: true } },
    },
  });

  if (query.length < 2) {
    return NextResponse.json({ providers: [], claims: ownClaims });
  }

  const providers = await prisma.works_providers.findMany({
    where: {
      profile_status: { not: "ARCHIVED" },
      name: { contains: query, mode: "insensitive" },
    },
    orderBy: { name: "asc" },
    take: 15,
    select: {
      id: true,
      name: true,
      slug: true,
      public_settings: { select: { show_website: true } },
      website: true,
      memberships: {
        where: { active: true },
        select: { id: true },
        take: 1,
      },
    },
  });

  return NextResponse.json({
    providers: providers.map((provider) => ({
      id: provider.id,
      name: provider.name,
      slug: provider.slug,
      website: provider.public_settings?.show_website ? provider.website : null,
      alreadyClaimed: provider.memberships.length > 0,
    })),
    claims: ownClaims,
  });
}

export async function POST(request: NextRequest) {
  const { userId } = auth();
  if (!userId) {
    return NextResponse.json({ error: "Sign in to claim a WORKS provider profile." }, { status: 401 });
  }

  const body = (await request.json().catch(() => null)) as Record<string, unknown> | null;
  const providerId = typeof body?.providerId === "string" ? body.providerId : "";
  const businessEmail = typeof body?.businessEmail === "string" ? body.businessEmail.trim().toLowerCase() : "";
  const note = typeof body?.note === "string" && body.note.trim() ? body.note.trim() : null;

  if (!providerId) return NextResponse.json({ error: "Choose the business you are claiming." }, { status: 400 });
  if (!/^\S+@\S+\.\S+$/.test(businessEmail)) {
    return NextResponse.json({ error: "Add a valid business email address." }, { status: 400 });
  }

  const provider = await prisma.works_providers.findFirst({
    where: { id: providerId, profile_status: { not: "ARCHIVED" } },
    select: { id: true, name: true },
  });
  if (!provider) return NextResponse.json({ error: "That WORKS provider profile could not be found." }, { status: 404 });

  const existingMembership = await prisma.works_provider_memberships.findFirst({
    where: { provider_id: providerId, clerk_user_id: userId, active: true },
    select: { id: true },
  });
  if (existingMembership) {
    return NextResponse.json({ error: "This provider profile is already connected to your account." }, { status: 409 });
  }

  const claim = await prisma.works_provider_claims.upsert({
    where: { provider_id_clerk_user_id: { provider_id: providerId, clerk_user_id: userId } },
    create: {
      provider_id: providerId,
      clerk_user_id: userId,
      business_email: businessEmail,
      requested_role: WorksProviderMembershipRole.OWNER,
      note,
      status: WorksProviderClaimStatus.PENDING,
    },
    update: {
      business_email: businessEmail,
      note,
      requested_role: WorksProviderMembershipRole.OWNER,
      status: WorksProviderClaimStatus.PENDING,
      reviewed_at: null,
    },
    select: { id: true, status: true, created_at: true },
  });

  await prisma.works_providers.updateMany({
    where: { id: providerId, profile_status: "RESEARCHED" },
    data: { profile_status: "CLAIM_INVITED" },
  });

  return NextResponse.json({
    claim,
    message: `Claim request received for ${provider.name}. WORKS will verify the connection before profile access is granted.`,
  });
}