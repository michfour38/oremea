import { z } from "zod";

import { prisma } from "@/lib/prisma";
import { CREATOR_ACQUISITION_POLICY } from "@/src/lib/oremea/creator-acquisition-economics";
import {
  loadResonanceWhopCatalog,
  ResonanceProvisioningError,
  type ResonanceProvisioningStage,
} from "@/src/lib/whop/resonance-catalog";
import {
  getWhopApiKey,
  WhopApiError,
  type WhopFailureDetails,
  whopApiRequest,
} from "@/src/lib/whop/whop-api";

export const CREATOR_STARTER_WHOP_CATALOG_KEY =
  "resonance-creator-starter-v1";
export const CREATOR_STARTER_PLAN_KEY = "CREATOR_RESONANCE_STARTER";

const PRODUCT_MARKER = "oremea_resonance_creator_starter_v1";
const PLAN_MARKER = "oremea:resonance-creator-starter:v1";

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

export type CreatorStarterWhopCatalog = {
  companyId: string;
  productId: string;
  planId: string;
  webhookId: string | null;
};

function providerFailureCode(error: WhopApiError) {
  return error.status === 401 || error.status === 403
    ? "permission"
    : error.status === 404
      ? "not_found"
      : error.status === 409
        ? "conflict"
        : "provider";
}

async function atStage<T>(
  stage: ResonanceProvisioningStage,
  action: () => Promise<T>,
): Promise<T> {
  try {
    return await action();
  } catch (error) {
    if (error instanceof ResonanceProvisioningError) throw error;
    if (error instanceof WhopApiError) {
      throw new ResonanceProvisioningError(
        stage,
        providerFailureCode(error),
        error.status,
        error.details as WhopFailureDetails,
      );
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

function productIsCreatorStarter(product: z.infer<typeof productSchema>) {
  return product.metadata?.oremea_catalog === PRODUCT_MARKER;
}

function validatePlan(
  plan: z.infer<typeof planSchema>,
  productId: string,
) {
  const amountMatches =
    Math.abs(
      plan.initial_price * 100 -
        CREATOR_ACQUISITION_POLICY.customerPriceCents,
    ) < 0.001;

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
    throw new Error(
      "The Creator Resonance Starter plan does not match the approved acquisition offer.",
    );
  }
}

async function ensureCreatorStarterProduct(companyId: string, apiKey: string) {
  const products = productListSchema.parse(
    await whopApiRequest(
      `products?company_id=${encodeURIComponent(companyId)}&first=100`,
      { apiKey },
    ),
  ).data;
  const matches = products.filter(productIsCreatorStarter);
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
      idempotencyKey: "oremea-resonance-creator-starter-product-v1",
      body: {
        company_id: companyId,
        title: "Creator Resonance Starter",
        headline: "One private seven-day Resonance visit",
        description:
          "Oremea creator-acquisition starter. Room choice happens inside Oremea after purchase.",
        visibility: "hidden",
        collect_shipping_address: false,
        send_welcome_message: false,
        // Open/member affiliate enrollment stays disabled. Named creator rates
        // remain an explicit owner action in Whop.
        global_affiliate_status: "disabled",
        member_affiliate_status: "disabled",
        metadata: { oremea_catalog: PRODUCT_MARKER },
      },
    }),
  );
}

async function ensureCreatorStarterPlan(
  companyId: string,
  productId: string,
  apiKey: string,
) {
  const plans = planListSchema.parse(
    await whopApiRequest(
      `plans?company_id=${encodeURIComponent(companyId)}&first=100`,
      { apiKey },
    ),
  ).data;
  const matches = plans.filter(
    (plan) => plan.internal_notes === PLAN_MARKER,
  );
  if (matches.length > 1) {
    throw new ResonanceProvisioningError("plans", "conflict");
  }

  let plan = matches[0];
  if (!plan) {
    const created = planSchema.parse(
      await whopApiRequest("plans", {
        method: "POST",
        apiKey,
        idempotencyKey: "oremea-resonance-creator-starter-plan-v1",
        body: {
          company_id: companyId,
          product_id: productId,
          plan_type: "one_time",
          release_method: "buy_now",
          currency: "usd",
          initial_price:
            CREATOR_ACQUISITION_POLICY.customerPriceCents / 100,
          visibility: "hidden",
          expiration_days: null,
          trial_period_days: null,
          unlimited_stock: true,
          internal_notes: PLAN_MARKER,
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

  validatePlan(plan, productId);
  return plan;
}

export async function loadCreatorStarterWhopCatalog(): Promise<CreatorStarterWhopCatalog> {
  const stored = await prisma.resonance_whop_catalog.findUnique({
    where: { catalog_key: CREATOR_STARTER_WHOP_CATALOG_KEY },
  });
  if (!stored) {
    throw new Error("Creator Resonance Starter catalog is not provisioned.");
  }
  const plans = z.record(z.string().min(1)).parse(stored.plans);
  const planId = plans[CREATOR_STARTER_PLAN_KEY];
  if (!planId) {
    throw new Error("Creator Resonance Starter plan is not provisioned.");
  }
  return {
    companyId: stored.company_id,
    productId: stored.product_id,
    planId,
    webhookId: stored.webhook_id,
  };
}

export async function provisionCreatorStarterWhopCatalog() {
  const apiKey = getWhopApiKey();
  const resonance = await atStage("account", () =>
    loadResonanceWhopCatalog(),
  );

  const product = await atStage("product", () =>
    ensureCreatorStarterProduct(resonance.companyId, apiKey),
  );
  const plan = await atStage("plans", () =>
    ensureCreatorStarterPlan(resonance.companyId, product.id, apiKey),
  );

  await atStage("storage", () =>
    prisma.resonance_whop_catalog.upsert({
      where: { catalog_key: CREATOR_STARTER_WHOP_CATALOG_KEY },
      update: {
        company_id: resonance.companyId,
        product_id: product.id,
        plans: { [CREATOR_STARTER_PLAN_KEY]: plan.id },
        webhook_id: resonance.webhookId,
      },
      create: {
        catalog_key: CREATOR_STARTER_WHOP_CATALOG_KEY,
        company_id: resonance.companyId,
        product_id: product.id,
        plans: { [CREATOR_STARTER_PLAN_KEY]: plan.id },
        webhook_id: resonance.webhookId,
      },
    }),
  );

  return {
    companyId: resonance.companyId,
    productId: product.id,
    planId: plan.id,
    webhookId: resonance.webhookId,
  };
}

export async function getCreatorStarterWhopProvisioningStatus() {
  const catalog = await prisma.resonance_whop_catalog.findUnique({
    where: { catalog_key: CREATOR_STARTER_WHOP_CATALOG_KEY },
  });
  const plans = catalog
    ? z.record(z.string()).parse(catalog.plans)
    : {};
  return {
    configured: Boolean(
      catalog?.product_id && plans[CREATOR_STARTER_PLAN_KEY],
    ),
    companyId: catalog?.company_id ?? null,
    productId: catalog?.product_id ?? null,
    planId: plans[CREATOR_STARTER_PLAN_KEY] ?? null,
    webhookId: catalog?.webhook_id ?? null,
    amountCents: CREATOR_ACQUISITION_POLICY.customerPriceCents,
  };
}
