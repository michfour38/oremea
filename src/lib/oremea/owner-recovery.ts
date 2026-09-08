import { createHash } from "node:crypto";

import { prisma } from "@/lib/prisma";

const DEFAULT_OREMEA_OWNER_USER_ID = "user_3CLGEx3xqgXY6DsIHPyV3yOd1xi";

// Owner-approved demo identity. The raw email is deliberately not committed to
// this public repository; Clerk must verify control of the matching address
// before it can be used to claim owner/demo access.
const APPROVED_DEMO_OWNER_EMAIL_SHA256 =
  "397cf2ef0141578b4a1c64a315b0f5ed127ffd0b680655d590aa5d882ad83e12";

export const OREMEA_OWNER_RECOVERY_PRODUCT_KEY = "oremea_owner_recovery";

type OwnerRecoveryReference = {
  version: 1;
  legacyUserId: string | null;
  recoveredAt: string;
  basis: "legacy_owner_email" | "verified_demo_email";
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

function normalizedEmailDigest(email: string) {
  return createHash("sha256")
    .update(email.trim().toLowerCase(), "utf8")
    .digest("hex");
}

function hasApprovedDemoOwnerEmail(emails: string[]) {
  return emails.some(
    (email) => normalizedEmailDigest(email) === APPROVED_DEMO_OWNER_EMAIL_SHA256,
  );
}

function parseRecoveryReference(value: string | null): OwnerRecoveryReference | null {
  if (!value) return null;

  try {
    const parsed = JSON.parse(value) as Partial<OwnerRecoveryReference> & {
      legacyUserId?: unknown;
      basis?: unknown;
    };

    if (parsed.version !== 1 || typeof parsed.recoveredAt !== "string") {
      return null;
    }

    // Backward compatibility for the recovery records created before the basis
    // field existed.
    if (parsed.basis == null) {
      if (
        typeof parsed.legacyUserId !== "string" ||
        !isConfiguredOremeaOwnerUserId(parsed.legacyUserId)
      ) {
        return null;
      }

      return {
        version: 1,
        legacyUserId: parsed.legacyUserId,
        recoveredAt: parsed.recoveredAt,
        basis: "legacy_owner_email",
      };
    }

    if (parsed.basis === "verified_demo_email") {
      if (!(parsed.legacyUserId === null || parsed.legacyUserId === undefined)) {
        return null;
      }

      return {
        version: 1,
        legacyUserId: null,
        recoveredAt: parsed.recoveredAt,
        basis: "verified_demo_email",
      };
    }

    if (
      parsed.basis === "legacy_owner_email" &&
      typeof parsed.legacyUserId === "string" &&
      isConfiguredOremeaOwnerUserId(parsed.legacyUserId)
    ) {
      return {
        version: 1,
        legacyUserId: parsed.legacyUserId,
        recoveredAt: parsed.recoveredAt,
        basis: "legacy_owner_email",
      };
    }

    return null;
  } catch {
    return null;
  }
}

async function getOremeaOwnerRecoveryReference(userId: string) {
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

  return parseRecoveryReference(entitlement.source_reference);
}

export async function getRecoveredOremeaOwnerLegacyUserId(userId: string) {
  return (await getOremeaOwnerRecoveryReference(userId))?.legacyUserId ?? null;
}

export async function hasOremeaOwnerAccess(userId: string) {
  if (isConfiguredOremeaOwnerUserId(userId)) return true;
  return Boolean(await getOremeaOwnerRecoveryReference(userId));
}

async function writeOwnerRecovery({
  userId,
  reference,
  source,
}: {
  userId: string;
  reference: OwnerRecoveryReference;
  source: string;
}) {
  const recoveredAt = new Date(reference.recoveredAt);

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
      source,
      source_reference: JSON.stringify(reference),
      granted_at: recoveredAt,
      expires_at: null,
      revoked_at: null,
    },
    update: {
      status: "active",
      source,
      source_reference: JSON.stringify(reference),
      granted_at: recoveredAt,
      expires_at: null,
      revoked_at: null,
    },
  });
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

  const existingReference = await getOremeaOwnerRecoveryReference(userId);
  if (existingReference) {
    return {
      active: true,
      recovered: true,
      legacyUserId: existingReference.legacyUserId,
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

  // A verified owner-approved demo email gets durable owner/demo access without
  // exposing the raw email in source control. Typing an address into a form is
  // not sufficient; Clerk must report the address as verified first.
  if (hasApprovedDemoOwnerEmail(normalizedEmails)) {
    const recoveredAt = new Date();
    const reference: OwnerRecoveryReference = {
      version: 1,
      legacyUserId: null,
      recoveredAt: recoveredAt.toISOString(),
      basis: "verified_demo_email",
    };

    await writeOwnerRecovery({
      userId,
      reference,
      source: "verified_demo_owner_email",
    });

    return {
      active: true,
      recovered: true,
      legacyUserId: null,
    };
  }

  // Legacy recovery remains anchored to participant evidence already stored for
  // the configured owner identity.
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
    basis: "legacy_owner_email",
  };

  await writeOwnerRecovery({
    userId,
    reference,
    source: "verified_legacy_owner_email",
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
