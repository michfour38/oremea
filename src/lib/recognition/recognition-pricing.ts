export const RECOGNITION_PRICING = {
  currency: "USD",
  launchPriceCents: 999,
  regularPriceCents: 999,
  purchaseType: "one_time",
  includedRefinements: 1,
} as const;

export function formatRecognitionPrice(priceCents: number) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: RECOGNITION_PRICING.currency,
  }).format(priceCents / 100);
}
