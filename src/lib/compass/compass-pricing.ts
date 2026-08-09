export const COMPASS_PRICING = {
  currency: "USD",
  accessDays: 30,
  foundingPriceCents: 1999,
  standardPriceCents: 2999,
  autoRenews: false,
} as const

export function formatCompassPrice(priceCents: number) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: COMPASS_PRICING.currency,
  }).format(priceCents / 100)
}
