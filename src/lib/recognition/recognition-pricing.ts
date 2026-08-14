import {
  OREMEA_PRICING,
  formatProductPrice,
} from "@/src/lib/oremea/pricing";

const recognition = OREMEA_PRICING.recognition;

export const RECOGNITION_PRICING = {
  ...recognition,
  regularPriceCents: recognition.standardPriceCents,
} as const;

export function formatRecognitionPrice(priceCents: number) {
  return formatProductPrice("recognition", priceCents);
}
