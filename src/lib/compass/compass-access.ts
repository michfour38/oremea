import { prisma } from "@/lib/prisma";

import {
  appendCompassPaymentReference,
  calculateCompassExpiry,
  getCompassDaysRemaining,
  isCompassAccessActive,
  readCompassPaymentReferences,
} from "./compass-access-contract";

export const COMPASS_PRODUCT_KEY = "compass";
export const COMPASS_MEMBERSHIP_PRODUCT_KEY = "compass_membership";

const DEFAULT_COMPASS_OWNER_USER_ID =
  "user_3CLGEx3xqgXY6DsIHPyV3yOd1xi";

type CompassMembershipReference = {
  version: 1;
  membershipId: string;
  eventAt: string;
  renewalPeriodEnd: string | null;
};

export type CompassAccessState = {
  active: boolean;
  expiresAt: Date | null;
  daysRemaining: number | null;
  source: "owner" | "pass" | "membership" | null;
};

function readMembershipReference(value: string | null): CompassMembershipReference | null {
  if (!value) return null;

  try {
    const parsed = JSON.parse(value) as Partial<CompassMembershipReference>;
    if (
      parsed.version !== 1 ||
      typeof parsed.membershipId !== "string" ||
      typeof parsed.eventAt !== "string" ||
      !(typeof parsed.renewalPeriodEnd === "string" || parsed.renewalPeriodEnd === null)
    ) {
      return null;
    }

    return {
      version: 1,
      membershipId: parsed.membershipId,
      eventAt: parsed.eventAt,
      renewalPeriodEnd: parsed.renewalPeriodEnd,
    };
  } catch {
    return null;
  }
}

function validDateOrNull(value?: Date | null) {
  if (!value || Number.isNaN(value.getTime())) return null;
  return value;
}

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

  const [passEntitlement, membershipEntitlement] = await Promise.all([
    prisma.oremea_entitlements.findUnique({
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
    }),
    prisma.oremea_entitlements.findUnique({
      where: {
        user_id_product_key: {
          user_id: userId,
          product_key: COMPASS_MEMBERSHIP_PRODUCT_KEY,
        },
      },
      select: {
        status: true,
        expires_at: true,
        revoked_at: true,
        source_reference: true,
      },
    }),
  ]);

  const passActive = Boolean(
    passEntitlement &&
      passEntitlement.status === "active" &&
      !passEntitlement.revoked_at &&
      isCompassAccessActive(passEntitlement.expires_at, now),
  );
  const membershipActive = Boolean(
    membershipEntitlement &&
      membershipEntitlement.status === "active" &&
      !membershipEntitlement.revoked_at &&
      (!membershipEntitlement.expires_at ||
        membershipEntitlement.expires_at.getTime() > now.getTime()) &&
      readMembershipReference(membershipEntitlement.source_reference)?.membershipId,
  );

  if (!passActive && !membershipActive) {
    return {
      active: false,
      expiresAt: null,
      daysRemaining: 0,
      source: null,
    };
  }

  const passExpiry = passActive ? passEntitlement?.expires_at ?? null : null;
  const membershipExpiry = membershipActive
    ? membershipEntitlement?.expires_at ?? null
    : null;
  const expiresAt =
    !passExpiry || !membershipExpiry
      ? passExpiry ?? membershipExpiry
      : passExpiry.getTime() >= membershipExpiry.getTime()
        ? passExpiry
        : membershipExpiry;
  const source = membershipActive && (!passExpiry || membershipExpiry === expiresAt)
    ? "membership"
    : "pass";

  return {
    active: true,
    expiresAt,
    daysRemaining: expiresAt ? getCompassDaysRemaining(expiresAt, now) : null,
    source,
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

export async function setCompassMembershipAccess({
  userId,
  membershipId,
  active,
  eventAt,
  renewalPeriodEnd,
}: {
  userId: string;
  membershipId: string;
  active: boolean;
  eventAt: Date;
  renewalPeriodEnd?: Date | null;
}) {
  if (!membershipId.trim()) {
    throw new Error("Compass membership requires a Whop membership ID.");
  }
  if (Number.isNaN(eventAt.getTime())) {
    throw new Error("Compass membership requires a valid event time.");
  }

  const normalizedRenewalEnd = validDateOrNull(renewalPeriodEnd);
  const reference: CompassMembershipReference = {
    version: 1,
    membershipId: membershipId.trim(),
    eventAt: eventAt.toISOString(),
    renewalPeriodEnd: normalizedRenewalEnd?.toISOString() ?? null,
  };

  return prisma.$transaction(async (transaction) => {
    const lockKey = `compass-membership:${userId}`;
    await transaction.$queryRaw`SELECT pg_advisory_xact_lock(hashtext(${lockKey}))`;

    const existing = await transaction.oremea_entitlements.findUnique({
      where: {
        user_id_product_key: {
          user_id: userId,
          product_key: COMPASS_MEMBERSHIP_PRODUCT_KEY,
        },
      },
    });
    const existingReference = readMembershipReference(existing?.source_reference ?? null);
    const existingEventAt = existingReference?.eventAt
      ? Date.parse(existingReference.eventAt)
      : Number.NEGATIVE_INFINITY;
    const incomingEventAt = eventAt.getTime();

    if (existingEventAt > incomingEventAt) return existing;
    if (existingEventAt === incomingEventAt && existing) {
      const existingIsActive = existing.status === "active" && !existing.revoked_at;
      if (existingIsActive === active) return existing;
      if (active) return existing; // equal-time deactivation wins
    }

    return transaction.oremea_entitlements.upsert({
      where: {
        user_id_product_key: {
          user_id: userId,
          product_key: COMPASS_MEMBERSHIP_PRODUCT_KEY,
        },
      },
      create: {
        user_id: userId,
        product_key: COMPASS_MEMBERSHIP_PRODUCT_KEY,
        status: active ? "active" : "inactive",
        source: "whop_membership",
        source_reference: JSON.stringify(reference),
        granted_at: eventAt,
        expires_at: normalizedRenewalEnd,
        revoked_at: active ? null : eventAt,
      },
      update: {
        status: active ? "active" : "inactive",
        source: "whop_membership",
        source_reference: JSON.stringify(reference),
        granted_at: active ? eventAt : existing?.granted_at ?? eventAt,
        expires_at: normalizedRenewalEnd,
        revoked_at: active ? null : eventAt,
      },
    });
  });
}
