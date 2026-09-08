import { prisma } from "@/lib/prisma";

const DEFAULT_OREMEA_OWNER_USER_ID = "user_3CLGEx3xqgXY6DsIHPyV3yOd1xi";

export const OREMEA_OWNER_RECOVERY_PRODUCT_KEY = "oremea_owner_recovery";

type OwnerRecoveryReference = {
  version: 1;
  legacyUserId: string;
  recoveredAt: string;
};

function normalizedOwnerIds() {
  return Array.from(
    new Set(
      [
        process.env.RECOGNITION_OWNER_USER_ID?.trim(),
        process.env.COMPASS_OWNER_USER_ID?.trim(),
        DEFAULT_OREMEA_OWNER_USER_ID,
      ].filter((value): value is string => Boolean(value)),
    ),
  );
}

export function isConfiguredOremeaOwnerUserId(userId: string) {
  return normalizedOwnerIds().includes(userId);
}

function parseRecoveryReference(value: string | null): OwnerRecoveryReference | null {
  if (!value) return null;

  try {
    const parsed = JSON.parse(value) as Partial<OwnerRecoveryReference>;
    if (
      parsed.version !== 1 ||
      typeof parsed.legacyUserId !== "string" ||
      typeof parsed.recoveredAt !== "string" ||
      !isConfiguredOremeaOwnerUserId(parsed.legacyUserId)
    ) {
      return null;
    }

    return {
      version: 1,
      legacyUserId: parsed.legacyUserId,
      recoveredAt: parsed.recoveredAt,
    };
  } catch {
    return null;
  }
}

export async function getRecoveredOremeaOwnerLegacyUserId(userId: string) {
  const entitlement = await prisma.oremea_entitlements.findUnique({
    where: {
      user_id_product_key: {
        user_id: userId,
        product_key: OREMEA_OWNER_RECOVERY_PRODUCT_KEY,
      },
    },
    select: {
      status: true,
      source_reference: true,
      revoked_at: true,
    },
  });

  if (!entitlement || entitlement.status !== "active" || entitlement.revoked_at) {
    return null;
  }

  return parseRecoveryReference(entitlement.source_reference)?.legacyUserId ?? null;
}

export async function hasOremeaOwnerAccess(userId: string) {
  if (isConfiguredOremeaOwnerUserId(userId)) return true;
  return Boolean(await getRecoveredOremeaOwnerLegacyUserId(userId));
}

export async function recoverOremeaOwnerAccess({
  userId,
  verifiedEmails,
}: {
  userId: string;
  verifiedEmails: string[];
}) {
  if (isConfiguredOremeaOwnerUserId(userId)) {
    return {
      active: true,
      recovered: false,
      legacyUserId: userId,
    };
  }

  const existingLegacyUserId = await getRecoveredOremeaOwnerLegacyUserId(userId);
  if (existingLegacyUserId) {
    return {
      active: true,
      recovered: true,
      legacyUserId: existingLegacyUserId,
    };
  }

  const normalizedEmails = Array.from(
    new Set(
      verifiedEmails
        .map((email) => email.trim().toLowerCase())
        .filter((email) => email.length > 0 && email.includes("@")),
    ),
  );

  if (normalizedEmails.length === 0) {
    return {
      active: false,
      recovered: false,
      legacyUserId: null,
    };
  }

  // Recovery is intentionally anchored to participant evidence already stored
  // for the configured owner identity. A person must first prove control of the
  // same email through Clerk; an email typed into a form is never sufficient.
  const matchingThreads = await prisma.recognition_threads.findMany({
    where: {
      primary_email: {
        in: normalizedEmails,
      },
    },
    select: {
      user_id: true,
    },
    orderBy: {
      created_at: "desc",
    },
    take: 20,
  });

  const legacyUserId = matchingThreads
    .map((thread) => thread.user_id)
    .find(isConfiguredOremeaOwnerUserId);

  if (!legacyUserId) {
    return {
      active: false,
      recovered: false,
      legacyUserId: null,
    };
  }

  const recoveredAt = new Date();
  const reference: OwnerRecoveryReference = {
    version: 1,
    legacyUserId,
    recoveredAt: recoveredAt.toISOString(),
  };

  await prisma.oremea_entitlements.upsert({
    where: {
      user_id_product_key: {
        user_id: userId,
        product_key: OREMEA_OWNER_RECOVERY_PRODUCT_KEY,
      },
    },
    create: {
      user_id: userId,
      product_key: OREMEA_OWNER_RECOVERY_PRODUCT_KEY,
      status: "active",
      source: "verified_legacy_owner_email",
      source_reference: JSON.stringify(reference),
      granted_at: recoveredAt,
      expires_at: null,
      revoked_at: null,
    },
    update: {
      status: "active",
      source: "verified_legacy_owner_email",
      source_reference: JSON.stringify(reference),
      granted_at: recoveredAt,
      expires_at: null,
      revoked_at: null,
    },
  });

  return {
    active: true,
    recovered: true,
    legacyUserId,
  };
}

export async function getOremeaOwnerResetUserIds(userId: string) {
  const ids = new Set([userId]);
  const legacyUserId = await getRecoveredOremeaOwnerLegacyUserId(userId);
  if (legacyUserId) ids.add(legacyUserId);
  return Array.from(ids);
}
