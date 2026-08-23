import { createHash, randomBytes } from "node:crypto";

import { auth, currentUser } from "@clerk/nextjs/server";
import { WorksProviderClaimStatus, WorksProviderMembershipRole } from "@prisma/client";
import { NextRequest, NextResponse } from "next/server";
import { Resend } from "resend";

import { prisma } from "@/lib/prisma";

const PUBLIC_EMAIL_DOMAINS = new Set([
  "gmail.com", "googlemail.com", "outlook.com", "hotmail.com", "live.com", "yahoo.com", "icloud.com", "me.com", "proton.me", "protonmail.com",
]);

const QA_PROVIDER_SLUG = "works-qa-supplier";
const QA_OWNER_EMAIL_SHA256 = "e6bf94b0d4ca6c13869839abd79620a552ef4660e9997ce1ef389e968e12cc50";
const VERIFICATION_WINDOW_MS = 60 * 60 * 1_000;
const RESEND_COOLDOWN_MS = 60 * 1_000;

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

function tokenSha256(token: string) {
  return createHash("sha256").update(token).digest("hex");
}

function escapeHtml(value: string) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function limitedString(value: unknown, maxLength: number) {
  return typeof value === "string" && value.trim() ? value.trim().slice(0, maxLength) : null;
}

function submittedProfile(value: unknown, marketSlug: string) {
  if (!value || typeof value !== "object" || Array.isArray(value)) return null;
  const draft = value as Record<string, unknown>;
  return {
    marketSlug,
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
  const marketSlug = typeof body?.marketSlug === "string" && body.marketSlug.trim() ? body.marketSlug.trim() : "za";
  const profileDraft = submittedProfile(body?.profileDraft, marketSlug);

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
  let verificationEmail = businessEmail;
  const accountEmail = await signedInPrimaryEmail();

  if (isQaProvider) {
    if (!accountEmail || emailSha256(accountEmail) !== QA_OWNER_EMAIL_SHA256) {
      return NextResponse.json(
        { error: "This QA supplier profile is reserved for the Oremea owner test account." },
        { status: 403 },
      );
    }
    verificationEmail = accountEmail;
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

    // A missing website removes the strongest automatic signal. The inbox can still be
    // verified, but ownership remains pending for manual review.
    if (!siteHost && (!note || note.length < 12)) {
      return NextResponse.json({
        error: "WORKS does not yet have a business domain for this provider. Add a short note explaining your role so the claim can be manually verified.",
      }, { status: 400 });
    }
  }

  // A public claim must never add a second owner to an already-managed business.
  if (provider.memberships.length > 0) {
    return NextResponse.json({
      error: "This business is already managed on WORKS. Ask the current owner or manager to add you.",
    }, { status: 409 });
  }

  const apiKey = process.env.RESEND_API_KEY;
  const from = process.env.WORKS_OUTREACH_FROM || process.env.RESEND_FROM_EMAIL;
  if (!apiKey || !from) {
    return NextResponse.json({
      error: "WORKS cannot send the verification email right now. Please try again shortly.",
    }, { status: 503 });
  }

  const previousClaim = await prisma.works_provider_claims.findUnique({
    where: { provider_id_clerk_user_id: { provider_id: providerId, clerk_user_id: userId } },
    select: { updated_at: true, verification_token_hash: true },
  });
  if (
    previousClaim?.verification_token_hash
    && Date.now() - previousClaim.updated_at.getTime() < RESEND_COOLDOWN_MS
  ) {
    return NextResponse.json({
      error: "A verification email was just sent. Wait one minute before requesting another.",
    }, { status: 429 });
  }

  const verificationToken = randomBytes(32).toString("base64url");
  const verificationTokenHash = tokenSha256(verificationToken);
  const verificationExpiresAt = new Date(Date.now() + VERIFICATION_WINDOW_MS);

  const claim = await prisma.works_provider_claims.upsert({
    where: { provider_id_clerk_user_id: { provider_id: providerId, clerk_user_id: userId } },
    create: {
      provider_id: providerId,
      clerk_user_id: userId,
      business_email: verificationEmail,
      requested_role: WorksProviderMembershipRole.OWNER,
      note,
      profile_draft: profileDraft ?? undefined,
      verification_token_hash: verificationTokenHash,
      verification_expires_at: verificationExpiresAt,
      business_email_verified_at: null,
      status: WorksProviderClaimStatus.PENDING,
      reviewed_at: null,
    },
    update: {
      business_email: verificationEmail,
      note,
      requested_role: WorksProviderMembershipRole.OWNER,
      profile_draft: profileDraft ?? undefined,
      verification_token_hash: verificationTokenHash,
      verification_expires_at: verificationExpiresAt,
      business_email_verified_at: null,
      status: WorksProviderClaimStatus.PENDING,
      reviewed_at: null,
    },
    select: { id: true, status: true, created_at: true },
  });

  const worksOrigin = (process.env.WORKS_PUBLIC_URL || "https://works.oremea.com").replace(/\/+$/, "");
  const verificationUrl = `${worksOrigin}/providers/verify-claim#token=${encodeURIComponent(verificationToken)}`;
  const safeProviderName = escapeHtml(provider.name);
  const safeVerificationUrl = escapeHtml(verificationUrl);
  const resend = new Resend(apiKey);
  const { error: emailError } = await resend.emails.send({
    from,
    to: verificationEmail,
    subject: `Verify your connection to ${provider.name} on WORKS`,
    text: [
      `A request was made to connect ${provider.name} to a WORKS account.`,
      "",
      "Open the secure link below, sign in to the same WORKS account and confirm the connection:",
      verificationUrl,
      "",
      "This link expires in one hour and can be used once.",
      "If you did not request this, ignore this email. No access has been granted.",
    ].join("\n"),
    html: `<div style="font-family:Georgia,serif;line-height:1.6;color:#1f1c17"><h1 style="font-size:28px">Verify your WORKS connection</h1><p>A request was made to connect <strong>${safeProviderName}</strong> to a WORKS account.</p><p><a href="${safeVerificationUrl}" style="display:inline-block;border-radius:999px;background:#1f1c17;color:#fff;padding:12px 20px;text-decoration:none">Review and confirm connection</a></p><p style="color:#666">This link expires in one hour and can be used once. If you did not request this, ignore this email. No access has been granted.</p></div>`,
  });

  if (emailError) {
    console.error("WORKS provider claim verification email failed:", emailError);
    await prisma.works_provider_claims.update({
      where: { id: claim.id },
      data: { verification_token_hash: null, verification_expires_at: null },
    });
    return NextResponse.json({
      error: "WORKS could not send the verification email. Please try again.",
    }, { status: 502 });
  }

  await prisma.works_providers.updateMany({
    where: { id: providerId, profile_status: "RESEARCHED" },
    data: { profile_status: "CLAIM_INVITED" },
  });

  return NextResponse.json({
    claim,
    verificationRequired: true,
    message: `Verification email sent to ${verificationEmail}. Open it and confirm the connection before WORKS grants access or changes the profile.`,
  });
}
