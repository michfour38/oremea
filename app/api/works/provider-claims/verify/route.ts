import { createHash } from "node:crypto";

import { auth } from "@clerk/nextjs/server";
import { Prisma, WorksProviderClaimStatus, WorksProviderMembershipRole } from "@prisma/client";
import { NextRequest, NextResponse } from "next/server";

import { prisma } from "@/lib/prisma";

const PUBLIC_EMAIL_DOMAINS = new Set([
  "gmail.com", "googlemail.com", "outlook.com", "hotmail.com", "live.com", "yahoo.com", "icloud.com", "me.com", "proton.me", "protonmail.com",
]);
const QA_PROVIDER_SLUG = "works-qa-supplier";
const QA_OWNER_EMAIL_SHA256 = "e6bf94b0d4ca6c13869839abd79620a552ef4660e9997ce1ef389e968e12cc50";

function tokenSha256(token: string) {
  return createHash("sha256").update(token).digest("hex");
}

function emailSha256(email: string) {
  return createHash("sha256").update(email.trim().toLowerCase()).digest("hex");
}

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

function draftObject(value: Prisma.JsonValue | null) {
  if (!value || typeof value !== "object" || Array.isArray(value)) return null;
  return value as Prisma.JsonObject;
}

function draftString(draft: Prisma.JsonObject | null, key: string) {
  const value = draft?.[key];
  return typeof value === "string" && value.trim() ? value.trim() : undefined;
}

function draftBoolean(draft: Prisma.JsonObject | null, key: string) {
  return draft?.[key] === true;
}

export async function POST(request: NextRequest) {
  const { userId } = auth();
  if (!userId) {
    return NextResponse.json({ error: "Sign in to the WORKS account that requested this connection." }, { status: 401 });
  }

  const body = (await request.json().catch(() => null)) as Record<string, unknown> | null;
  const token = typeof body?.token === "string" ? body.token.trim() : "";
  if (!/^[A-Za-z0-9_-]{40,100}$/.test(token)) {
    return NextResponse.json({ error: "This verification link is invalid." }, { status: 400 });
  }

  const now = new Date();
  const tokenHash = tokenSha256(token);
  const claim = await prisma.works_provider_claims.findUnique({
    where: { verification_token_hash: tokenHash },
    select: {
      id: true,
      clerk_user_id: true,
      business_email: true,
      status: true,
      verification_expires_at: true,
      profile_draft: true,
      provider: {
        select: {
          id: true,
          name: true,
          slug: true,
          website: true,
          memberships: { where: { active: true }, select: { clerk_user_id: true } },
        },
      },
    },
  });

  if (!claim || claim.status !== WorksProviderClaimStatus.PENDING) {
    return NextResponse.json({ error: "This verification link has already been used or is no longer valid." }, { status: 400 });
  }
  if (claim.clerk_user_id !== userId) {
    return NextResponse.json({ error: "Sign in to the same WORKS account that requested this connection." }, { status: 403 });
  }
  if (!claim.verification_expires_at || claim.verification_expires_at <= now) {
    return NextResponse.json({ error: "This verification link has expired. Return to WORKS and request a new email." }, { status: 410 });
  }

  const emailHost = emailDomain(claim.business_email);
  const siteHost = websiteDomain(claim.provider.website);
  const isQaProvider = claim.provider.slug === QA_PROVIDER_SLUG;
  const domainVerified = Boolean(
    emailHost
    && !PUBLIC_EMAIL_DOMAINS.has(emailHost)
    && siteHost
    && sameOrganizationDomain(emailHost, siteHost),
  );
  const qaVerified = isQaProvider && emailSha256(claim.business_email) === QA_OWNER_EMAIL_SHA256;
  const hasCurrentManager = claim.provider.memberships.length > 0;
  const accessGranted = (domainVerified || qaVerified) && !hasCurrentManager;
  const draft = draftObject(claim.profile_draft);

  if (!accessGranted) {
    const consumed = await prisma.works_provider_claims.updateMany({
      where: {
        id: claim.id,
        clerk_user_id: userId,
        status: WorksProviderClaimStatus.PENDING,
        verification_token_hash: tokenHash,
        verification_expires_at: { gt: now },
      },
      data: {
        business_email_verified_at: now,
        verification_token_hash: null,
        verification_expires_at: null,
      },
    });
    if (consumed.count !== 1) {
      return NextResponse.json({ error: "This verification link has already been used." }, { status: 409 });
    }

    return NextResponse.json({
      verified: true,
      accessGranted: false,
      message: hasCurrentManager
        ? "The business email is verified. Because this profile already has a manager, no access was added; the current manager must approve any additional user."
        : "The business email is verified. WORKS still needs to review the business relationship because the existing profile has no website domain to compare.",
    });
  }

  const marketSlug = draftString(draft, "marketSlug") ?? "za";
  const market = await prisma.works_markets.findUnique({ where: { slug: marketSlug }, select: { id: true } });

  try {
    await prisma.$transaction(async (tx) => {
      const currentManager = await tx.works_provider_memberships.findFirst({
        where: { provider_id: claim.provider.id, active: true },
        select: { id: true },
      });
      if (currentManager) throw new Error("CLAIM_ALREADY_MANAGED");

      const consumed = await tx.works_provider_claims.updateMany({
        where: {
          id: claim.id,
          clerk_user_id: userId,
          status: WorksProviderClaimStatus.PENDING,
          verification_token_hash: tokenHash,
          verification_expires_at: { gt: now },
        },
        data: {
          status: WorksProviderClaimStatus.APPROVED,
          reviewed_at: now,
          business_email_verified_at: now,
          verification_token_hash: null,
          verification_expires_at: null,
        },
      });
      if (consumed.count !== 1) throw new Error("CLAIM_TOKEN_CONSUMED");

      await tx.works_provider_memberships.upsert({
        where: { provider_id_clerk_user_id: { provider_id: claim.provider.id, clerk_user_id: userId } },
        create: {
          provider_id: claim.provider.id,
          clerk_user_id: userId,
          role: WorksProviderMembershipRole.OWNER,
          active: true,
        },
        update: { role: WorksProviderMembershipRole.OWNER, active: true },
      });

      await tx.works_providers.update({
        where: { id: claim.provider.id },
        data: {
          name: draftString(draft, "name"),
          legal_name: draftString(draft, "legalName"),
          website: draftString(draft, "website"),
          email: draftString(draft, "email"),
          phone: draftString(draft, "phone"),
          description: draftString(draft, "description"),
          profile_status: "ACTIVE",
        },
      });

      if (market && draft) {
        await tx.works_provider_markets.updateMany({
          where: { provider_id: claim.provider.id, market_id: market.id },
          data: {
            administrative_area: draftString(draft, "administrativeArea"),
            locality: draftString(draft, "locality"),
            serves_nationally: draftBoolean(draft, "servesNationally"),
            accepts_remote_clients: draftBoolean(draft, "acceptsRemoteClients"),
          },
        });
      }
    });
  } catch (error) {
    if (error instanceof Error && error.message === "CLAIM_TOKEN_CONSUMED") {
      return NextResponse.json({ error: "This verification link has already been used." }, { status: 409 });
    }
    if (error instanceof Error && error.message === "CLAIM_ALREADY_MANAGED") {
      return NextResponse.json({ error: "This business was connected to another manager before verification completed. No access was added." }, { status: 409 });
    }
    throw error;
  }

  return NextResponse.json({
    verified: true,
    accessGranted: true,
    provider: { id: claim.provider.id, name: draftString(draft, "name") ?? claim.provider.name, slug: claim.provider.slug },
    message: `${draftString(draft, "name") ?? claim.provider.name} is verified and connected to your WORKS account. The profile now uses the information supplied by the business.`,
  });
}
