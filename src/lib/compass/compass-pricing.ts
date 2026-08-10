import {
  OREMEA_PRODUCT_REGISTRY,
  formatOremeaPrice,
} from "@/src/lib/oremea/product-registry";

const COMPASS_PRODUCT = OREMEA_PRODUCT_REGISTRY.compass;

export const COMPASS_PRICING = {
  currency: COMPASS_PRODUCT.pricing.currency,
  accessDays: COMPASS_PRODUCT.access.days,
  launchPriceCents: COMPASS_PRODUCT.pricing.launchPriceCents,
  standardPriceCents: COMPASS_PRODUCT.pricing.regularPriceCents,
  autoRenews: COMPASS_PRODUCT.access.autoRenews,
} as const;

export function formatCompassPrice(priceCents: number) {
  return formatOremeaPrice(priceCents, COMPASS_PRICING.currency);
}
