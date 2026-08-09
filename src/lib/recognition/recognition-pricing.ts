export const RECOGNITION_PRICING = {
  currency: "USD",
  launchPriceCents: 699,
  regularPriceCents: 999,
  purchaseType: "one_time",
} as const;

export function formatRecognitionPrice(priceCents: number) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: RECOGNITION_PRICING.currency,
  }).format(priceCents / 100);
}
