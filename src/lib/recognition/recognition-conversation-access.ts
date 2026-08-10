import { prisma } from "@/lib/prisma";
import { normalizeRecognitionEmail } from "./recognition-access";

const MEMBERSHIP_USER_PREFIX = "recognition-membership-email:";
const DEFAULT_RECOGNITION_OWNER_USER_ID = "user_3CLGEx3xqgXY6DsIHPyV3yOd1xi";

export const RECOGNITION_MEMBERSHIP_PRODUCT_KEY = "recognition_membership";

export type RecognitionConversationAccess = {
  active: boolean;
  source: "owner" | "membership" | null;
  matchedEmail: string | null;
  purchasedAt: Date | null;
  expiresAt: Date | null;
};

type RecognitionMembershipReference = {
  version: 1;
  membershipId: string;
  eventAt: string;
  renewalPeriodEnd: string | null;
};

function readMembershipReference(value: string | null): RecognitionMembershipReference | null {
  if (!value) return null;

  try {
    const parsed = JSON.parse(value) as Partial<RecognitionMembershipReference>;
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

function membershipUserId(email: string) {
  return `${MEMBERSHIP_USER_PREFIX}${normalizeRecognitionEmail(email)}`;
}

function validDateOrNull(value?: Date | null) {
  if (!value || Number.isNaN(value.getTime())) return null;
  return value;
}

export function isRecognitionOwner(userId: string) {
  const configured = process.env.RECOGNITION_OWNER_USER_ID?.trim();
  return userId === (configured || DEFAULT_RECOGNITION_OWNER_USER_ID);
}

export async function setRecognitionMembershipAccess({
  email,
  membershipId,
  active,
  eventAt,
  renewalPeriodEnd,
}: {
  email: string;
  membershipId: string;
  active: boolean;
  eventAt: Date;
  renewalPeriodEnd?: Date | null;
}) {
  const normalizedEmail = normalizeRecognitionEmail(email);
  if (!normalizedEmail || !normalizedEmail.includes("@")) {
    throw new Error("Recognition membership requires a valid buyer email.");
  }
  if (!membershipId.trim()) {
    throw new Error("Recognition membership requires a Whop membership ID.");
  }
  if (Number.isNaN(eventAt.getTime())) {
    throw new Error("Recognition membership requires a valid event time.");
  }

  const userId = membershipUserId(normalizedEmail);
  const normalizedRenewalEnd = validDateOrNull(renewalPeriodEnd);
  const reference: RecognitionMembershipReference = {
    version: 1,
    membershipId: membershipId.trim(),
    eventAt: eventAt.toISOString(),
    renewalPeriodEnd: normalizedRenewalEnd?.toISOString() ?? null,
  };

  return prisma.$transaction(async (transaction) => {
    const lockKey = `recognition-membership:${normalizedEmail}`;
    await transaction.$queryRaw`SELECT pg_advisory_xact_lock(hashtext(${lockKey}))`;

    const existing = await transaction.oremea_entitlements.findUnique({
      where: {
        user_id_product_key: {
          user_id: userId,
          product_key: RECOGNITION_MEMBERSHIP_PRODUCT_KEY,
        },
      },
    });
    const existingReference = readMembershipReference(existing?.source_reference ?? null);
    const existingEventAt = existingReference?.eventAt
      ? Date.parse(existingReference.eventAt)
      : Number.NEGATIVE_INFINITY;
    const incomingEventAt = eventAt.getTime();

    if (existingEventAt > incomingEventAt) {
      return existing;
    }

    if (existingEventAt === incomingEventAt && existing) {
      const existingIsActive =
        existing.status === "active" && !existing.revoked_at;

      if (existingIsActive === active) {
        return existing;
      }

      // Whop does not guarantee webhook order. If activation and deactivation
      // share the same event time, fail closed: deactivation wins.
      if (!active) {
        // continue into the inactive update below
      } else {
        return existing;
      }
    }

    return transaction.oremea_entitlements.upsert({
      where: {
        user_id_product_key: {
          user_id: userId,
          product_key: RECOGNITION_MEMBERSHIP_PRODUCT_KEY,
        },
      },
      create: {
        user_id: userId,
        product_key: RECOGNITION_MEMBERSHIP_PRODUCT_KEY,
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

export async function getRecognitionConversationAccess({
  userId,
  emails,
  now = new Date(),
}: {
  userId: string;
  emails: string[];
  now?: Date;
}): Promise<RecognitionConversationAccess> {
  if (isRecognitionOwner(userId)) {
    return {
      active: true,
      source: "owner",
      matchedEmail: normalizeRecognitionEmail(emails[0] ?? "") || null,
      purchasedAt: null,
      expiresAt: null,
    };
  }

  const normalizedEmails = Array.from(
    new Set(
      emails
        .map(normalizeRecognitionEmail)
        .filter((email) => email.length > 0 && email.includes("@")),
    ),
  );

  if (normalizedEmails.length === 0) {
    return {
      active: false,
      source: null,
      matchedEmail: null,
      purchasedAt: null,
      expiresAt: null,
    };
  }

  const membershipEntitlements = await prisma.oremea_entitlements.findMany({
    where: {
      product_key: RECOGNITION_MEMBERSHIP_PRODUCT_KEY,
      user_id: {
        in: normalizedEmails.map(membershipUserId),
      },
      status: "active",
      revoked_at: null,
    },
    select: {
      user_id: true,
      source_reference: true,
      granted_at: true,
      expires_at: true,
    },
  });

  for (const entitlement of membershipEntitlements) {
    if (entitlement.expires_at && entitlement.expires_at.getTime() <= now.getTime()) {
      continue;
    }

    const reference = readMembershipReference(entitlement.source_reference);
    if (!reference?.membershipId) continue;

    const matchedEmail = entitlement.user_id.startsWith(MEMBERSHIP_USER_PREFIX)
      ? entitlement.user_id.slice(MEMBERSHIP_USER_PREFIX.length)
      : null;

    return {
      active: true,
      source: "membership",
      matchedEmail,
      purchasedAt: entitlement.granted_at,
      expiresAt: entitlement.expires_at,
    };
  }

  return {
    active: false,
    source: null,
    matchedEmail: null,
    purchasedAt: null,
    expiresAt: null,
  };
}
