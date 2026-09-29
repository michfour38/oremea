import { z } from "zod";
import { affiliateCode } from "./affiliate-attribution";

import {
  loadResonanceWhopCatalog,
  type ResonanceWhopCatalog,
} from "./resonance-catalog";
import { getOremeaCommerceOrigin, getWhopApiKey, whopApiRequest } from "./whop-api";

// Apple Pay domain ownership is served from public/.well-known so embedded Whop checkout can expose Apple Pay on verified production domains.
const checkoutSchema = z.object({
  id: z.string().min(1),
  company_id: z.string(),
  plan: z.object({
    id: z.string(),
    currency: z.string(),
    initial_price: z.number(),
    plan_type: z.string(),
    expiration_days: z.number().nullable(),
    adaptive_pricing_enabled: z.boolean(),
  }),
});

export type WhopVisitConfig = {
  apiKey: string;
  companyId: string;
  productId: string;
  origin: string;
};

export function getResonanceCheckoutOrigin() {
  const appOrigin = getOremeaCommerceOrigin();
  if (new URL(appOrigin).hostname === "localhost") return appOrigin;

  const configured = process.env.NEXT_PUBLIC_RESONANCE_URL?.trim() || "https://resonance.oremea.com";
  const origin = new URL(configured);
  if (origin.protocol !== "https:" || origin.hostname !== "resonance.oremea.com") {
    throw new Error("Resonance checkout requires the canonical secure host.");
  }
  return origin.origin;
}

export async function whopVisitConfig(
  catalog?: ResonanceWhopCatalog,
): Promise<WhopVisitConfig> {
  const apiKey = getWhopApiKey();
  const resolvedCatalog = catalog ?? await loadResonanceWhopCatalog();
  return {
    apiKey,
    companyId: resolvedCatalog.companyId,
    productId: resolvedCatalog.productId,
    origin: getResonanceCheckoutOrigin(),
  };
}

export async function createVisitCheckout(
  order: { id: string; whop_plan_id: string; amount_cents: number; affiliate_code?: string | null },
  config?: WhopVisitConfig,
) {
  const resolved = config ?? await whopVisitConfig();
  const checkout = checkoutSchema.parse(
    await whopApiRequest("checkout_configurations", {
      method: "POST",
      apiKey: resolved.apiKey,
      idempotencyKey: `oremea-resonance-checkout-${order.id}`,
      body: {
        company_id: resolved.companyId,
        plan_id: order.whop_plan_id,
        mode: "payment",
        ...(affiliateCode(order.affiliate_code) ? { affiliate_code: affiliateCode(order.affiliate_code) } : {}),
        metadata: { oremea_visit_order: order.id },
        redirect_url: `${resolved.origin}/resonance/complete?order=${order.id}`,
      },
    }),
  );
  if (
    checkout.company_id !== resolved.companyId ||
    checkout.plan.id !== order.whop_plan_id ||
    checkout.plan.currency !== "usd" ||
    Math.abs(checkout.plan.initial_price * 100 - order.amount_cents) >= 0.001 ||
    checkout.plan.plan_type !== "one_time" ||
    checkout.plan.expiration_days !== null ||
    checkout.plan.adaptive_pricing_enabled
  ) {
    throw new Error("Whop plan does not match the approved visit offer.");
  }
  return checkout.id;
}

export async function chargeVisitOrder(
  order: {
    id: string;
    whop_plan_id: string;
    whop_member_id: string;
    whop_payment_method_id: string;
  },
  config?: WhopVisitConfig,
) {
  const resolved = config ?? await whopVisitConfig();
  // Keep one provider identity for this exact order even if the request path is
  // invoked twice. We still do not automatically retry an interrupted charge;
  // the webhook remains the normal reconciliation path for an unknown result.
  const payment = z.object({ id: z.string().min(1) }).parse(
    await whopApiRequest("payments", {
      method: "POST",
      apiKey: resolved.apiKey,
      idempotencyKey: `oremea-resonance-payment-${order.id}`,
      body: {
        company_id: resolved.companyId,
        member_id: order.whop_member_id,
        payment_method_id: order.whop_payment_method_id,
        plan_id: order.whop_plan_id,
        metadata: { oremea_visit_order: order.id },
      },
    }),
  );
  return payment.id;
}
