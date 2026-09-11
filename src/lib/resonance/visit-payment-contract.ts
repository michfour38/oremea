import { z } from "zod";

export const uuidSchema = z.string().uuid();
const reference = z.object({ id: z.string().min(1) }).nullable().optional();
export const visitPaymentSchema = z.object({
  id: z.string().min(1),
  company: reference,
  product: reference,
  plan: reference,
  member: reference,
  payment_method: reference,
  checkout_configuration_id: z.string().nullable().optional(),
  metadata: z.object({ oremea_visit_order: uuidSchema }).passthrough(),
  user: z.object({ email: z.string().email() }),
  currency: z.string(),
  subtotal: z.number().finite().nonnegative().nullable(),
  paid_at: z.string().datetime({ offset: true }).nullable(),
  refunded_amount: z.number().nonnegative().optional(),
  auto_refunded: z.boolean().optional(),
});
export type VisitPayment = z.infer<typeof visitPaymentSchema>;

/** Pure settlement rules; the caller authenticates the event and locks the order. */
export function visitPaymentUpdate(type: string, payment: VisitPayment, order: {
  status: string; quantity: number; parent_id: string | null;
}) {
  if (order.status === "refunded") return null;
  if (payment.auto_refunded || (payment.refunded_amount ?? 0) > 0) {
    return { status: "refunded", remaining_quantity: 0, whop_payment_id: payment.id };
  }
  if (type === "payment.succeeded") {
    if (!payment.paid_at) throw new Error("A settled payment time is required.");
    if (order.status === "paid") return null; // Never refill redeemed credits.
    return {
      status: "paid", remaining_quantity: order.quantity, whop_payment_id: payment.id,
      whop_member_id: payment.member?.id ?? null,
      whop_payment_method_id: payment.payment_method?.id ?? null,
      paid_at: new Date(payment.paid_at),
    };
  }
  if ((type === "payment.failed" || type === "payment.canceled") && order.status !== "paid") {
    // The initial embedded checkout may create a new attempt after a decline.
    // The add-on has exactly one attempt, so its payment ID remains fixed.
    return { status: "failed", whop_payment_id: order.parent_id ? payment.id : null };
  }
  return null;
}

export const visitRefundSchema = z.object({
  type: z.enum(["refund.created", "refund.updated"]),
  company_id: z.string().min(1),
  data: z.object({
    id: z.string().min(1), amount: z.number().finite().positive(),
    currency: z.string(), status: z.string(),
    payment: z.object({
      id: z.string().min(1), product: reference, plan: reference,
      metadata: z.object({ oremea_visit_order: uuidSchema }).passthrough(),
      user: z.object({ email: z.string().email() }),
    }),
  }),
});

export function matchesVisitRefund(refund: z.infer<typeof visitRefundSchema>, order: {
  id: string; buyer_email: string; whop_plan_id: string; whop_payment_id: string | null;
}, accountId: string, productId: string) {
  const payment = refund.data.payment;
  return Boolean(accountId && productId && refund.company_id === accountId &&
    refund.data.currency.toLowerCase() === "usd" &&
    payment.metadata.oremea_visit_order === order.id &&
    payment.product?.id === productId && payment.plan?.id === order.whop_plan_id &&
    payment.user.email.toLowerCase() === order.buyer_email.toLowerCase() &&
    (!order.whop_payment_id || payment.id === order.whop_payment_id));
}

export function matchesVisitOrder(payment: VisitPayment, order: {
  id: string;
  buyer_email: string;
  whop_plan_id: string;
  whop_checkout_id: string | null;
  whop_member_id: string | null;
  whop_payment_method_id: string | null;
  whop_payment_id: string | null;
  parent_id: string | null;
  amount_cents: number;
}, accountId: string, productId: string) {
  return Boolean(
    accountId && productId &&
    payment.metadata.oremea_visit_order === order.id &&
    payment.company?.id === accountId &&
    payment.product?.id === productId &&
    payment.plan?.id === order.whop_plan_id &&
    payment.user.email.toLowerCase() === order.buyer_email.toLowerCase() &&
    payment.currency.toLowerCase() === "usd" &&
    payment.subtotal !== null &&
    Math.abs(payment.subtotal * 100 - order.amount_cents) < 0.001 &&
    (!order.whop_payment_id || order.whop_payment_id === payment.id) &&
    (order.parent_id
      ? order.whop_member_id && order.whop_payment_method_id &&
        payment.member?.id === order.whop_member_id &&
        payment.payment_method?.id === order.whop_payment_method_id
      : order.whop_checkout_id &&
        payment.checkout_configuration_id === order.whop_checkout_id)
  );
}
