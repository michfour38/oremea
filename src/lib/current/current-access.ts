import type { Prisma } from "@prisma/client";

import { prisma } from "@/lib/prisma";

const RECOGNITION_MEMBERSHIP_USER_PREFIX = "recognition-membership-email:";
const CURRENT_LAUNCH_STATE_ID = "the_current";
const DEFAULT_CURRENT_LAUNCH_THRESHOLD = 50;
const DEFAULT_RECOGNITION_QUALIFY_AFTER_USER_TURNS = 7;

export const CURRENT_MEMBERSHIP_PRODUCT_KEY = "current_membership";
export const CURRENT_INVITATION_STATUS = {
  pending: "pending",
  accepted: "accepted",
  declined: "declined",
} as const;

function positiveInteger(value: string | undefined, fallback: number) {
  const parsed = Number.parseInt(value?.trim() || "", 10);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
}

export function getCurrentLaunchThreshold() {
  return positiveInteger(
    process.env.CURRENT_LAUNCH_THRESHOLD,
    DEFAULT_CURRENT_LAUNCH_THRESHOLD,
  );
}

export function getRecognitionCurrentQualificationTurns() {
  return positiveInteger(
    process.env.CURRENT_RECOGNITION_QUALIFY_AFTER_USER_TURNS,
    DEFAULT_RECOGNITION_QUALIFY_AFTER_USER_TURNS,
  );
}

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

function normalizedQualificationInput({
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
  const normalized = {
    userId: userId.trim(),
    sourceProduct: sourceProduct.trim().toLowerCase(),
    sourceInstanceId: sourceInstanceId.trim(),
    triggerKey: triggerKey.trim(),
  };

  if (
    !normalized.userId ||
    !normalized.sourceProduct ||
    !normalized.sourceInstanceId ||
    !normalized.triggerKey
  ) {
    throw new Error(
      "The Current qualification requires a user, product, instance and trigger.",
    );
  }

  return normalized;
}

async function getCurrentLaunchStateWithClient(
  client: Prisma.TransactionClient | typeof prisma,
) {
  const state = await client.current_launch_state.findUnique({
    where: { id: CURRENT_LAUNCH_STATE_ID },
    select: { launched_at: true },
  });

  return {
    launched: Boolean(state?.launched_at),
    launchedAt: state?.launched_at ?? null,
  };
}

export async function getCurrentLaunchState() {
  return getCurrentLaunchStateWithClient(prisma);
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
  const launch = await getCurrentLaunchState();
  if (!launch.launched) return [];

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

async function createInvitationInTransaction(
  transaction: Prisma.TransactionClient,
  qualification: {
    user_id: string;
    source_product: string;
    source_instance_id: string;
    trigger_key: string;
  },
) {
  return transaction.current_invitations.upsert({
    where: {
      user_id_source_product_source_instance_id: {
        user_id: qualification.user_id,
        source_product: qualification.source_product,
        source_instance_id: qualification.source_instance_id,
      },
    },
    create: {
      user_id: qualification.user_id,
      source_product: qualification.source_product,
      source_instance_id: qualification.source_instance_id,
      trigger_key: qualification.trigger_key,
      status: CURRENT_INVITATION_STATUS.pending,
    },
    update: {},
  });
}

export async function qualifyForCurrent(input: {
  userId: string;
  sourceProduct: string;
  sourceInstanceId: string;
  triggerKey: string;
}) {
  const normalized = normalizedQualificationInput(input);

  if ((await getCurrentAccessState(normalized.userId)).active) {
    return { qualified: true, invited: false, launched: true, alreadyActive: true };
  }

  const now = new Date();

  return prisma.$transaction(async (transaction) => {
    await transaction.$queryRaw`SELECT pg_advisory_xact_lock(hashtext('current-launch-gate'))`;

    const qualification = await transaction.current_qualifications.upsert({
      where: { user_id: normalized.userId },
      create: {
        user_id: normalized.userId,
        source_product: normalized.sourceProduct,
        source_instance_id: normalized.sourceInstanceId,
        trigger_key: normalized.triggerKey,
        qualified_at: now,
      },
      update: {},
    });

    let launch = await transaction.current_launch_state.upsert({
      where: { id: CURRENT_LAUNCH_STATE_ID },
      create: { id: CURRENT_LAUNCH_STATE_ID },
      update: {},
      select: { launched_at: true },
    });

    if (!launch.launched_at) {
      const qualifiedCount = await transaction.current_qualifications.count();
      if (qualifiedCount < getCurrentLaunchThreshold()) {
        return {
          qualified: true,
          invited: false,
          launched: false,
          alreadyActive: false,
        };
      }

      launch = await transaction.current_launch_state.update({
        where: { id: CURRENT_LAUNCH_STATE_ID },
        data: { launched_at: now },
        select: { launched_at: true },
      });
    }

    const waiting = await transaction.current_qualifications.findMany({
      where: { invited_at: null },
      select: {
        user_id: true,
        source_product: true,
        source_instance_id: true,
        trigger_key: true,
      },
    });

    for (const waitingQualification of waiting) {
      await createInvitationInTransaction(transaction, waitingQualification);
    }

    if (waiting.length > 0) {
      await transaction.current_qualifications.updateMany({
        where: { user_id: { in: waiting.map((item) => item.user_id) } },
        data: { invited_at: now },
      });
    }

    return {
      qualified: true,
      invited: waiting.some((item) => item.user_id === normalized.userId),
      launched: Boolean(launch.launched_at),
      alreadyActive: false,
    };
  });
}

export async function createCurrentInvitation(input: {
  userId: string;
  sourceProduct: string;
  sourceInstanceId: string;
  triggerKey: string;
}) {
  const normalized = normalizedQualificationInput(input);
  const launch = await getCurrentLaunchState();
  if (!launch.launched) return null;

  if ((await getCurrentAccessState(normalized.userId)).active) {
    return null;
  }

  return prisma.$transaction(async (transaction) => {
    const lockKey = `current-invite:${normalized.userId}:${normalized.sourceProduct}:${normalized.sourceInstanceId}`;
    await transaction.$queryRaw`SELECT pg_advisory_xact_lock(hashtext(${lockKey}))`;

    return createInvitationInTransaction(transaction, {
      user_id: normalized.userId,
      source_product: normalized.sourceProduct,
      source_instance_id: normalized.sourceInstanceId,
      trigger_key: normalized.triggerKey,
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
  const launch = await getCurrentLaunchState();
  if (!launch.launched) {
    throw new Error("The Current is still forming and checkout is locked.");
  }

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

function sourceReferenceEventAt(value: string | null) {
  if (!value) return null;
  try {
    const parsed = JSON.parse(value) as { eventAt?: unknown };
    if (typeof parsed.eventAt !== "string") return null;
    const date = new Date(parsed.eventAt);
    return Number.isNaN(date.getTime()) ? null : date;
  } catch {
    return null;
  }
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

    const existing = await transaction.oremea_entitlements.findUnique({
      where: {
        user_id_product_key: {
          user_id: userId,
          product_key: CURRENT_MEMBERSHIP_PRODUCT_KEY,
        },
      },
      select: { source_reference: true },
    });
    const previousEventAt = sourceReferenceEventAt(existing?.source_reference ?? null);
    if (previousEventAt && previousEventAt.getTime() > eventAt.getTime()) {
      return transaction.oremea_entitlements.findUnique({
        where: {
          user_id_product_key: {
            user_id: userId,
            product_key: CURRENT_MEMBERSHIP_PRODUCT_KEY,
          },
        },
      });
    }

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
