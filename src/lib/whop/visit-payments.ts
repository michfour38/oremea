import { z } from "zod";

const checkoutSchema = z.object({
  id: z.string().min(1),
  account_id: z.string(),
  plan: z.object({
    id: z.string(),
    currency: z.string(),
    initial_price: z.number(),
    plan_type: z.string(),
    expiration_days: z.number().nullable(),
    adaptive_pricing_enabled: z.boolean(),
  }),
});

export function whopVisitConfig() {
  const apiKey = process.env.WHOP_API_KEY?.trim();
  const accountId = process.env.WHOP_ACCOUNT_ID?.trim();
  const productId = process.env.WHOP_RESONANCE_VISITS_PRODUCT_ID?.trim();
  const configuredOrigin = process.env.NEXT_PUBLIC_APP_URL?.trim();
  if (!apiKey || !accountId || !productId || !configuredOrigin) {
    throw new Error("Resonance visit payments are not configured.");
  }
  const origin = new URL(configuredOrigin);
  if (origin.protocol !== "https:" && origin.hostname !== "localhost") {
    throw new Error("Checkout requires a secure application URL.");
  }
  return { apiKey, accountId, productId, origin: origin.origin };
}

async function whopRequest(path: string, body: Record<string, unknown>) {
  const { apiKey } = whopVisitConfig();
  // No automatic retries: an interrupted charge may still have succeeded.
  const response = await fetch(`https://api.whop.com/api/v1/${path}`, {
    method: "POST",
    headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
    body: JSON.stringify(body),
    cache: "no-store",
    signal: AbortSignal.timeout(20_000),
  });
  if (!response.ok) throw new Error(`Whop request returned ${response.status}.`);
  return response.json() as Promise<unknown>;
}

export async function createVisitCheckout(order: {
  id: string; whop_plan_id: string; amount_cents: number;
}) {
  const { accountId, origin } = whopVisitConfig();
  const checkout = checkoutSchema.parse(await whopRequest("checkout_configurations", {
    account_id: accountId,
    plan_id: order.whop_plan_id,
    mode: "payment",
    metadata: { oremea_visit_order: order.id },
    redirect_url: `${origin}/resonance/complete?order=${order.id}`,
  }));
  if (
    checkout.account_id !== accountId ||
    checkout.plan.id !== order.whop_plan_id ||
    checkout.plan.currency !== "usd" ||
    Math.abs(checkout.plan.initial_price * 100 - order.amount_cents) >= 0.001 ||
    checkout.plan.plan_type !== "one_time" ||
    checkout.plan.expiration_days !== null ||
    checkout.plan.adaptive_pricing_enabled
  ) throw new Error("Whop plan does not match the approved visit offer.");
  return checkout.id;
}

export async function chargeVisitOrder(order: {
  id: string; whop_plan_id: string;
  whop_member_id: string; whop_payment_method_id: string;
}) {
  const { accountId } = whopVisitConfig();
  const payment = z.object({ id: z.string().min(1) }).parse(
    await whopRequest("payments", {
      account_id: accountId,
      member_id: order.whop_member_id,
      payment_method_id: order.whop_payment_method_id,
      plan_id: order.whop_plan_id,
      metadata: { oremea_visit_order: order.id },
    }),
  );
  return payment.id;
}
