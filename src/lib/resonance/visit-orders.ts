import { randomUUID } from "node:crypto";
import { affiliateCode } from "../whop/affiliate-attribution";
import { prisma } from "@/lib/prisma";
import { additionalOffers, initialOffer, VISIT_PRICES } from "./visit-offers";
import { directVisitPaymentResultFromList, matchesVisitOrder, matchesVisitRefund, settledVisitPaymentFromList, uuidSchema, visitPaymentResultFromRecord, visitPaymentSchema, visitPaymentUpdate, visitRefundSchema } from "./visit-payment-contract";
import { chargeVisitOrder, createVisitCheckout, whopVisitConfig } from "../whop/visit-payments";
import { whopApiRequest } from "../whop/whop-api";
import { loadCreatorStarterWhopCatalog } from "../whop/creator-starter-catalog";
import { loadResonanceWhopCatalog, visitPlanIdFromCatalog } from "../whop/resonance-catalog";
import { lockResonanceAccount } from "./resonance-account-lock";

function findVisitOrder(userId: string, id: string) {
  if (!uuidSchema.safeParse(id).success) return null;
  return prisma.resonance_visit_orders.findFirst({ where: { id, user_id: userId } });
}

/**
 * Opening an unresolved saved-card add-on is itself a safe recovery point.
 * Recovery performs provider GETs only and never retries a charge.
 */
export async function getVisitOrder(userId: string, id: string) {
  const order = await findVisitOrder(userId, id);
  if (!order) return null;
  if (order.parent_id && ["pending", "unknown"].includes(order.status)) {
    try { return await reconcileAdditionalVisitOrderRecord(order); }
    catch { /* Keep the stored unknown state if provider verification is unavailable. */ }
  }
  return order;
}

export function getUnresolvedInitialVisitOrder(userId: string) {
  return prisma.resonance_visit_orders.findFirst({
    where: {
      user_id: userId,
      kind: "initial",
      status: { in: ["pending", "unknown"] },
    },
    orderBy: [{ created_at: "desc" }, { id: "desc" }],
  });
}

export async function getVisitBalance(userId: string) {
  const result = await prisma.resonance_visit_orders.aggregate({
    where: { user_id: userId, status: "paid" },
    _sum: { remaining_quantity: true },
  });
  return result._sum.remaining_quantity ?? 0;
}

export async function startVisitPurchase(userId: string, email: string, quantity: number, requestId: string, referral?: string | null) {
  uuidSchema.parse(requestId);
  const offer = initialOffer(quantity);
  const catalog = await loadResonanceWhopCatalog();
  const planId = visitPlanIdFromCatalog(catalog, offer);
  const paymentConfig = await whopVisitConfig(catalog);
  const prepared = await prisma.$transaction(async (tx) => {
    await lockResonanceAccount(tx, userId);

    const existingRequest = await tx.resonance_visit_orders.findUnique({ where: { id: requestId } });
    if (existingRequest) {
      if (existingRequest.user_id !== userId || existingRequest.quantity !== quantity || existingRequest.kind !== "initial") {
        throw new Error("This checkout belongs to another request.");
      }
      if (existingRequest.status !== "created") return { order: existingRequest, submit: false };
      const claimed = await tx.resonance_visit_orders.update({
        where: { id: existingRequest.id }, data: { status: "pending" },
      });
      return { order: claimed, submit: true };
    }

    // Do not create a second provider checkout while an earlier initial
    // payment is still unresolved. This also serializes separate browser tabs
    // because the account advisory lock spans the check and row creation.
    const unresolved = await tx.resonance_visit_orders.findFirst({
      where: {
        user_id: userId,
        kind: "initial",
        status: { in: ["pending", "unknown"] },
      },
      orderBy: [{ created_at: "desc" }, { id: "desc" }],
    });
    if (unresolved) return { order: unresolved, submit: false };

    const order = await tx.resonance_visit_orders.create({ data: {
      id: requestId, user_id: userId, buyer_email: email.toLowerCase(),
      kind: offer.kind, quantity: offer.quantity, amount_cents: offer.amountCents,
      whop_plan_id: planId,
      affiliate_code: affiliateCode(referral),
      status: "pending",
    } });
    return { order, submit: true };
  });
  if (!prepared.submit) return prepared.order.id;
  const order = prepared.order;
  try {
    const checkoutId = await createVisitCheckout(order, paymentConfig);
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
  const catalog = await loadResonanceWhopCatalog();
  const paymentConfig = await whopVisitConfig(catalog);
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
      whop_plan_id: visitPlanIdFromCatalog(catalog, offer, parent.quantity),
      whop_member_id: parent.whop_member_id, whop_payment_method_id: parent.whop_payment_method_id,
      affiliate_code: parent.affiliate_code,
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
    await createVisitCheckout(order, paymentConfig);
    const paymentId = await chargeVisitOrder({
      ...order,
      whop_member_id: order.whop_member_id!,
      whop_payment_method_id: order.whop_payment_method_id!,
    }, paymentConfig);
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

async function expectedVisitProductForPlan(planId: string) {
  if (!planId) throw new Error("Visit payment is missing a plan.");
  const normal = await loadResonanceWhopCatalog();
  if (Object.values(normal.plans).includes(planId)) {
    return { companyId: normal.companyId, productId: normal.productId };
  }

  const starter = await loadCreatorStarterWhopCatalog().catch(() => null);
  if (starter?.planId === planId) {
    if (starter.companyId !== normal.companyId) {
      throw new Error("Creator starter company does not match Resonance commerce.");
    }
    return { companyId: starter.companyId, productId: starter.productId };
  }

  throw new Error("Visit payment plan is not part of the approved Resonance catalogs.");
}

/** Called only after signature verification in the Whop webhook route. */
export async function applyVisitPaymentEvent(type: string, data: unknown) {
  const parsed = visitPaymentSchema.safeParse(data);
  if (!parsed.success) throw new Error("Invalid visit payment event.");
  const payment = parsed.data;
  const expected = await expectedVisitProductForPlan(payment.plan?.id ?? "");
  return prisma.$transaction(async (tx) => {
    const found = await tx.resonance_visit_orders.findUnique({ where: { id: payment.metadata.oremea_visit_order } });
    if (!found) throw new Error("Visit order not found.");
    await lockResonanceAccount(tx, found.user_id);
    const order = await tx.resonance_visit_orders.findUniqueOrThrow({ where: { id: found.id } });
    if (!matchesVisitOrder(payment, order, expected.companyId, expected.productId)) throw new Error("Visit payment does not match the order.");
    const update = visitPaymentUpdate(type, payment, order);
    return update ? tx.resonance_visit_orders.update({ where: { id: order.id }, data: update }) : order;
  });
}

/** Read-only Whop lookup for an authenticated owner's initial checkout return. */
export async function reconcileInitialVisitOrder(userId: string, id: string) {
  const order = await findVisitOrder(userId, id);
  if (!order) return null;
  if (order.kind !== "initial" || !order.whop_checkout_id ||
      !["pending", "unknown", "failed"].includes(order.status)) return order;

  const expected = await expectedVisitProductForPlan(order.whop_plan_id);
  const params = new URLSearchParams({ account_id: expected.companyId, first: "100" });
  params.append("checkout_configuration_ids[]", order.whop_checkout_id);
  // GET only. A missing webhook must never cause a second charge.
  const response = await whopApiRequest(`payments?${params.toString()}`);
  const payment = settledVisitPaymentFromList(response, order, expected.companyId, expected.productId);
  if (!payment) return order;
  // The shared transactional path locks the account and rechecks every field
  // against the current order, including checkout, amount, and payment ID.
  return applyVisitPaymentEvent("payment.succeeded", payment);
}

async function reconcileAdditionalVisitOrderRecord(order: NonNullable<Awaited<ReturnType<typeof findVisitOrder>>>) {
  if (!order.parent_id || !["pending", "unknown"].includes(order.status)) return order;

  const expected = await expectedVisitProductForPlan(order.whop_plan_id);
  let result: ReturnType<typeof visitPaymentResultFromRecord> | null = null;

  if (order.whop_payment_id) {
    const response = await whopApiRequest(`payments/${encodeURIComponent(order.whop_payment_id)}`);
    result = visitPaymentResultFromRecord(response, order, expected.companyId, expected.productId);
  } else {
    // Whop's payment-list API supports plan and creation-window filters. Keep
    // the window narrow, reject pagination, then require Oremea's exact order
    // metadata + member + payment-method + price match before accepting it.
    const createdAfter = new Date(order.created_at.getTime() - 5 * 60_000).toISOString();
    const params = new URLSearchParams({
      account_id: expected.companyId,
      first: "100",
      created_after: createdAfter,
    });
    params.append("plan_ids[]", order.whop_plan_id);
    const response = await whopApiRequest(`payments?${params.toString()}`);
    result = directVisitPaymentResultFromList(response, order, expected.companyId, expected.productId);
  }

  if (!result) return order;
  // Same locked, field-rechecking path as the signed webhook. A GET lookup can
  // settle or fail the existing order, but can never submit another charge.
  return applyVisitPaymentEvent(result.type, result.payment);
}

/** Explicit read-only recovery hook for admin/test tooling. */
export async function reconcileAdditionalVisitOrder(userId: string, id: string) {
  const order = await findVisitOrder(userId, id);
  if (!order) return null;
  return reconcileAdditionalVisitOrderRecord(order);
}

/** Refund payloads differ from payment payloads. Verify their signed envelope too. */
export async function applyVisitRefundEvent(event: unknown) {
  const refund = visitRefundSchema.parse(event);
  const expected = await expectedVisitProductForPlan(refund.data.payment.plan?.id ?? "");
  return prisma.$transaction(async (tx) => {
    const found = await tx.resonance_visit_orders.findUnique({ where: {
      id: refund.data.payment.metadata.oremea_visit_order,
    } });
    if (!found) throw new Error("Visit order not found.");
    await lockResonanceAccount(tx, found.user_id);
    const order = await tx.resonance_visit_orders.findUniqueOrThrow({ where: { id: found.id } });
    if (!matchesVisitRefund(refund, order, expected.companyId, expected.productId)) throw new Error("Refund does not match the order.");
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
