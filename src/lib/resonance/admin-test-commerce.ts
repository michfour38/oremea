import { prisma } from "@/lib/prisma";
import { isOremeaAdmin } from "@/lib/auth/admin-access";
import { additionalOffers, initialOffer } from "./visit-offers";
import { lockResonanceAccount } from "./resonance-account-lock";
import { uuidSchema } from "./visit-payment-contract";

const ADMIN_TEST_PLAN_PREFIX = "admin-test:resonance:";
const ADMIN_TEST_CREATED_AT = new Date("2000-01-01T00:00:00.000Z");

export function isAdminTestVisitPlan(planId: string | null | undefined) {
  return Boolean(planId?.startsWith(ADMIN_TEST_PLAN_PREFIX));
}

async function requireAdmin(userId: string) {
  if (!(await isOremeaAdmin(userId))) {
    throw new Error("Admin test purchase is not available for this account.");
  }
}

export async function simulateAdminInitialVisitPurchase(input: {
  userId: string;
  email: string;
  quantity: number;
  requestId: string;
}) {
  await requireAdmin(input.userId);
  uuidSchema.parse(input.requestId);
  const offer = initialOffer(input.quantity);

  return prisma.$transaction(async (tx) => {
    await lockResonanceAccount(tx, input.userId);

    const existing = await tx.resonance_visit_orders.findUnique({
      where: { id: input.requestId },
    });
    if (existing) {
      if (
        existing.user_id !== input.userId ||
        existing.kind !== "initial" ||
        existing.quantity !== offer.quantity ||
        !isAdminTestVisitPlan(existing.whop_plan_id)
      ) {
        throw new Error("Admin test request does not match the existing order.");
      }
      return existing.id;
    }

    const now = new Date();
    const order = await tx.resonance_visit_orders.create({
      data: {
        id: input.requestId,
        user_id: input.userId,
        buyer_email: input.email.trim().toLowerCase(),
        kind: "initial",
        quantity: offer.quantity,
        amount_cents: offer.amountCents,
        remaining_quantity: offer.quantity,
        status: "paid",
        whop_plan_id: `${ADMIN_TEST_PLAN_PREFIX}initial:${offer.quantity}`,
        affiliate_code: null,
        paid_at: now,
        created_at: ADMIN_TEST_CREATED_AT,
      },
    });

    return order.id;
  });
}

export async function simulateAdminVisitAddition(input: {
  userId: string;
  parentId: string;
  quantity: number;
}) {
  await requireAdmin(input.userId);
  uuidSchema.parse(input.parentId);

  return prisma.$transaction(async (tx) => {
    await lockResonanceAccount(tx, input.userId);

    const parent = await tx.resonance_visit_orders.findFirst({
      where: { id: input.parentId, user_id: input.userId },
    });
    if (!parent || parent.kind !== "initial" || parent.status !== "paid") {
      throw new Error("A paid initial order is required.");
    }

    const existing = await tx.resonance_visit_orders.findUnique({
      where: { parent_id: parent.id },
    });
    if (existing) return existing.id;
    if (parent.offer_closed_at) throw new Error("This additional offer is closed.");

    const offer = additionalOffers(parent.quantity).find(
      (item) => item.quantity === input.quantity,
    );
    if (!offer) throw new Error("This additional offer is not available.");

    const now = new Date();
    const order = await tx.resonance_visit_orders.create({
      data: {
        user_id: input.userId,
        buyer_email: parent.buyer_email,
        parent_id: parent.id,
        kind: offer.kind,
        quantity: offer.quantity,
        amount_cents: offer.amountCents,
        remaining_quantity: offer.quantity,
        status: "paid",
        whop_plan_id: `${ADMIN_TEST_PLAN_PREFIX}${offer.kind}:${offer.quantity}`,
        affiliate_code: null,
        paid_at: now,
        created_at: ADMIN_TEST_CREATED_AT,
      },
    });

    await tx.resonance_visit_orders.update({
      where: { id: parent.id },
      data: { offer_closed_at: now },
    });

    return order.id;
  });
}
