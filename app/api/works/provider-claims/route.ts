import { auth } from "@clerk/nextjs/server";
import { WorksProviderClaimStatus, WorksProviderMembershipRole } from "@prisma/client";
import { NextRequest, NextResponse } from "next/server";

import { prisma } from "@/lib/prisma";

const PUBLIC_EMAIL_DOMAINS = new Set([
  "gmail.com", "googlemail.com", "outlook.com", "hotmail.com", "live.com", "yahoo.com", "icloud.com", "me.com", "proton.me", "protonmail.com",
]);

function emailDomain(email: string) {
  return email.split("@")[1]?.toLowerCase() ?? "";
}

function websiteDomain(website: string | null) {
  if (!website) return null;
  try {
    const normalized = website.match(/^https?:\/\//i) ? website : `https://${website}`;
    return new URL(normalized).hostname.toLowerCase().replace(/^www\./, "");
  } catch {
    return null;
  }
}

function sameOrganizationDomain(emailHost: string, siteHost: string) {
  const cleanEmail = emailHost.replace(/^www\./, "");
  const cleanSite = siteHost.replace(/^www\./, "");
  return cleanEmail === cleanSite || cleanEmail.endsWith(`.${cleanSite}`) || cleanSite.endsWith(`.${cleanEmail}`);
}

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
    select: {
      id: true,
      name: true,
      website: true,
      memberships: { where: { active: true }, select: { id: true }, take: 1 },
    },
  });
  if (!provider) return NextResponse.json({ error: "That WORKS provider profile could not be found." }, { status: 404 });

  const existingMembership = await prisma.works_provider_memberships.findFirst({
    where: { provider_id: providerId, clerk_user_id: userId, active: true },
    select: { id: true },
  });
  if (existingMembership) {
    return NextResponse.json({ error: "This provider profile is already connected to your account." }, { status: 409 });
  }

  // Once a business has an active WORKS manager/owner, additional access must come from
  // that business's own access-management flow rather than the public claim doorway.
  if (provider.memberships.length > 0) {
    return NextResponse.json({ error: "This business is already managed on WORKS. Ask the business owner or manager to add you." }, { status: 409 });
  }

  const emailHost = emailDomain(businessEmail);
  if (!emailHost || PUBLIC_EMAIL_DOMAINS.has(emailHost)) {
    return NextResponse.json({ error: "Use an email address on the business's own domain so WORKS can verify the connection." }, { status: 400 });
  }

  const siteHost = websiteDomain(provider.website);
  if (siteHost && !sameOrganizationDomain(emailHost, siteHost)) {
    return NextResponse.json({
      error: `Use an email address connected to ${provider.name}'s business domain. A different-domain claim cannot be approved through this doorway.`,
    }, { status: 400 });
  }

  // A missing website removes the strongest automatic signal, so require useful evidence
  // and leave the request pending for manual verification. No membership is created here.
  if (!siteHost && (!note || note.length < 12)) {
    return NextResponse.json({
      error: "WORKS does not yet have a business domain for this provider. Add a short note explaining your role so the claim can be manually verified.",
    }, { status: 400 });
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
    message: `Claim request received for ${provider.name}. The request remains pending until WORKS verifies that the account genuinely represents the business. No profile access has been granted.`,
  });
}
