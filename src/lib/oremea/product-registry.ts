export type OremeaProductKey = "recognition" | "resonance" | "compass";

export type OremeaProductAvailability = "live" | "coming_soon" | "unavailable";
export type OremeaPurchaseType = "one_time" | "recurring";

type OremeaProductPricing = {
  currency: "USD";
  launchPriceCents: number;
  regularPriceCents: number;
  purchaseType: OremeaPurchaseType;
};

type OremeaProduct = {
  key: OremeaProductKey;
  name: string;
  availability: OremeaProductAvailability;
  entryHref: string;
  pricing: OremeaProductPricing;
  access: {
    unit: string;
    days?: number;
    autoRenews: boolean;
    includedRefinements?: number;
  };
};

/**
 * Canonical commercial truth for Oremea products.
 *
 * Product names, availability, entry routes, pricing, purchase type, and access
 * rules must be read from this registry rather than duplicated in UI code.
 */
export const OREMEA_PRODUCT_REGISTRY = {
  recognition: {
    key: "recognition",
    name: "Recognition",
    availability: "live",
    entryHref: "https://recognition.oremea.com",
    pricing: {
      currency: "USD",
      launchPriceCents: 999,
      regularPriceCents: 999,
      purchaseType: "one_time",
    },
    access: {
      unit: "per complete process",
      autoRenews: false,
      includedRefinements: 1,
    },
  },
  resonance: {
    key: "resonance",
    name: "Resonance",
    availability: "live",
    entryHref: "/resonance",
    pricing: {
      currency: "USD",
      launchPriceCents: 1999,
      regularPriceCents: 2999,
      purchaseType: "one_time",
    },
    access: {
      unit: "per seven-day room",
      days: 7,
      autoRenews: false,
    },
  },
  compass: {
    key: "compass",
    name: "Compass",
    availability: "live",
    entryHref: "/compass/access",
    pricing: {
      currency: "USD",
      launchPriceCents: 1999,
      regularPriceCents: 2999,
      purchaseType: "one_time",
    },
    access: {
      unit: "per 30 days",
      days: 30,
      autoRenews: false,
    },
  },
} as const satisfies Record<OremeaProductKey, OremeaProduct>;

export function getOremeaProduct(product: OremeaProductKey) {
  return OREMEA_PRODUCT_REGISTRY[product];
}

export function formatOremeaPrice(priceCents: number, currency: "USD" = "USD") {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency,
  }).format(priceCents / 100);
}
