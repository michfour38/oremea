export const OREMEA_PRICING = {
  recognition: {
    currency: "USD",
    launchPriceCents: 1499,
    standardPriceCents: 1999,
    billingInterval: "month",
    purchaseType: "subscription",
  },
  resonance: {
    currency: "USD",
    launchPriceCents: 1999,
    standardPriceCents: 2999,
    accessDays: 7,
    purchaseType: "one_time",
    autoRenews: false,
  },
  compass: {
    currency: "USD",
    launchPriceCents: 1999,
    standardPriceCents: 2999,
    accessDays: 30,
    accessOptions: ["30_day_pass", "monthly_subscription"],
    billingInterval: "month",
  },
} as const;

export type OremeaPricedProduct = keyof typeof OREMEA_PRICING;

export function formatOremeaPrice(
  priceCents: number,
  currency: string = "USD",
) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency,
  }).format(priceCents / 100);
}

export function formatProductPrice(
  product: OremeaPricedProduct,
  priceCents: number,
) {
  return formatOremeaPrice(priceCents, OREMEA_PRICING[product].currency);
}
