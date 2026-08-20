import { createHash } from "node:crypto";

import { auth, currentUser } from "@clerk/nextjs/server";
import { WorksProviderClaimStatus, WorksProviderMembershipRole } from "@prisma/client";
import { NextRequest, NextResponse } from "next/server";

import { prisma } from "@/lib/prisma";

const PUBLIC_EMAIL_DOMAINS = new Set([
  "gmail.com", "googlemail.com", "outlook.com", "hotmail.com", "live.com", "yahoo.com", "icloud.com", "me.com", "proton.me", "protonmail.com",
]);

const QA_PROVIDER_SLUG = "works-qa-supplier";
const QA_OWNER_EMAIL_SHA256 = "e6bf94b0d4ca6c13869839abd79620a552ef4660e9997ce1ef389e968e12cc50";

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

function emailSha256(email: string) {
  return createHash("sha256").update(email.trim().toLowerCase()).digest("hex");
}

function limitedString(value: unknown, maxLength: number) {
  return typeof value === "string" && value.trim() ? value.trim().slice(0, maxLength) : null;
}

function submittedProfile(value: unknown) {
  if (!value || typeof value !== "object" || Array.isArray(value)) return null;
  const draft = value as Record<string, unknown>;
  return {
    name: limitedString(draft.name, 240),
    legalName: limitedString(draft.legalName, 240),
    website: limitedString(draft.website, 500),
    email: limitedString(draft.email, 320),
    phone: limitedString(draft.phone, 80),
    description: limitedString(draft.description, 2_000),
    administrativeArea: limitedString(draft.administrativeArea, 160),
    locality: limitedString(draft.locality, 160),
    servesNationally: draft.servesNationally === true,
    acceptsRemoteClients: draft.acceptsRemoteClients === true,
  };
}

async function signedInPrimaryEmail() {
  const user = await currentUser();
  if (!user) return null;

  const primary = user.emailAddresses.find(
    (address) => address.id === user.primaryEmailAddressId,
  );
  const address = primary ?? user.emailAddresses[0];
  if (address?.verification?.status !== "verified") return null;
  return address.emailAddress.trim().toLowerCase();
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
  const profileDraft = submittedProfile(body?.profileDraft);
  const marketSlug = typeof body?.marketSlug === "string" && body.marketSlug.trim() ? body.marketSlug.trim() : "za";

  if (!providerId) return NextResponse.json({ error: "Choose the business you are claiming." }, { status: 400 });

  const provider = await prisma.works_providers.findFirst({
    where: { id: providerId, profile_status: { not: "ARCHIVED" } },
    select: {
      id: true,
      name: true,
      slug: true,
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

  const isQaProvider = provider.slug === QA_PROVIDER_SLUG;
  let verifiedBusinessEmail = businessEmail;
  const accountEmail = await signedInPrimaryEmail();
  let verifiedDomainOwner = false;

  if (isQaProvider) {
    if (!accountEmail || emailSha256(accountEmail) !== QA_OWNER_EMAIL_SHA256) {
      return NextResponse.json(
        { error: "This QA supplier profile is reserved for the Oremea owner test account." },
        { status: 403 },
      );
    }
    verifiedBusinessEmail = accountEmail;
  } else {
    if (!/^\S+@\S+\.\S+$/.test(businessEmail)) {
      return NextResponse.json({ error: "Add a valid business email address." }, { status: 400 });
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

    verifiedDomainOwner = Boolean(
      accountEmail
      && accountEmail === businessEmail
      && siteHost
      && sameOrganizationDomain(emailHost, siteHost),
    );

    // A missing website removes the strongest automatic signal, so require useful evidence
    // and leave the request pending for manual verification. No membership is created here.
    if (!siteHost && (!note || note.length < 12)) {
      return NextResponse.json({
        error: "WORKS does not yet have a business domain for this provider. Add a short note explaining your role so the claim can be manually verified.",
      }, { status: 400 });
    }
  }

  // Existing access cannot be bypassed by an unrelated claimant. A Clerk-verified
  // primary email on the provider's own website domain is strong enough to add a
  // legitimate owner without removing any current manager.
  if (provider.memberships.length > 0 && !isQaProvider && !verifiedDomainOwner) {
    return NextResponse.json({
      error: "This business is already managed on WORKS. Sign in with a verified email on the business's own domain, or ask the current manager to add you.",
    }, { status: 409 });
  }

  const accessApproved = isQaProvider || verifiedDomainOwner;
  const claimStatus = accessApproved
    ? WorksProviderClaimStatus.APPROVED
    : WorksProviderClaimStatus.PENDING;

  const claim = await prisma.works_provider_claims.upsert({
    where: { provider_id_clerk_user_id: { provider_id: providerId, clerk_user_id: userId } },
    create: {
      provider_id: providerId,
      clerk_user_id: userId,
      business_email: verifiedBusinessEmail,
      requested_role: WorksProviderMembershipRole.OWNER,
      note,
      profile_draft: profileDraft ?? undefined,
      status: claimStatus,
      reviewed_at: accessApproved ? new Date() : null,
    },
    update: {
      business_email: verifiedBusinessEmail,
      note,
      requested_role: WorksProviderMembershipRole.OWNER,
      profile_draft: profileDraft ?? undefined,
      status: claimStatus,
      reviewed_at: accessApproved ? new Date() : null,
    },
    select: { id: true, status: true, created_at: true },
  });

  if (accessApproved) {
    const market = await prisma.works_markets.findUnique({ where: { slug: marketSlug }, select: { id: true } });
    await prisma.$transaction([
      prisma.works_provider_memberships.upsert({
        where: {
          provider_id_clerk_user_id: {
            provider_id: providerId,
            clerk_user_id: userId,
          },
        },
        create: {
          provider_id: providerId,
          clerk_user_id: userId,
          role: WorksProviderMembershipRole.OWNER,
          active: true,
        },
        update: {
          role: WorksProviderMembershipRole.OWNER,
          active: true,
        },
      }),
      prisma.works_providers.update({
        where: { id: providerId },
        data: {
          name: profileDraft?.name ?? undefined,
          legal_name: profileDraft?.legalName ?? undefined,
          website: profileDraft?.website ?? undefined,
          email: profileDraft?.email ?? undefined,
          phone: profileDraft?.phone ?? undefined,
          description: profileDraft?.description ?? undefined,
          profile_status: "ACTIVE",
        },
      }),
      ...(market && profileDraft ? [prisma.works_provider_markets.updateMany({
        where: { provider_id: providerId, market_id: market.id },
        data: {
          administrative_area: profileDraft.administrativeArea ?? undefined,
          locality: profileDraft.locality ?? undefined,
          serves_nationally: profileDraft.servesNationally,
          accepts_remote_clients: profileDraft.acceptsRemoteClients,
        },
      })] : []),
    ]);

    return NextResponse.json({
      claim,
      accessGranted: true,
      provider: { id: provider.id, name: provider.name, slug: provider.slug },
      message: isQaProvider
        ? `QA claim approved for ${provider.name}. Your test account now has owner access so the supplier workspace can be audited end to end.`
        : `${provider.name} is verified and connected to your account. Its WORKS profile now uses the information you supplied.`,
    });
  }

  await prisma.works_providers.updateMany({
    where: { id: providerId, profile_status: "RESEARCHED" },
    data: { profile_status: "CLAIM_INVITED" },
  });

  return NextResponse.json({
    claim,
    message: `Claim request received for ${provider.name}. Your submitted profile details are saved with the request and will replace WORKS's starting information only after the business relationship is verified. No profile access has been granted yet.`,
  });
}
