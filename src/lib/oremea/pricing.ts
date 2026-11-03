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

/**
 * Additional partner offer quotes. These are INDICATIVE PROGRAMME TOTALS only,
 * not approved monthly instalments, one-off checkout prices or active Whop plans.
 *
 * Update amounts here when each partner approves their pricing. Keep the
 * established OREMEA_PRICING registry untouched for direct product sales.
 */
export const OREMEA_PARTNER_PRICING = {
  angela: {
    starter: {
      currency: "ZAR",
      status: "provisional",
      indicativeProgrammeTotalCents: 39_900,
      approvedMonthlyChargeCents: null,
      approvedOneOffChargeCents: null,
    },
    guided: {
      currency: "ZAR",
      status: "provisional",
      indicativeProgrammeTotalCents: 145_000,
      approvedMonthlyChargeCents: null,
      approvedOneOffChargeCents: null,
    },
    expanded: {
      currency: "ZAR",
      status: "provisional",
      indicativeProgrammeTotalCents: 199_900,
      approvedMonthlyChargeCents: null,
      approvedOneOffChargeCents: null,
    },
  },
} as const;

export type PartnerOfferPricing = {
  readonly currency: "ZAR" | "USD";
  readonly status: "provisional" | "approved";
  readonly indicativeProgrammeTotalCents: number | null;
  readonly approvedMonthlyChargeCents: number | null;
  readonly approvedOneOffChargeCents: number | null;
};

/** Central lookup for partner pages and checkout setup; never an access grant. */
export function getPartnerOfferPricing(
  partnerSlug: string,
  offerKey: string,
): PartnerOfferPricing | null {
  const registry: Readonly<Record<string, Readonly<Record<string, PartnerOfferPricing>>>> =
    OREMEA_PARTNER_PRICING;
  return registry[partnerSlug]?.[offerKey] ?? null;
}

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
