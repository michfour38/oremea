import {
  OREMEA_PRICING,
  formatProductPrice,
} from "@/src/lib/oremea/pricing";

const resonance = OREMEA_PRICING.resonance;

export const RESONANCE_REGULAR_PRICE = formatProductPrice(
  "resonance",
  resonance.standardPriceCents,
);
export const RESONANCE_LAUNCH_PRICE = formatProductPrice(
  "resonance",
  resonance.launchPriceCents,
);
export const RESONANCE_LAUNCH_LABEL = "Launch offer";
