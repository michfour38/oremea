import { z } from "zod";

import { prisma } from "@/lib/prisma";

// Historical orders may still settle or be refunded after the acquisition
// experiment was retired. This module is read-only; it cannot create offers.
export const CREATOR_STARTER_WHOP_CATALOG_KEY = "resonance-creator-starter-v1";
export const CREATOR_STARTER_PLAN_KEY = "CREATOR_RESONANCE_STARTER";

export type CreatorStarterWhopCatalog = {
  companyId: string;
  productId: string;
  planId: string;
  webhookId: string | null;
};

export async function loadCreatorStarterWhopCatalog(): Promise<CreatorStarterWhopCatalog> {
  const stored = await prisma.resonance_whop_catalog.findUnique({
    where: { catalog_key: CREATOR_STARTER_WHOP_CATALOG_KEY },
  });
  if (!stored) throw new Error("Historical creator starter catalog is unavailable.");
  const plans = z.record(z.string().min(1)).parse(stored.plans);
  const planId = plans[CREATOR_STARTER_PLAN_KEY];
  if (!planId) throw new Error("Historical creator starter plan is unavailable.");
  return {
    companyId: stored.company_id,
    productId: stored.product_id,
    planId,
    webhookId: stored.webhook_id,
  };
}
