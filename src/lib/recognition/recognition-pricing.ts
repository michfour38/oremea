import {
  OREMEA_PRODUCT_REGISTRY,
  formatOremeaPrice,
} from "@/src/lib/oremea/product-registry";

const RECOGNITION_PRODUCT = OREMEA_PRODUCT_REGISTRY.recognition;

export const RECOGNITION_PRICING = {
  currency: RECOGNITION_PRODUCT.pricing.currency,
  launchPriceCents: RECOGNITION_PRODUCT.pricing.launchPriceCents,
  regularPriceCents: RECOGNITION_PRODUCT.pricing.regularPriceCents,
  purchaseType: RECOGNITION_PRODUCT.pricing.purchaseType,
  includedRefinements: RECOGNITION_PRODUCT.access.includedRefinements,
} as const;

export function formatRecognitionPrice(priceCents: number) {
  return formatOremeaPrice(priceCents, RECOGNITION_PRICING.currency);
}
