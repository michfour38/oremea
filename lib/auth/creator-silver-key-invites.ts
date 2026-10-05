import { createHash, randomBytes } from "node:crypto";

import {
  CREATOR_SILVER_KEY,
  CREATOR_SILVER_RESONANCE_CREDITS,
  CREATOR_SILVER_RESONANCE_PLAN_ID,
} from "@/lib/auth/creator-silver-key";
import { prisma } from "@/lib/prisma";

const CREATOR_SILVER_INVITE_TTL_MS = 7 * 24 * 60 * 60 * 1000;
const CREATOR_SILVER_CLAIM_ORIGIN = "https://www.oremea.com";
const TOKEN_PATTERN = /^[A-Za-z0-9_-]{40,100}$/;

export type CreatorSilverKeyInviteState =
  | { status: "invalid" }
  | { status: "revoked"; email: string }
  | { status: "expired"; email: string; expiresAt: Date }
  | { status: "claimed"; email: string; claimedAt: Date }
  | { status: "available"; email: string; expiresAt: Date };

export function normalizeCreatorSilverEmail(rawEmail: string) {
  const email = rawEmail.trim().toLowerCase();
  if (!email || email.length > 320 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    throw new Error("Enter a valid email address.");
  }
  return email;
}

export function hashCreatorSilverInviteToken(token: string) {
  return createHash("sha256").update(token, "utf8").digest("hex");
}

function validToken(token: string) {
  return TOKEN_PATTERN.test(token);
}

export async function createCreatorSilverKeyInvite({
  email: rawEmail,
  actorId,
}: {
  email: string;
  actorId: string;
}) {
  const email = normalizeCreatorSilverEmail(rawEmail);
  const existingIssuance =
    await prisma.oremea_creator_silver_key_issuances.findUnique({
      where: { email_normalized: email },
      select: { id: true },
    });

  if (existingIssuance) {
    throw new Error("A Creator Silver Key has already been issued to this email.");
  }

  const token = randomBytes(32).toString("base64url");
  const tokenHash = hashCreatorSilverInviteToken(token);
  const now = new Date();
  const expiresAt = new Date(now.getTime() + CREATOR_SILVER_INVITE_TTL_MS);

  const invite = await prisma.$transaction(async (transaction) => {
    await transaction.oremea_creator_silver_key_invites.updateMany({
      where: {
        email_normalized: email,
        claimed_at: null,
        revoked_at: null,
      },
      data: { revoked_at: now },
    });

    return transaction.oremea_creator_silver_key_invites.create({
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
    link: `${CREATOR_SILVER_CLAIM_ORIGIN}/key/silver/claim/${token}`,
  };
}

export async function getCreatorSilverKeyInviteState(
  token: string,
): Promise<CreatorSilverKeyInviteState> {
  if (!validToken(token)) return { status: "invalid" };

  const invite = await prisma.oremea_creator_silver_key_invites.findUnique({
    where: { token_hash: hashCreatorSilverInviteToken(token) },
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

export async function claimCreatorSilverKeyInvite({
  token,
  userId,
  verifiedEmails,
}: {
  token: string;
  userId: string;
  verifiedEmails: string[];
}) {
  if (!validToken(token)) {
    throw new Error("This Creator Silver Key link is invalid.");
  }

  const verified = new Set(
    verifiedEmails.map((email) => normalizeCreatorSilverEmail(email)),
  );
  const tokenHash = hashCreatorSilverInviteToken(token);

  return prisma.$transaction(async (transaction) => {
    const invite = await transaction.oremea_creator_silver_key_invites.findUnique({
      where: { token_hash: tokenHash },
    });

    if (!invite) throw new Error("This Creator Silver Key link is invalid.");
    if (!verified.has(invite.email_normalized)) {
      throw new Error(
        "Sign in with the verified email address this Creator Silver Key was issued to.",
      );
    }

    const alreadyIssued =
      await transaction.oremea_creator_silver_key_issuances.findFirst({
        where: {
          OR: [
            { email_normalized: invite.email_normalized },
            { current_user_id: userId },
          ],
        },
        select: { id: true },
      });
    if (alreadyIssued) {
      throw new Error("This account or email already has a Creator Silver Key.");
    }

    const now = new Date();
    const consumed = await transaction.oremea_creator_silver_key_invites.updateMany({
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
      throw new Error("This Creator Silver Key link is no longer available.");
    }

    const resonanceGrant = await transaction.resonance_visit_orders.create({
      data: {
        user_id: userId,
        buyer_email: invite.email_normalized,
        kind: "creator_silver_key",
        quantity: CREATOR_SILVER_RESONANCE_CREDITS,
        amount_cents: 0,
        remaining_quantity: CREATOR_SILVER_RESONANCE_CREDITS,
        status: "paid",
        whop_plan_id: CREATOR_SILVER_RESONANCE_PLAN_ID,
        affiliate_code: null,
        offer_closed_at: now,
        paid_at: null,
      },
    });

    const issuance =
      await transaction.oremea_creator_silver_key_issuances.create({
        data: {
          email_normalized: invite.email_normalized,
          granted_by: invite.created_by,
          current_user_id: userId,
          attached_at: now,
          resonance_order_id: resonanceGrant.id,
        },
      });

    await transaction.oremea_entitlements.upsert({
      where: {
        user_id_product_key: {
          user_id: userId,
          product_key: CREATOR_SILVER_KEY,
        },
      },
      create: {
        user_id: userId,
        product_key: CREATOR_SILVER_KEY,
        status: "active",
        source: "creator_silver_key_issuance",
        source_reference: issuance.id,
        expires_at: null,
        revoked_at: null,
      },
      update: {
        status: "active",
        source: "creator_silver_key_issuance",
        source_reference: issuance.id,
        expires_at: null,
        revoked_at: null,
      },
    });

    await transaction.oremea_creator_silver_key_events.createMany({
      data: [
        {
          issuance_id: issuance.id,
          event_type: "claimed",
          actor_id: invite.created_by,
          user_id: userId,
          metadata: {
            email: invite.email_normalized,
          },
        },
        {
          issuance_id: issuance.id,
          event_type: "resonance_credits_granted",
          actor_id: invite.created_by,
          user_id: userId,
          metadata: {
            credits: CREATOR_SILVER_RESONANCE_CREDITS,
            orderId: resonanceGrant.id,
          },
        },
      ],
    });

    await transaction.oremea_creator_silver_key_invites.update({
      where: { id: invite.id },
      data: { issuance_id: issuance.id },
    });

    return issuance;
  });
}
