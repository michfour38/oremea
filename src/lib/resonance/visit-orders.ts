import { randomUUID } from "node:crypto";
import { prisma } from "@/lib/prisma";
import { additionalOffers, initialOffer, visitPlanId, VISIT_PRICES } from "./visit-offers";
import { matchesVisitOrder, matchesVisitRefund, uuidSchema, visitPaymentSchema, visitPaymentUpdate, visitRefundSchema } from "./visit-payment-contract";
import { chargeVisitOrder, createVisitCheckout, whopVisitConfig } from "../whop/visit-payments";
import { lockResonanceAccount } from "./resonance-account-lock";

const PARTY_EVENT_KEY = "what-keeps-repeating-in-connection-1";

export function getVisitOrder(userId: string, id: string) {
  if (!uuidSchema.safeParse(id).success) return null;
  return prisma.resonance_visit_orders.findFirst({ where: { id, user_id: userId } });
}

export async function getVisitBalance(userId: string) {
  const result = await prisma.resonance_visit_orders.aggregate({
    where: { user_id: userId, status: "paid" },
    _sum: { remaining_quantity: true },
  });
  return result._sum.remaining_quantity ?? 0;
}

export async function startVisitPurchase(userId: string, email: string, quantity: number, requestId: string) {
  uuidSchema.parse(requestId);
  const offer = initialOffer(quantity);
  const planId = visitPlanId(offer);
  whopVisitConfig();
  const order = await prisma.resonance_visit_orders.upsert({
    where: { id: requestId }, update: {},
    create: {
      id: requestId, user_id: userId, buyer_email: email.toLowerCase(),
      kind: offer.kind, quantity: offer.quantity, amount_cents: offer.amountCents,
      whop_plan_id: planId,
    },
  });
  if (order.user_id !== userId || order.quantity !== quantity || order.kind !== "initial") {
    throw new Error("This checkout belongs to another request.");
  }
  const claim = await prisma.resonance_visit_orders.updateMany({
    where: { id: order.id, status: "created" }, data: { status: "pending" },
  });
  if (!claim.count) return order.id;
  try {
    const checkoutId = await createVisitCheckout(order);
    await prisma.resonance_visit_orders.update({
      where: { id: order.id }, data: { whop_checkout_id: checkoutId },
    });
  } catch {
    await prisma.resonance_visit_orders.updateMany({
      where: { id: order.id, status: "pending" }, data: { status: "unknown" },
    });
  }
  return order.id;
}

export async function acceptVisitAddition(userId: string, parentId: string, quantity: number) {
  uuidSchema.parse(parentId);
  whopVisitConfig();
  const result = await prisma.$transaction(async (tx) => {
    await lockResonanceAccount(tx, userId);
    const parent = await tx.resonance_visit_orders.findFirst({ where: { id: parentId, user_id: userId } });
    if (!parent || parent.kind !== "initial" || parent.status !== "paid") throw new Error("A paid initial order is required.");
    const existing = await tx.resonance_visit_orders.findUnique({ where: { parent_id: parent.id } });
    if (existing) return { order: existing, submit: false };
    if (parent.offer_closed_at) throw new Error("This additional offer is closed.");
    const offer = additionalOffers(parent.quantity).find((item) => item.quantity === quantity);
    if (!offer || parent.amount_cents !== VISIT_PRICES[parent.quantity as keyof typeof VISIT_PRICES]) {
      throw new Error("This offer is not available for the original order.");
    }
    if (!parent.whop_member_id || !parent.whop_payment_method_id) {
      throw new Error("A saved payment method is not available. The original visits are ready to use.");
    }
    const order = await tx.resonance_visit_orders.create({ data: {
      user_id: userId, buyer_email: parent.buyer_email, parent_id: parent.id,
      kind: offer.kind, quantity: offer.quantity, amount_cents: offer.amountCents,
      whop_plan_id: visitPlanId(offer, parent.quantity),
      whop_member_id: parent.whop_member_id, whop_payment_method_id: parent.whop_payment_method_id,
      status: "pending",
    } });
    await tx.resonance_visit_orders.update({ where: { id: parent.id }, data: { offer_closed_at: new Date() } });
    return { order, submit: true };
  });
  if (!result.submit) return result.order.id;
  const order = result.order;
  try {
    // Confirm the provider's price and one-time terms before charging. Do not
    // expose this add-on checkout to the buyer as a second way to pay it.
    await createVisitCheckout(order);
    const paymentId = await chargeVisitOrder({
      ...order,
      whop_member_id: order.whop_member_id!,
      whop_payment_method_id: order.whop_payment_method_id!,
    });
    await prisma.resonance_visit_orders.updateMany({
      where: { id: order.id, whop_payment_id: null }, data: { whop_payment_id: paymentId },
    });
  } catch {
    // A timeout is an UNKNOWN result, never permission to charge again.
    // The success/failure webhook can still reconcile this exact order.
    await prisma.resonance_visit_orders.updateMany({
      where: { id: order.id, status: "pending" }, data: { status: "unknown" },
    });
  }
  return order.id;
}

export async function declineVisitAddition(userId: string, parentId: string) {
  uuidSchema.parse(parentId);
  await prisma.$transaction(async (tx) => {
    await lockResonanceAccount(tx, userId);
    await tx.resonance_visit_orders.updateMany({
      where: { id: parentId, user_id: userId, kind: "initial", status: "paid", offer_closed_at: null },
      data: { offer_closed_at: new Date() },
    });
  });
}

/** Called only after signature verification in the Whop webhook route. */
export async function applyVisitPaymentEvent(type: string, data: unknown) {
  const parsed = visitPaymentSchema.safeParse(data);
  if (!parsed.success) throw new Error("Invalid visit payment event.");
  const payment = parsed.data;
  const accountId = process.env.WHOP_ACCOUNT_ID?.trim() ?? "";
  const productId = process.env.WHOP_RESONANCE_VISITS_PRODUCT_ID?.trim() ?? "";
  return prisma.$transaction(async (tx) => {
    const found = await tx.resonance_visit_orders.findUnique({ where: { id: payment.metadata.oremea_visit_order } });
    if (!found) throw new Error("Visit order not found.");
    await lockResonanceAccount(tx, found.user_id);
    const order = await tx.resonance_visit_orders.findUniqueOrThrow({ where: { id: found.id } });
    if (!matchesVisitOrder(payment, order, accountId, productId)) throw new Error("Visit payment does not match the order.");
    const update = visitPaymentUpdate(type, payment, order);
    const settledOrder = update
      ? await tx.resonance_visit_orders.update({ where: { id: order.id }, data: update })
      : order;

    if (type === "payment.succeeded" && order.parent_id === null) {
      await tx.oremea_party_registrations.updateMany({
        where: {
          event_key: PARTY_EVENT_KEY,
          email: order.buyer_email.toLowerCase(),
          invited_by: { not: null },
        },
        data: { invite_allowance: 2 },
      });
    }

    return settledOrder;
  });
}

/** Refund payloads differ from payment payloads. Verify their signed envelope too. */
export async function applyVisitRefundEvent(event: unknown) {
  const refund = visitRefundSchema.parse(event);
  const accountId = process.env.WHOP_ACCOUNT_ID?.trim() ?? "";
  const productId = process.env.WHOP_RESONANCE_VISITS_PRODUCT_ID?.trim() ?? "";
  return prisma.$transaction(async (tx) => {
    const found = await tx.resonance_visit_orders.findUnique({ where: {
      id: refund.data.payment.metadata.oremea_visit_order,
    } });
    if (!found) throw new Error("Visit order not found.");
    await lockResonanceAccount(tx, found.user_id);
    const order = await tx.resonance_visit_orders.findUniqueOrThrow({ where: { id: found.id } });
    if (!matchesVisitRefund(refund, order, accountId, productId)) throw new Error("Refund does not match the order.");
    if (refund.data.status !== "succeeded" || order.status === "refunded") return order;
    // A partial or full refund freezes this order's unused credits for review.
    // Already-entered rooms and earlier reflections are preserved.
    return tx.resonance_visit_orders.update({ where: { id: order.id }, data: {
      status: "refunded", remaining_quantity: 0, whop_payment_id: refund.data.payment.id,
    } });
  });
}

export async function redeemVisit(userId: string, weekNumber: number, requestId: string) {
  uuidSchema.parse(requestId);
  if (!Number.isInteger(weekNumber) || weekNumber < 1 || weekNumber > 10) throw new Error("Invalid room.");
  return prisma.$transaction(async (tx) => {
    await lockResonanceAccount(tx, userId);
    const existing = await tx.resonance_visit_redemptions.findUnique({ where: { request_id: requestId } });
    if (existing) {
      if (existing.user_id !== userId) throw new Error("Invalid room request.");
      return existing.run_id;
    }
    const room = await tx.resonance_weeks.findUnique({ where: { week_number: weekNumber } });
    if (!room?.is_published) throw new Error("This room is not available.");
    const active = await tx.resonance_week_runs.findFirst({ where: { user_id: userId, status: "active" } });
    if (active) throw new Error("Complete the active visit before opening another.");
    const order = await tx.resonance_visit_orders.findFirst({
      where: { user_id: userId, status: "paid", remaining_quantity: { gt: 0 } },
      orderBy: [{ created_at: "asc" }, { id: "asc" }],
    });
    if (!order) throw new Error("No unused visits are available.");
    const previous = await tx.resonance_week_runs.aggregate({ where: { user_id: userId, week_number: weekNumber }, _max: { run_number: true } });
    const runId = randomUUID();
    await tx.resonance_week_runs.create({ data: {
      id: runId, user_id: userId, week_number: weekNumber,
      run_number: (previous._max.run_number ?? 0) + 1, status: "active",
      purchase_source: "visit_credit", purchase_reference: `visit:${requestId}`,
      purchased_at: order.paid_at, started_at: new Date(),
    } });
    await tx.resonance_visit_redemptions.create({ data: {
      user_id: userId, order_id: order.id, run_id: runId, request_id: requestId,
    } });
    await tx.resonance_visit_orders.update({ where: { id: order.id }, data: { remaining_quantity: { decrement: 1 } } });
    return runId;
  });
}
