import { prisma } from "@/lib/prisma";
import { createVisitCheckout } from "../whop/visit-payments";
import { getVisitOrder } from "./visit-orders";

/**
 * Recover only the provider checkout session, never a payment.
 *
 * If checkout creation succeeded at Whop but Oremea lost the response, the
 * same order ID is sent with the same Idempotency-Key used by
 * createVisitCheckout. Whop therefore returns the original checkout instead
 * of creating another one. No card charge is submitted here.
 */
export async function restoreInitialVisitCheckout(userId: string, id: string) {
  const order = await getVisitOrder(userId, id);
  if (!order) return null;
  if (
    order.kind !== "initial" ||
    order.whop_checkout_id ||
    !["pending", "unknown"].includes(order.status)
  ) return order;

  const checkoutId = await createVisitCheckout(order);
  await prisma.resonance_visit_orders.updateMany({
    where: {
      id: order.id,
      user_id: userId,
      kind: "initial",
      whop_checkout_id: null,
      status: { in: ["pending", "unknown"] },
    },
    data: { whop_checkout_id: checkoutId, status: "pending" },
  });
  return getVisitOrder(userId, order.id);
}
