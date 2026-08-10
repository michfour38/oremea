export const RECOGNITION_PRICING = {
  currency: "USD",
  launchPriceCents: 1499,
  regularPriceCents: 1999,
  billingInterval: "month",
  purchaseType: "subscription",
} as const;

export function formatRecognitionPrice(priceCents: number) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: RECOGNITION_PRICING.currency,
  }).format(priceCents / 100);
}
