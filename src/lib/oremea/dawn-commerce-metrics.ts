import { prisma } from "@/lib/prisma";

export type DawnCommerceMetricOrder = {
  user_id: string;
  kind: string;
  quantity: number;
  amount_cents: number;
  remaining_quantity: number;
  status: string;
  parent_id: string | null;
  offer_closed_at: Date | null;
};

const coverage = {
  purchases: "resonance_visit_orders",
  checkoutFunnel: "order_created_to_payment_status",
  pageFunnelEvents: "not_collected",
  visitUsage: "resonance_visit_redemptions",
  affiliateAttribution: "not_collected",
  apiUsageCost: "usage_exposed_by_gateway_not_persisted",
  refundValue: "refund_amount_not_persisted",
  subscriptionRetention: "not_aggregated",
} as const;

function ratio(numerator: number, denominator: number) {
  if (!denominator) return null;
  return Number((numerator / denominator).toFixed(4));
}

export function aggregateDawnCommerceMetrics(
  orders: DawnCommerceMetricOrder[],
  redeemedVisits: number,
  observedAt = new Date().toISOString(),
) {
  const successfulOrders = orders.filter((order) =>
    order.status === "paid" || order.status === "refunded",
  );
  const paidOrders = orders.filter((order) => order.status === "paid");
  const refundedOrders = orders.filter((order) => order.status === "refunded");
  const failedOrders = orders.filter((order) => order.status === "failed");
  const pendingOrders = orders.filter((order) => order.status === "pending");
  const unknownOrders = orders.filter((order) => order.status === "unknown");
  const createdOrders = orders.filter((order) => order.status === "created");

  const initialOrders = orders.filter(
    (order) => order.kind === "initial" && order.parent_id === null,
  );
  const successfulInitialOrders = initialOrders.filter((order) =>
    order.status === "paid" || order.status === "refunded",
  );
  const additionalOrders = orders.filter((order) => order.parent_id !== null);
  const successfulAdditionalOrders = additionalOrders.filter((order) =>
    order.status === "paid" || order.status === "refunded",
  );

  const closedAdditionalOffers = initialOrders.filter(
    (order) => order.offer_closed_at !== null,
  ).length;
  const acceptedAdditionalOffers = additionalOrders.length;

  const successfulOrdersByBuyer = new Map<string, number>();
  for (const order of successfulOrders) {
    successfulOrdersByBuyer.set(
      order.user_id,
      (successfulOrdersByBuyer.get(order.user_id) ?? 0) + 1,
    );
  }
  const uniqueSuccessfulBuyers = successfulOrdersByBuyer.size;
  const repeatBuyerCount = [...successfulOrdersByBuyer.values()].filter(
    (count) => count > 1,
  ).length;

  const grossSuccessfulOrderValueCents = successfulOrders.reduce(
    (sum, order) => sum + order.amount_cents,
    0,
  );
  const currentlyPaidOrderValueCents = paidOrders.reduce(
    (sum, order) => sum + order.amount_cents,
    0,
  );
  const grossPurchasedVisits = successfulOrders.reduce(
    (sum, order) => sum + order.quantity,
    0,
  );
  const unusedPaidVisits = paidOrders.reduce(
    (sum, order) => sum + order.remaining_quantity,
    0,
  );

  return {
    schemaVersion: 1,
    availability: "available" as const,
    observedAt,
    privacy: "aggregate_no_pii" as const,
    currency: "USD" as const,
    coverage,
    resonanceVisits: {
      orderStarts: orders.length,
      initialOrderStarts: initialOrders.length,
      additionalOrderStarts: additionalOrders.length,
      successfulOrders: successfulOrders.length,
      paidOrders: paidOrders.length,
      refundedOrders: refundedOrders.length,
      failedOrders: failedOrders.length,
      pendingOrders: pendingOrders.length,
      unknownOrders: unknownOrders.length,
      createdOrders: createdOrders.length,
      grossSuccessfulOrderValueCents,
      currentlyPaidOrderValueCents,
      grossPurchasedVisits,
      unusedPaidVisits,
      redeemedVisits,
      uniqueSuccessfulBuyers,
      repeatBuyerCount,
      completionOfferOrders: additionalOrders.filter(
        (order) => order.kind === "completion",
      ).length,
      smallerOfferOrders: additionalOrders.filter(
        (order) => order.kind === "smaller",
      ).length,
      closedAdditionalOffers,
      acceptedAdditionalOffers,
      declinedAdditionalOffers: Math.max(
        0,
        closedAdditionalOffers - acceptedAdditionalOffers,
      ),
      successfulAdditionalOrders: successfulAdditionalOrders.length,
      initialOrderPaymentSuccessRate: ratio(
        successfulInitialOrders.length,
        initialOrders.length,
      ),
      overallOrderPaymentSuccessRate: ratio(
        successfulOrders.length,
        orders.length,
      ),
      additionalOfferSelectionRate: ratio(
        acceptedAdditionalOffers,
        closedAdditionalOffers,
      ),
      additionalOrderPaymentSuccessRate: ratio(
        successfulAdditionalOrders.length,
        additionalOrders.length,
      ),
      repeatBuyerRate: ratio(repeatBuyerCount, uniqueSuccessfulBuyers),
      visitRedemptionRate: ratio(redeemedVisits, grossPurchasedVisits),
    },
  };
}

export function unavailableDawnCommerceMetrics(
  observedAt = new Date().toISOString(),
) {
  return {
    schemaVersion: 1,
    availability: "unavailable" as const,
    observedAt,
    privacy: "aggregate_no_pii" as const,
    currency: "USD" as const,
    coverage,
    resonanceVisits: null,
  };
}

export async function oremeaDawnCommerceMetrics() {
  const [orders, redeemedVisits] = await Promise.all([
    prisma.resonance_visit_orders.findMany({
      select: {
        user_id: true,
        kind: true,
        quantity: true,
        amount_cents: true,
        remaining_quantity: true,
        status: true,
        parent_id: true,
        offer_closed_at: true,
      },
    }),
    prisma.resonance_visit_redemptions.count(),
  ]);

  return aggregateDawnCommerceMetrics(orders, redeemedVisits);
}
