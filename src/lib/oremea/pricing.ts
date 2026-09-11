export const OREMEA_PRICING = {
  recognition: {
    currency: "USD",
    launchPriceCents: 1999,
    standardPriceCents: 1999,
    billingInterval: "month",
    purchaseType: "subscription",
  },
  resonance: {
    currency: "USD",
    launchPriceCents: 5000,
    standardPriceCents: 5000,
    accessDays: 7,
    featuredVisitQuantities: [1, 3, 4],
    visitPricesCents: {
      1: 5000,
      2: 9500,
      3: 14000,
      4: 18000,
      5: 22000,
      6: 26000,
      7: 30000,
      8: 33500,
      9: 37000,
      10: 40000,
    },
    purchaseType: "one_time",
    autoRenews: false,
  },
  compass: {
    currency: "USD",
    launchPriceCents: 5000,
    standardPriceCents: 5000,
    billingInterval: "month",
    purchaseType: "subscription",
    cancelAnytime: true,
    // Retained only so historic one-time entitlements can expire correctly.
    // This is not a current public purchase option.
    legacyPassAccessDays: 30,
  },
  current: {
    currency: "USD",
    launchPriceCents: 2999,
    standardPriceCents: 2999,
    billingInterval: "month",
    purchaseType: "subscription",
    invitationOnly: true,
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
