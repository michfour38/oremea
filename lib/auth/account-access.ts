import { clerkClient } from "@clerk/nextjs/server";

import { prisma } from "@/lib/prisma";

export const ETERNAL_OREMEA_KEY = "oremea:eternal-key";

type SecuritySource = "admin" | "security_detection" | "system";

type SuspendAccountInput = {
  userId: string;
  reason?: string | null;
  source: SecuritySource;
  actorId?: string | null;
  metadata?: Record<string, unknown>;
};

export async function getAccountAccess(userId: string) {
  const [security, eternalKey] = await Promise.all([
    prisma.account_security.findUnique({ where: { user_id: userId } }),
    prisma.oremea_entitlements.findUnique({
      where: {
        user_id_product_key: {
          user_id: userId,
          product_key: ETERNAL_OREMEA_KEY,
        },
      },
    }),
  ]);

  return {
    suspended: security?.status === "suspended",
    suspendedAt: security?.suspended_at ?? null,
    hasEternalKey:
      eternalKey?.status === "active" &&
      !eternalKey.revoked_at &&
      !eternalKey.expires_at,
  };
}

export async function suspendAccount(input: SuspendAccountInput) {
  const client = await clerkClient();
  const user = await client.users.getUser(input.userId);

  if (!user.banned) {
    await client.users.banUser(input.userId);
  }

  const now = new Date();

  return prisma.$transaction(async (tx) => {
    const account = await tx.account_security.upsert({
      where: { user_id: input.userId },
      create: {
        user_id: input.userId,
        status: "suspended",
        suspended_at: now,
        suspended_reason: input.reason ?? null,
        suspended_source: input.source,
        suspended_by: input.actorId ?? null,
      },
      update: {
        status: "suspended",
        suspended_at: now,
        suspended_reason: input.reason ?? null,
        suspended_source: input.source,
        suspended_by: input.actorId ?? null,
      },
    });

    await tx.account_security_events.create({
      data: {
        user_id: input.userId,
        event_type: "suspended",
        source: input.source,
        reason: input.reason ?? null,
        actor_id: input.actorId ?? null,
        metadata: input.metadata ?? {},
      },
    });

    return account;
  });
}

export async function restoreAccount({
  userId,
  actorId,
  reason,
}: {
  userId: string;
  actorId?: string | null;
  reason?: string | null;
}) {
  const client = await clerkClient();
  const user = await client.users.getUser(userId);

  if (user.banned) {
    await client.users.unbanUser(userId);
  }

  return prisma.$transaction(async (tx) => {
    const account = await tx.account_security.upsert({
      where: { user_id: userId },
      create: {
        user_id: userId,
        status: "active",
      },
      update: {
        status: "active",
        suspended_at: null,
        suspended_reason: null,
        suspended_source: null,
        suspended_by: null,
      },
    });

    await tx.account_security_events.create({
      data: {
        user_id: userId,
        event_type: "restored",
        source: "admin",
        reason: reason ?? null,
        actor_id: actorId ?? null,
      },
    });

    return account;
  });
}

export async function recordSecuritySignal({
  userId,
  reason,
  metadata,
}: {
  userId: string;
  reason: string;
  metadata?: Record<string, unknown>;
}) {
  return prisma.$transaction(async (tx) => {
    await tx.account_security.upsert({
      where: { user_id: userId },
      create: { user_id: userId },
      update: {},
    });

    return tx.account_security_events.create({
      data: {
        user_id: userId,
        event_type: "security_signal",
        source: "security_detection",
        reason,
        metadata: metadata ?? {},
      },
    });
  });
}

export async function grantEternalOremeaKey({
  userId,
  actorId,
}: {
  userId: string;
  actorId?: string | null;
}) {
  return prisma.oremea_entitlements.upsert({
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
      source: "admin_eternal_key",
      source_reference: actorId ?? null,
      expires_at: null,
      revoked_at: null,
    },
    update: {
      status: "active",
      source: "admin_eternal_key",
      source_reference: actorId ?? null,
      expires_at: null,
      revoked_at: null,
    },
  });
}
