import { hasEternalOremeaKey } from "@/lib/auth/account-access";
import { prisma } from "@/lib/prisma";

export const CREATOR_SILVER_KEY = "oremea:creator-silver-key";
export const CREATOR_SILVER_PRODUCT_DAYS = 30;
export const CREATOR_SILVER_RESONANCE_CREDITS = 3;
export const CREATOR_SILVER_RESONANCE_PLAN_ID = "grant:creator-silver-key";

const PRODUCT_WINDOW_MS = CREATOR_SILVER_PRODUCT_DAYS * 24 * 60 * 60 * 1000;

export type CreatorSilverProduct = "recognition" | "compass";

export type CreatorSilverProductAccess = {
  eligible: boolean;
  active: boolean;
  activatedAt: Date | null;
  expiresAt: Date | null;
};

function productFields(product: CreatorSilverProduct) {
  return product === "recognition"
    ? {
        activatedAt: "recognition_activated_at" as const,
        expiresAt: "recognition_expires_at" as const,
      }
    : {
        activatedAt: "compass_activated_at" as const,
        expiresAt: "compass_expires_at" as const,
      };
}

export async function hasCreatorSilverKey(userId: string) {
  const [entitlement, issuance] = await Promise.all([
    prisma.oremea_entitlements.findUnique({
      where: {
        user_id_product_key: {
          user_id: userId,
          product_key: CREATOR_SILVER_KEY,
        },
      },
      select: { status: true, revoked_at: true, expires_at: true },
    }),
    prisma.oremea_creator_silver_key_issuances.findFirst({
      where: { current_user_id: userId, revoked_at: null },
      select: { id: true },
    }),
  ]);

  return Boolean(
    entitlement?.status === "active" &&
      !entitlement.revoked_at &&
      !entitlement.expires_at &&
      issuance,
  );
}

export async function getCreatorSilverProductAccess(
  userId: string,
  product: CreatorSilverProduct,
  now = new Date(),
): Promise<CreatorSilverProductAccess> {
  const fields = productFields(product);
  const issuance = await prisma.oremea_creator_silver_key_issuances.findFirst({
    where: { current_user_id: userId, revoked_at: null },
    select: {
      recognition_activated_at: true,
      recognition_expires_at: true,
      compass_activated_at: true,
      compass_expires_at: true,
    },
  });

  if (!issuance || !(await hasCreatorSilverKey(userId))) {
    return {
      eligible: false,
      active: false,
      activatedAt: null,
      expiresAt: null,
    };
  }

  const activatedAt = issuance[fields.activatedAt];
  const expiresAt = issuance[fields.expiresAt];

  return {
    eligible: true,
    active: Boolean(activatedAt && expiresAt && expiresAt.getTime() > now.getTime()),
    activatedAt,
    expiresAt,
  };
}

export async function activateCreatorSilverProduct(
  userId: string,
  product: CreatorSilverProduct,
  now = new Date(),
): Promise<CreatorSilverProductAccess> {
  if (!(await hasCreatorSilverKey(userId))) {
    return {
      eligible: false,
      active: false,
      activatedAt: null,
      expiresAt: null,
    };
  }

  // Golden Key is the stronger entitlement. If an identity holds both keys,
  // entering a product must not silently consume its finite Silver window.
  if (await hasEternalOremeaKey(userId)) {
    return getCreatorSilverProductAccess(userId, product, now);
  }

  const fields = productFields(product);

  return prisma.$transaction(async (transaction) => {
    const lockKey = `creator-silver-key:${userId}`;
    // PostgreSQL advisory locks return void. Cast the result so Prisma can
    // deserialize it while retaining the blocking transaction lock.
    await transaction.$queryRaw`SELECT pg_advisory_xact_lock(hashtext(${lockKey}))::text`;

    const [entitlement, issuance] = await Promise.all([
      transaction.oremea_entitlements.findUnique({
        where: {
          user_id_product_key: {
            user_id: userId,
            product_key: CREATOR_SILVER_KEY,
          },
        },
        select: { status: true, revoked_at: true, expires_at: true },
      }),
      transaction.oremea_creator_silver_key_issuances.findFirst({
        where: { current_user_id: userId, revoked_at: null },
      }),
    ]);

    if (
      !issuance ||
      entitlement?.status !== "active" ||
      entitlement.revoked_at ||
      entitlement.expires_at
    ) {
      return {
        eligible: false,
        active: false,
        activatedAt: null,
        expiresAt: null,
      };
    }

    const existingActivatedAt = issuance[fields.activatedAt];
    const existingExpiresAt = issuance[fields.expiresAt];

    if (existingActivatedAt && existingExpiresAt) {
      return {
        eligible: true,
        active: existingExpiresAt.getTime() > now.getTime(),
        activatedAt: existingActivatedAt,
        expiresAt: existingExpiresAt,
      };
    }

    const expiresAt = new Date(now.getTime() + PRODUCT_WINDOW_MS);
    const data =
      product === "recognition"
        ? {
            recognition_activated_at: now,
            recognition_expires_at: expiresAt,
          }
        : {
            compass_activated_at: now,
            compass_expires_at: expiresAt,
          };

    await transaction.oremea_creator_silver_key_issuances.update({
      where: { id: issuance.id },
      data,
    });

    await transaction.oremea_creator_silver_key_events.create({
      data: {
        issuance_id: issuance.id,
        event_type: `${product}_activated`,
        user_id: userId,
        metadata: {
          activatedAt: now.toISOString(),
          expiresAt: expiresAt.toISOString(),
          days: CREATOR_SILVER_PRODUCT_DAYS,
        },
      },
    });

    return {
      eligible: true,
      active: true,
      activatedAt: now,
      expiresAt,
    };
  });
}

export async function getCreatorSilverKeyInfo(userId: string, now = new Date()) {
  const issuance = await prisma.oremea_creator_silver_key_issuances.findFirst({
    where: { current_user_id: userId, revoked_at: null },
  });

  if (!issuance || !(await hasCreatorSilverKey(userId))) return null;

  const resonanceRemaining = issuance.resonance_order_id
    ? await prisma.resonance_visit_orders.findUnique({
        where: { id: issuance.resonance_order_id },
        select: { remaining_quantity: true, status: true },
      })
    : null;

  return {
    email: issuance.email_normalized,
    recognition: {
      activatedAt: issuance.recognition_activated_at,
      expiresAt: issuance.recognition_expires_at,
      active: Boolean(
        issuance.recognition_expires_at &&
          issuance.recognition_expires_at.getTime() > now.getTime(),
      ),
    },
    compass: {
      activatedAt: issuance.compass_activated_at,
      expiresAt: issuance.compass_expires_at,
      active: Boolean(
        issuance.compass_expires_at &&
          issuance.compass_expires_at.getTime() > now.getTime(),
      ),
    },
    resonance: {
      total: CREATOR_SILVER_RESONANCE_CREDITS,
      remaining:
        resonanceRemaining?.status === "paid"
          ? resonanceRemaining.remaining_quantity
          : 0,
    },
  };
}
