import {
  OREMEA_PRICING,
  formatProductPrice,
} from "@/src/lib/oremea/pricing"

export const COMPASS_PRICING = OREMEA_PRICING.compass

export function formatCompassPrice(priceCents: number) {
  return formatProductPrice("compass", priceCents)
}
