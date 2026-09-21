import { z } from "zod";

import { prisma } from "@/lib/prisma";
import { OREMEA_PRICING } from "@/src/lib/oremea/pricing";
import { offerPlanEnv, type VisitOffer } from "@/src/lib/resonance/visit-offers";
import {
  WHOP_VISIT_API_VERSION,
  getOremeaCommerceOrigin,
  getWhopApiKey,
  WhopApiError,
  type WhopFailureDetails,
  whopApiRequest,
} from "@/src/lib/whop/whop-api";

export const RESONANCE_WHOP_CATALOG_KEY = "resonance-visits-v1";
const PRODUCT_MARKER = "oremea_resonance_visits_v1";
const PLAN_MARKER_PREFIX = "oremea:resonance-visits:v1:";
const REQUIRED_WEBHOOK_EVENTS = [
  "payment.succeeded",
  "payment.failed",
  "refund.created",
  "refund.updated",
] as const;

const accountSchema = z.object({ id: z.string().min(1) }).passthrough();
const productSchema = z.object({
  id: z.string().min(1),
  title: z.string().optional(),
  visibility: z.string().optional(),
  metadata: z.record(z.unknown()).nullable().optional(),
}).passthrough();
const productListSchema = z.object({ data: z.array(productSchema) }).passthrough();
const planSchema = z.object({
  id: z.string().min(1),
  visibility: z.string(),
  plan_type: z.string(),
  currency: z.string(),
  product: z.object({ id: z.string().min(1) }),
  initial_price: z.number().finite().nonnegative(),
  expiration_days: z.number().nullable().optional(),
  trial_period_days: z.number().nullable().optional(),
  internal_notes: z.string().nullable().optional(),
  adaptive_pricing_enabled: z.boolean().optional(),
}).passthrough();
const planListSchema = z.object({ data: z.array(planSchema) }).passthrough();
const webhookSchema = z.object({
  id: z.string().min(1),
  url: z.string().url(),
  events: z.array(z.string()),
  enabled: z.boolean(),
}).passthrough();
const webhookListSchema = z.object({ data: z.array(webhookSchema) }).passthrough();


export type ResonanceProvisioningStage =
  | "account"
  | "product"
  | "plans"
  | "webhook"
  | "storage";

export class ResonanceProvisioningError extends Error {
  constructor(
    public readonly stage: ResonanceProvisioningStage,
    public readonly code: "permission" | "not_found" | "conflict" | "validation" | "provider" | "storage",
    public readonly providerStatus?: number,
    public readonly providerDetails?: WhopFailureDetails,
  ) {
    super(`Resonance provisioning failed at ${stage}.`);
    this.name = "ResonanceProvisioningError";
  }
}

async function atProvisioningStage<T>(
  stage: ResonanceProvisioningStage,
  action: () => Promise<T>,
): Promise<T> {
  try {
    return await action();
  } catch (error) {
    if (error instanceof ResonanceProvisioningError) throw error;
    if (error instanceof WhopApiError) {
      const code =
        error.status === 401 || error.status === 403
          ? "permission"
          : error.status === 404
            ? "not_found"
            : error.status === 409
              ? "conflict"
              : "provider";
      throw new ResonanceProvisioningError(stage, code, error.status, error.details);
    }
    if (error instanceof z.ZodError) {
      throw new ResonanceProvisioningError(stage, "validation");
    }
    throw new ResonanceProvisioningError(
      stage,
      stage === "storage" ? "storage" : "validation",
    );
  }
}

export type ResonanceWhopCatalog = {
  companyId: string;
  productId: string;
  plans: Record<string, string>;
  webhookId: string | null;
};

type PlanSpec = {
  key: string;
  label: string;
  amountCents: number;
};

function planSpecs(): PlanSpec[] {
  const prices = OREMEA_PRICING.resonance.visitPricesCents;
  const standalone = ([1, 2, 3, 4, 5, 6, 7, 8] as const).map((quantity) => ({
    key: `WHOP_RESONANCE_VISITS_${quantity}_PLAN_ID`,
    label: `${quantity} Resonance visit${quantity === 1 ? "" : "s"}`,
    amountCents: prices[quantity],
  }));
  const completion = ([1, 3, 4] as const).map((initialQuantity) => ({
    key: `WHOP_RESONANCE_COMPLETE_FROM_${initialQuantity}_PLAN_ID`,
    label: `Complete ten from ${initialQuantity}`,
    amountCents: prices[10] - prices[initialQuantity],
  }));
  return [...standalone, ...completion];
}

function productIsOremeaCatalog(product: z.infer<typeof productSchema>) {
  return product.metadata?.oremea_catalog === PRODUCT_MARKER;
}

function planMarker(key: string) {
  return `${PLAN_MARKER_PREFIX}${key}`;
}

function validatePlan(plan: z.infer<typeof planSchema>, spec: PlanSpec, productId: string) {
  const amountMatches = Math.abs(plan.initial_price * 100 - spec.amountCents) < 0.001;
  if (
    plan.product.id !== productId ||
    plan.plan_type !== "one_time" ||
    plan.currency.toLowerCase() !== "usd" ||
    !amountMatches ||
    plan.expiration_days != null ||
    plan.trial_period_days != null ||
    plan.visibility !== "hidden" ||
    plan.adaptive_pricing_enabled === true
  ) {
    throw new Error(`Whop plan ${spec.key} does not match the approved Resonance offer.`);
  }
}

export async function loadResonanceWhopCatalog(): Promise<ResonanceWhopCatalog> {
  const stored = await prisma.resonance_whop_catalog.findUnique({
    where: { catalog_key: RESONANCE_WHOP_CATALOG_KEY },
  });
  if (stored) {
    const plans = z.record(z.string().min(1)).parse(stored.plans);
    return {
      companyId: stored.company_id,
      productId: stored.product_id,
      plans,
      webhookId: stored.webhook_id,
    };
  }

  // Temporary rollback bridge for environments provisioned before the catalog table.
  const companyId = process.env.WHOP_COMPANY_ID?.trim();
  const productId = process.env.WHOP_RESONANCE_VISITS_PRODUCT_ID?.trim();
  const plans: Record<string, string> = {};
  for (const spec of planSpecs()) {
    const id = process.env[spec.key]?.trim();
    if (id) plans[spec.key] = id;
  }
  if (!companyId || !productId || Object.keys(plans).length !== planSpecs().length) {
    throw new Error("Resonance Whop catalog is not provisioned.");
  }
  return { companyId, productId, plans, webhookId: null };
}

export function visitPlanIdFromCatalog(
  catalog: ResonanceWhopCatalog,
  offer: VisitOffer,
  initialQuantity?: number,
) {
  const key = offerPlanEnv(offer, initialQuantity);
  const id = catalog.plans[key];
  if (!id) throw new Error("The Resonance visit payment plan is not provisioned.");
  return id;
}

async function ensureProduct(companyId: string, apiKey: string) {
  const products = productListSchema.parse(
    await whopApiRequest(
      `products?company_id=${encodeURIComponent(companyId)}&first=100`,
      { apiKey },
    ),
  ).data;
  const matches = products.filter(productIsOremeaCatalog);
  if (matches.length > 1) {
    throw new ResonanceProvisioningError("product", "conflict");
  }
  const existing = matches[0];
  if (existing) {
    if (existing.visibility !== "hidden") {
      throw new ResonanceProvisioningError("product", "validation");
    }
    return existing;
  }

  return productSchema.parse(
    await whopApiRequest("products", {
      method: "POST",
      apiKey,
      idempotencyKey: "oremea-resonance-visits-product-v1",
      body: {
        company_id: companyId,
        title: "Resonance Visits",
        headline: "Private seven-day reflection visits",
        description:
          "Oremea Resonance visit capacity. Room choice happens inside Oremea after purchase.",
        visibility: "hidden",
        collect_shipping_address: false,
        send_welcome_message: false,
        global_affiliate_status: "disabled",
        member_affiliate_status: "disabled",
        metadata: { oremea_catalog: PRODUCT_MARKER },
      },
    }),
  );
}

async function ensurePlans(companyId: string, productId: string, apiKey: string) {
  const response = planListSchema.parse(
    await whopApiRequest(
      `plans?company_id=${encodeURIComponent(companyId)}&first=100`,
      { apiKey },
    ),
  );
  const markedPlans = response.data.filter((plan) =>
    plan.internal_notes?.startsWith(PLAN_MARKER_PREFIX),
  );
  const duplicateMarkers = markedPlans
    .map((plan) => plan.internal_notes!)
    .filter((marker, index, all) => all.indexOf(marker) !== index);
  if (duplicateMarkers.length) {
    throw new ResonanceProvisioningError("plans", "conflict");
  }
  const byMarker = new Map(
    markedPlans.map((plan) => [plan.internal_notes!, plan]),
  );
  const result: Record<string, string> = {};

  for (const spec of planSpecs()) {
    const marker = planMarker(spec.key);
    let plan = byMarker.get(marker);
    if (!plan) {
      const created = planSchema.parse(
        await whopApiRequest("plans", {
          method: "POST",
          apiKey,
          idempotencyKey: `oremea-resonance-${spec.key.toLowerCase()}`,
          body: {
            company_id: companyId,
            product_id: productId,
            plan_type: "one_time",
            release_method: "buy_now",
            currency: "usd",
            initial_price: spec.amountCents / 100,
            visibility: "hidden",
            expiration_days: null,
            trial_period_days: null,
            unlimited_stock: true,
            internal_notes: marker,
          },
        }),
      );
      plan = planSchema.parse(
        await whopApiRequest(`plans/${encodeURIComponent(created.id)}`, {
          method: "PATCH",
          apiKey,
          body: {
            visibility: "hidden",
            adaptive_pricing_enabled: false,
          },
        }),
      );
    }

    validatePlan(plan, spec, productId);
    result[spec.key] = plan.id;
  }
  return result;
}

async function ensureWebhook(companyId: string, origin: string, apiKey: string) {
  const expectedUrl = `${origin}/api/webhooks/whop`;
  const webhooks = webhookListSchema.parse(
    await whopApiRequest(
      `webhooks?company_id=${encodeURIComponent(companyId)}&first=100`,
      { apiKey },
    ),
  ).data;
  const matchingWebhooks = webhooks.filter((candidate) => {
    try {
      const url = new URL(candidate.url);
      return (
        url.pathname.replace(/\/$/, "") === "/api/webhooks/whop" &&
        (url.hostname === "oremea.com" ||
          url.hostname === "www.oremea.com" ||
          url.hostname.endsWith(".up.railway.app"))
      );
    } catch {
      return false;
    }
  });
  if (matchingWebhooks.length > 1) {
    throw new ResonanceProvisioningError("webhook", "conflict");
  }
  const webhook = matchingWebhooks[0];
  if (!webhook) {
    throw new ResonanceProvisioningError("webhook", "not_found");
  }

  const events = [...new Set([...webhook.events, ...REQUIRED_WEBHOOK_EVENTS])];
  const needsUpdate =
    !webhook.enabled ||
    REQUIRED_WEBHOOK_EVENTS.some((event) => !webhook.events.includes(event));
  if (!needsUpdate) return webhook.id;

  const updated = webhookSchema.parse(
    await whopApiRequest(`webhooks/${encodeURIComponent(webhook.id)}`, {
      method: "PATCH",
      apiKey,
      body: {
        api_version_date: WHOP_VISIT_API_VERSION,
        enabled: true,
        events,
        url: expectedUrl,
      },
    }),
  );
  return updated.id;
}

export async function provisionResonanceWhopCatalog() {
  const apiKey = getWhopApiKey();
  const origin = getOremeaCommerceOrigin();

  const account = await atProvisioningStage("account", async () =>
    accountSchema.parse(await whopApiRequest("accounts/me", { apiKey })),
  );
  const product = await atProvisioningStage("product", () =>
    ensureProduct(account.id, apiKey),
  );
  const plans = await atProvisioningStage("plans", () =>
    ensurePlans(account.id, product.id, apiKey),
  );
  const webhookId = await atProvisioningStage("webhook", () =>
    ensureWebhook(account.id, origin, apiKey),
  );

  await atProvisioningStage("storage", () => prisma.resonance_whop_catalog.upsert({
    where: { catalog_key: RESONANCE_WHOP_CATALOG_KEY },
    update: {
      company_id: account.id,
      product_id: product.id,
      plans,
      webhook_id: webhookId,
    },
    create: {
      catalog_key: RESONANCE_WHOP_CATALOG_KEY,
      company_id: account.id,
      product_id: product.id,
      plans,
      webhook_id: webhookId,
    },
  }));

  return {
    companyId: account.id,
    productId: product.id,
    planCount: Object.keys(plans).length,
    webhookId,
  };
}

export async function getResonanceWhopProvisioningStatus() {
  const catalog = await prisma.resonance_whop_catalog.findUnique({
    where: { catalog_key: RESONANCE_WHOP_CATALOG_KEY },
  });
  return {
    apiKeyConfigured: Boolean(process.env.WHOP_API_KEY?.trim()),
    catalogConfigured: Boolean(catalog),
    productId: catalog?.product_id ?? null,
    planCount: catalog
      ? Object.keys(z.record(z.string()).parse(catalog.plans)).length
      : 0,
    webhookId: catalog?.webhook_id ?? null,
  };
}
