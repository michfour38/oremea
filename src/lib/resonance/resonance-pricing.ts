import {
  OREMEA_PRODUCT_REGISTRY,
  formatOremeaPrice,
} from "@/src/lib/oremea/product-registry";

const RESONANCE_PRODUCT = OREMEA_PRODUCT_REGISTRY.resonance;

export const RESONANCE_REGULAR_PRICE = formatOremeaPrice(
  RESONANCE_PRODUCT.pricing.regularPriceCents,
  RESONANCE_PRODUCT.pricing.currency,
);
export const RESONANCE_LAUNCH_PRICE = formatOremeaPrice(
  RESONANCE_PRODUCT.pricing.launchPriceCents,
  RESONANCE_PRODUCT.pricing.currency,
);
export const RESONANCE_LAUNCH_LABEL = "Launch offer";
