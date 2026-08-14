import {
  OREMEA_PRICING,
  formatProductPrice,
} from "@/src/lib/oremea/pricing";

const current = OREMEA_PRICING.current;

export const CURRENT_PRICING = {
  ...current,
  regularPriceCents: current.standardPriceCents,
} as const;

export function formatCurrentPrice(priceCents: number) {
  return formatProductPrice("current", priceCents);
}
