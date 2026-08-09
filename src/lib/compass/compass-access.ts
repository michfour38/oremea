import { prisma } from "@/lib/prisma";

import {
  appendCompassPaymentReference,
  calculateCompassExpiry,
  getCompassDaysRemaining,
  isCompassAccessActive,
  readCompassPaymentReferences,
} from "./compass-access-contract";

export const COMPASS_PRODUCT_KEY = "compass";

const DEFAULT_COMPASS_OWNER_USER_ID =
  "user_3CLGEx3xqgXY6DsIHPyV3yOd1xi";

export type CompassAccessState = {
  active: boolean;
  expiresAt: Date | null;
  daysRemaining: number | null;
  source: "owner" | "entitlement" | null;
};

export function isCompassOwner(userId: string) {
  const configuredOwner = process.env.COMPASS_OWNER_USER_ID?.trim();
  return userId === (configuredOwner || DEFAULT_COMPASS_OWNER_USER_ID);
}

export async function getCompassAccessState(
  userId: string,
  now = new Date(),
): Promise<CompassAccessState> {
  if (isCompassOwner(userId)) {
    return {
      active: true,
      expiresAt: null,
      daysRemaining: null,
      source: "owner",
    };
  }

  const entitlement = await prisma.oremea_entitlements.findUnique({
    where: {
      user_id_product_key: {
        user_id: userId,
        product_key: COMPASS_PRODUCT_KEY,
      },
    },
    select: {
      status: true,
      expires_at: true,
      revoked_at: true,
    },
  });

  const active = Boolean(
    entitlement &&
      entitlement.status === "active" &&
      !entitlement.revoked_at &&
      isCompassAccessActive(entitlement.expires_at, now),
  );

  return {
    active,
    expiresAt: entitlement?.expires_at ?? null,
    daysRemaining: active
      ? getCompassDaysRemaining(entitlement?.expires_at ?? null, now)
      : 0,
    source: entitlement ? "entitlement" : null,
  };
}

export async function grantCompassAccess({
  userId,
  paymentId,
  paidAt,
}: {
  userId: string;
  paymentId: string;
  paidAt: Date;
}) {
  return prisma.$transaction(async (transaction) => {
    const lockKey = `compass-entitlement:${userId}`;
    await transaction.$queryRaw`
      SELECT pg_advisory_xact_lock(hashtext(${lockKey}))
    `;

    const existing = await transaction.oremea_entitlements.findUnique({
      where: {
        user_id_product_key: {
          user_id: userId,
          product_key: COMPASS_PRODUCT_KEY,
        },
      },
    });

    if (
      existing &&
      readCompassPaymentReferences(existing.source_reference).includes(paymentId)
    ) {
      return existing;
    }

    const expiresAt = calculateCompassExpiry(
      paidAt,
      existing?.expires_at ?? null,
    );
    const sourceReference = appendCompassPaymentReference(
      existing?.source_reference ?? null,
      paymentId,
    );

    return transaction.oremea_entitlements.upsert({
      where: {
        user_id_product_key: {
          user_id: userId,
          product_key: COMPASS_PRODUCT_KEY,
        },
      },
      create: {
        user_id: userId,
        product_key: COMPASS_PRODUCT_KEY,
        status: "active",
        source: "whop",
        source_reference: sourceReference,
        granted_at: paidAt,
        expires_at: expiresAt,
      },
      update: {
        status: "active",
        source: "whop",
        source_reference: sourceReference,
        granted_at: paidAt,
        expires_at: expiresAt,
        revoked_at: null,
      },
    });
  });
}
