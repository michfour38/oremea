import { OREMEA_AFFILIATE_POLICY } from "./affiliate-policy";
import { OREMEA_PRICING, getPartnerOfferPricing } from "./pricing";

/**
 * Additive, configuration-first partner experiences.
 *
 * This module defines presentation and PLANNED commercial offers only.
 * It does not create Whop products, take payment, grant access, link SUSTAIN
 * accounts, or override the existing standalone product pricing/access rules.
 */
export type PartnerProduct = "sustain" | "recognition" | "compass" | "resonance";
export type PartnerStatus = "draft" | "published";
export type PartnerPurchaseMode = "subscription" | "one_time";

export const PARTNER_PRODUCT_LABELS: Readonly<Record<PartnerProduct, string>> = {
  sustain: "SUSTAIN",
  recognition: "Recognition",
  compass: "Compass",
  resonance: "Resonance",
};

/** A verified, per-billing-cycle provider reference, never an access grant. */
export type PartnerCheckout = Readonly<{
  whopProductId: string;
  whopPlanId: string;
  href: string;
  currency: "ZAR" | "USD";
  chargePriceCents: number;
}>;

export type PartnerOffer = Readonly<{
  key: string;
  title: string;
  programmeMonths: number;
  purchaseMode: PartnerPurchaseMode;
  billingInterval: "month" | null;
  includedProducts: readonly PartnerProduct[];
  /**
   * When true, further products are intended but not yet approved or unlocked.
   * Never interpret this flag as an entitlement to unreleased products.
   */
  expansionPending: boolean;
  status: PartnerStatus;
  checkout: PartnerCheckout | null;
}>;

export type PartnerExperience = Readonly<{
  slug: string;
  status: PartnerStatus;
  brand: Readonly<{
    name: string;
    headline: string;
    introduction: string;
    background: string;
    foreground: string;
    accent: string;
    /** Optional local public asset path. Nothing is uploaded automatically. */
    backgroundAssetPath: string | null;
    /** Optional mobile-specific local background (falls back to desktop image). */
    mobileBackgroundAssetPath: string | null;
    /**
     * Resonance's ten original room paintings remain exclusive to OREMEA.
     * Partners supply their own optional imagery for each room. If absent,
     * their version uses a neutral background, NEVER OREMEA's room artwork.
     */
    resonanceScenes: Readonly<{
      entry: Readonly<{ desktop: string | null; mobile: string | null }>;
      archive: Readonly<{ desktop: string | null; mobile: string | null }>;
      rooms: Readonly<Partial<Record<number, Readonly<{ desktop: string | null; mobile: string | null }>>>>;
    }>;
  }>;
  /** Planning only. Whop remains responsible for actual payouts and approval. */
  proposedCreatorRate: number;
  offers: readonly PartnerOffer[];
}>;

/**
 * New partner offers are additions to the established OREMEA store.
 * Never copy independent prices here: use OREMEA_PRICING for existing offers.
 * Do not add unconfirmed Whop IDs or checkout URLs.
 */
export const OREMEA_PARTNER_EXPERIENCES = {
  angela: {
    slug: "angela",
    status: "draft",
    brand: {
      name: "Angela",
      headline: "Your next step, supported.",
      introduction: "A guided space for reflection, commitments and progress.",
      background: "#171714",
      foreground: "#F4F0E8",
      accent: "#D4AF37",
      backgroundAssetPath: null,
      mobileBackgroundAssetPath: null,
      resonanceScenes: {
        entry: { desktop: null, mobile: null },
        archive: { desktop: null, mobile: null },
        rooms: {},
      },
    },
    proposedCreatorRate: OREMEA_AFFILIATE_POLICY.approvedCreatorRate,
    offers: [
      {
        key: "starter",
        title: "One-month programme",
        programmeMonths: 1,
        purchaseMode: "subscription",
        billingInterval: "month",
        includedProducts: ["sustain", "recognition"],
        expansionPending: false,
        status: "draft",
        checkout: null,
      },
      {
        key: "guided",
        title: "Three-month programme",
        programmeMonths: 3,
        purchaseMode: "subscription",
        billingInterval: "month",
        includedProducts: ["sustain", "recognition", "compass"],
        expansionPending: false,
        status: "draft",
        checkout: null,
      },
      {
        key: "expanded",
        title: "Four-month programme",
        programmeMonths: 4,
        purchaseMode: "subscription",
        billingInterval: "month",
        includedProducts: ["sustain", "recognition", "compass"],
        expansionPending: true,
        status: "draft",
        checkout: null,
      },
    ],
  },
} as const satisfies Readonly<Record<string, PartnerExperience>>;

/** Partner offer amounts live only in the central OREMEA pricing registry. */
export function getPartnerDraftPricing(partnerSlug: string, offerKey: string) {
  return getPartnerOfferPricing(partnerSlug, offerKey);
}

export function getStandalonePricing(product: keyof typeof OREMEA_PRICING) {
  return OREMEA_PRICING[product];
}

function safeWhopCheckout(checkout: PartnerCheckout | null): checkout is PartnerCheckout {
  if (!checkout ||
    !checkout.whopProductId.trim() ||
    !checkout.whopPlanId.trim() ||
    !Number.isSafeInteger(checkout.chargePriceCents) ||
    checkout.chargePriceCents <= 0 ||
    !["ZAR", "USD"].includes(checkout.currency)) return false;

  try {
    const url = new URL(checkout.href);
    return url.protocol === "https:" &&
      ["whop.com", "www.whop.com"].includes(url.hostname) &&
      url.pathname.startsWith("/checkout/") &&
      !url.username && !url.password;
  } catch {
    return false;
  }
}

/** Resolves presentation only; payment callbacks must verify Whop independently. */
export function resolvePublishedPartnerExperience(
  experience: PartnerExperience | null,
): (Omit<PartnerExperience, "offers"> & { offers: readonly (PartnerOffer & { checkout: PartnerCheckout })[] }) | null {
  if (!experience || experience.status !== "published") return null;
  const offers = experience.offers.filter((offer): offer is PartnerOffer & { checkout: PartnerCheckout } =>
    offer.status === "published" &&
    offer.programmeMonths > 0 &&
    Number.isSafeInteger(offer.programmeMonths) &&
    ((offer.purchaseMode === "subscription" && offer.billingInterval === "month") ||
      (offer.purchaseMode === "one_time" && offer.billingInterval === null)) &&
    offer.includedProducts.length > 0 &&
    !offer.expansionPending &&
    safeWhopCheckout(offer.checkout),
  );
  return offers.length ? { ...experience, offers } : null;
}

/** Drafts, unconfirmed prices and unfinished bundles are never publicly bookable. */
export function getPublishedPartnerExperience(slug: string) {
  if (!/^[a-z0-9-]{1,64}$/.test(slug)) return null;
  const experience = OREMEA_PARTNER_EXPERIENCES[
    slug as keyof typeof OREMEA_PARTNER_EXPERIENCES
  ] ?? null;
  return resolvePublishedPartnerExperience(experience);
}
