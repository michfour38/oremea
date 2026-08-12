import { prisma } from "@/lib/prisma";

const RECOGNITION_MEMBERSHIP_USER_PREFIX = "recognition-membership-email:";

export const CURRENT_MEMBERSHIP_PRODUCT_KEY = "current_membership";
export const CURRENT_INVITATION_STATUS = {
  pending: "pending",
  accepted: "accepted",
  declined: "declined",
} as const;

function normalizeEmail(value: string) {
  return value.trim().toLowerCase();
}

function recognitionMembershipUserId(email: string) {
  return `${RECOGNITION_MEMBERSHIP_USER_PREFIX}${normalizeEmail(email)}`;
}

function validDateOrNull(value?: Date | null) {
  if (!value || Number.isNaN(value.getTime())) return null;
  return value;
}

export async function getOremeaMemberState({
  userId,
  emails,
}: {
  userId: string;
  emails: string[];
}) {
  const normalizedEmails = Array.from(
    new Set(emails.map(normalizeEmail).filter((email) => email.includes("@"))),
  );
  const recognitionMembershipIds = normalizedEmails.map(
    recognitionMembershipUserId,
  );

  const [entitlement, purchasedResonanceRun, legacyPaidEntry] = await Promise.all([
    prisma.oremea_entitlements.findFirst({
      where: {
        OR: [
          { user_id: userId, product_key: { startsWith: "recognition" } },
          { user_id: userId, product_key: { startsWith: "resonance" } },
          { user_id: userId, product_key: { startsWith: "compass" } },
          { user_id: userId, product_key: { startsWith: "current" } },
          ...(recognitionMembershipIds.length > 0
            ? [
                {
                  user_id: { in: recognitionMembershipIds },
                  product_key: { startsWith: "recognition" },
                },
              ]
            : []),
        ],
      },
      select: { id: true },
    }),
    prisma.resonance_week_runs.findFirst({
      where: {
        user_id: userId,
        purchase_reference: { not: null },
      },
      select: { id: true },
    }),
    normalizedEmails.length > 0
      ? prisma.entry_leads.findFirst({
          where: {
            email: { in: normalizedEmails },
            entry_paid_at: { not: null },
          },
          select: { id: true },
        })
      : null,
  ]);

  return {
    member: Boolean(entitlement || purchasedResonanceRun || legacyPaidEntry),
  };
}

export async function getCurrentAccessState(
  userId: string,
  now = new Date(),
) {
  const entitlement = await prisma.oremea_entitlements.findUnique({
    where: {
      user_id_product_key: {
        user_id: userId,
        product_key: CURRENT_MEMBERSHIP_PRODUCT_KEY,
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
      (!entitlement.expires_at || entitlement.expires_at.getTime() > now.getTime()),
  );

  return {
    active,
    expiresAt: active ? entitlement?.expires_at ?? null : null,
    accessUrl: active ? process.env.CURRENT_ACCESS_URL?.trim() || null : null,
  };
}

export async function listPendingCurrentInvitations(userId: string) {
  return prisma.current_invitations.findMany({
    where: {
      user_id: userId,
      status: CURRENT_INVITATION_STATUS.pending,
    },
    orderBy: { created_at: "desc" },
    select: {
      id: true,
      source_product: true,
      source_instance_id: true,
      trigger_key: true,
      checkout_started_at: true,
      created_at: true,
    },
  });
}

export async function createCurrentInvitation({
  userId,
  sourceProduct,
  sourceInstanceId,
  triggerKey,
}: {
  userId: string;
  sourceProduct: string;
  sourceInstanceId: string;
  triggerKey: string;
}) {
  const product = sourceProduct.trim().toLowerCase();
  const instanceId = sourceInstanceId.trim();
  const trigger = triggerKey.trim();

  if (!userId.trim() || !product || !instanceId || !trigger) {
    throw new Error("The Current invitation requires a user, product, instance and trigger.");
  }

  if ((await getCurrentAccessState(userId)).active) {
    return null;
  }

  return prisma.$transaction(async (transaction) => {
    const lockKey = `current-invite:${userId}:${product}:${instanceId}`;
    await transaction.$queryRaw`SELECT pg_advisory_xact_lock(hashtext(${lockKey}))`;

    const existing = await transaction.current_invitations.findUnique({
      where: {
        user_id_source_product_source_instance_id: {
          user_id: userId,
          source_product: product,
          source_instance_id: instanceId,
        },
      },
    });

    if (existing) return existing;

    return transaction.current_invitations.create({
      data: {
        user_id: userId,
        source_product: product,
        source_instance_id: instanceId,
        trigger_key: trigger,
        status: CURRENT_INVITATION_STATUS.pending,
      },
    });
  });
}

export async function declineCurrentInvitation({
  userId,
  invitationId,
}: {
  userId: string;
  invitationId: string;
}) {
  const invitation = await prisma.current_invitations.findFirst({
    where: {
      id: invitationId,
      user_id: userId,
      status: CURRENT_INVITATION_STATUS.pending,
    },
    select: { id: true },
  });

  if (!invitation) return null;

  const now = new Date();
  return prisma.current_invitations.update({
    where: { id: invitation.id },
    data: {
      status: CURRENT_INVITATION_STATUS.declined,
      declined_at: now,
      resolved_at: now,
    },
  });
}

export async function startCurrentCheckout({
  userId,
  invitationId,
}: {
  userId: string;
  invitationId: string;
}) {
  const invitation = await prisma.current_invitations.findFirst({
    where: {
      id: invitationId,
      user_id: userId,
      status: CURRENT_INVITATION_STATUS.pending,
    },
    select: { id: true },
  });

  if (!invitation) return null;

  const checkoutUrl = process.env.CURRENT_CHECKOUT_URL?.trim() || "";
  if (!checkoutUrl) {
    throw new Error("The Current checkout has not been connected yet.");
  }

  await prisma.current_invitations.update({
    where: { id: invitation.id },
    data: { checkout_started_at: new Date() },
  });

  // Starting checkout deliberately does not resolve the invitation. If payment
  // is abandoned or fails, the invitation remains available until the member
  // explicitly declines it or a verified Current membership activates.
  return { checkoutUrl };
}

export async function setCurrentMembershipAccess({
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
    throw new Error("The Current membership requires a Whop membership ID.");
  }
  if (Number.isNaN(eventAt.getTime())) {
    throw new Error("The Current membership requires a valid event time.");
  }

  const expiresAt = validDateOrNull(renewalPeriodEnd);
  const sourceReference = JSON.stringify({
    version: 1,
    membershipId: membershipId.trim(),
    eventAt: eventAt.toISOString(),
    renewalPeriodEnd: expiresAt?.toISOString() ?? null,
  });

  return prisma.$transaction(async (transaction) => {
    const lockKey = `current-membership:${userId}`;
    await transaction.$queryRaw`SELECT pg_advisory_xact_lock(hashtext(${lockKey}))`;

    const entitlement = await transaction.oremea_entitlements.upsert({
      where: {
        user_id_product_key: {
          user_id: userId,
          product_key: CURRENT_MEMBERSHIP_PRODUCT_KEY,
        },
      },
      create: {
        user_id: userId,
        product_key: CURRENT_MEMBERSHIP_PRODUCT_KEY,
        status: active ? "active" : "inactive",
        source: "whop_membership",
        source_reference: sourceReference,
        granted_at: eventAt,
        expires_at: expiresAt,
        revoked_at: active ? null : eventAt,
      },
      update: {
        status: active ? "active" : "inactive",
        source: "whop_membership",
        source_reference: sourceReference,
        granted_at: active ? eventAt : undefined,
        expires_at: expiresAt,
        revoked_at: active ? null : eventAt,
      },
    });

    if (active) {
      await transaction.current_invitations.updateMany({
        where: {
          user_id: userId,
          status: CURRENT_INVITATION_STATUS.pending,
        },
        data: {
          status: CURRENT_INVITATION_STATUS.accepted,
          accepted_at: eventAt,
          resolved_at: eventAt,
        },
      });
    }

    return entitlement;
  });
}
