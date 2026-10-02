import { createHash, randomBytes } from "node:crypto";

import { ETERNAL_OREMEA_KEY } from "@/lib/auth/account-access";
import { prisma } from "@/lib/prisma";

const GOLDEN_KEY_INVITE_TTL_MS = 7 * 24 * 60 * 60 * 1000;
const GOLDEN_KEY_CLAIM_ORIGIN = "https://www.oremea.com";
const TOKEN_PATTERN = /^[A-Za-z0-9_-]{40,100}$/;

export type GoldenKeyInviteState =
  | { status: "invalid" }
  | { status: "revoked"; email: string }
  | { status: "expired"; email: string; expiresAt: Date }
  | { status: "claimed"; email: string; claimedAt: Date }
  | { status: "available"; email: string; expiresAt: Date };

export function normalizeGoldenKeyEmail(rawEmail: string) {
  const email = rawEmail.trim().toLowerCase();

  if (!email || email.length > 320 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    throw new Error("Enter a valid email address.");
  }

  return email;
}

export function hashGoldenKeyInviteToken(token: string) {
  return createHash("sha256").update(token, "utf8").digest("hex");
}

function validToken(token: string) {
  return TOKEN_PATTERN.test(token);
}

export async function createGoldenKeyInvite({
  email: rawEmail,
  actorId,
}: {
  email: string;
  actorId: string;
}) {
  const email = normalizeGoldenKeyEmail(rawEmail);
  const token = randomBytes(32).toString("base64url");
  const tokenHash = hashGoldenKeyInviteToken(token);
  const now = new Date();
  const expiresAt = new Date(now.getTime() + GOLDEN_KEY_INVITE_TTL_MS);

  const invite = await prisma.$transaction(async (tx) => {
    await tx.oremea_eternal_key_invites.updateMany({
      where: {
        email_normalized: email,
        claimed_at: null,
        revoked_at: null,
      },
      data: { revoked_at: now },
    });

    return tx.oremea_eternal_key_invites.create({
      data: {
        email_normalized: email,
        token_hash: tokenHash,
        created_by: actorId,
        expires_at: expiresAt,
      },
    });
  });

  return {
    id: invite.id,
    email,
    expiresAt,
    link: `${GOLDEN_KEY_CLAIM_ORIGIN}/key/claim/${token}`,
  };
}

export async function getGoldenKeyInviteState(
  token: string,
): Promise<GoldenKeyInviteState> {
  if (!validToken(token)) return { status: "invalid" };

  const invite = await prisma.oremea_eternal_key_invites.findUnique({
    where: { token_hash: hashGoldenKeyInviteToken(token) },
    select: {
      email_normalized: true,
      expires_at: true,
      claimed_at: true,
      revoked_at: true,
    },
  });

  if (!invite) return { status: "invalid" };
  if (invite.claimed_at) {
    return {
      status: "claimed",
      email: invite.email_normalized,
      claimedAt: invite.claimed_at,
    };
  }
  if (invite.revoked_at) {
    return { status: "revoked", email: invite.email_normalized };
  }
  if (invite.expires_at.getTime() <= Date.now()) {
    return {
      status: "expired",
      email: invite.email_normalized,
      expiresAt: invite.expires_at,
    };
  }

  return {
    status: "available",
    email: invite.email_normalized,
    expiresAt: invite.expires_at,
  };
}

export async function claimGoldenKeyInvite({
  token,
  userId,
  verifiedEmails,
}: {
  token: string;
  userId: string;
  verifiedEmails: string[];
}) {
  if (!validToken(token)) throw new Error("This Golden Key link is invalid.");

  const verified = new Set(
    verifiedEmails.map((email) => normalizeGoldenKeyEmail(email)),
  );
  const tokenHash = hashGoldenKeyInviteToken(token);

  return prisma.$transaction(async (tx) => {
    const invite = await tx.oremea_eternal_key_invites.findUnique({
      where: { token_hash: tokenHash },
    });

    if (!invite) throw new Error("This Golden Key link is invalid.");
    if (!verified.has(invite.email_normalized)) {
      throw new Error(
        "Sign in with the verified email address this Golden Key was issued to.",
      );
    }

    const now = new Date();
    const consumed = await tx.oremea_eternal_key_invites.updateMany({
      where: {
        id: invite.id,
        claimed_at: null,
        revoked_at: null,
        expires_at: { gt: now },
      },
      data: {
        claimed_at: now,
        claimed_by_user_id: userId,
      },
    });

    if (consumed.count !== 1) {
      throw new Error("This Golden Key link is no longer available.");
    }

    const existingIssuance =
      await tx.oremea_eternal_key_issuances.findUnique({
        where: { email_normalized: invite.email_normalized },
      });

    if (
      existingIssuance?.current_user_id &&
      existingIssuance.current_user_id !== userId
    ) {
      const remainingIssuance = await tx.oremea_eternal_key_issuances.findFirst({
        where: {
          current_user_id: existingIssuance.current_user_id,
          id: { not: existingIssuance.id },
        },
        select: { id: true },
      });

      await tx.oremea_entitlements.updateMany({
        where: {
          user_id: existingIssuance.current_user_id,
          product_key: ETERNAL_OREMEA_KEY,
          status: "active",
          revoked_at: null,
        },
        data: remainingIssuance
          ? {
              source: "eternal_key_issuance",
              source_reference: remainingIssuance.id,
            }
          : {
              status: "identity_moved",
              source: "eternal_key_identity_moved",
              source_reference: existingIssuance.id,
              revoked_at: now,
            },
      });
    }

    const issuance = await tx.oremea_eternal_key_issuances.upsert({
      where: { email_normalized: invite.email_normalized },
      create: {
        email_normalized: invite.email_normalized,
        granted_by: invite.created_by,
        current_user_id: userId,
        attached_at: now,
      },
      update: {
        current_user_id: userId,
        attached_at: now,
      },
    });

    await tx.oremea_entitlements.upsert({
      where: {
        user_id_product_key: {
          user_id: userId,
          product_key: ETERNAL_OREMEA_KEY,
        },
      },
      create: {
        user_id: userId,
        product_key: ETERNAL_OREMEA_KEY,
        status: "active",
        source: "eternal_key_issuance",
        source_reference: issuance.id,
        expires_at: null,
        revoked_at: null,
      },
      update: {
        status: "active",
        source: "eternal_key_issuance",
        source_reference: issuance.id,
        expires_at: null,
        revoked_at: null,
      },
    });

    await tx.oremea_eternal_key_invites.update({
      where: { id: invite.id },
      data: { issuance_id: issuance.id },
    });

    return issuance;
  });
}
