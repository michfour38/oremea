import { OREMEA_PRICING } from "@/src/lib/oremea/pricing";

export const OREMEA_PRODUCT_TRUTH_SCHEMA_VERSION = 2 as const;

const recognitionCommercial = {
  currency: OREMEA_PRICING.recognition.currency,
  priceCents: OREMEA_PRICING.recognition.standardPriceCents,
  purchaseType: OREMEA_PRICING.recognition.purchaseType,
  billingInterval: OREMEA_PRICING.recognition.billingInterval,
} as const;

const compassCommercial = {
  currency: OREMEA_PRICING.compass.currency,
  priceCents: OREMEA_PRICING.compass.standardPriceCents,
  purchaseType: OREMEA_PRICING.compass.purchaseType,
  billingInterval: OREMEA_PRICING.compass.billingInterval,
  cancelAnytime: OREMEA_PRICING.compass.cancelAnytime,
} as const;

const resonanceCommercial = {
  currency: OREMEA_PRICING.resonance.currency,
  priceCents: OREMEA_PRICING.resonance.standardPriceCents,
  purchaseType: OREMEA_PRICING.resonance.purchaseType,
  accessDays: OREMEA_PRICING.resonance.accessDays,
  autoRenews: OREMEA_PRICING.resonance.autoRenews,
} as const;

const currentCommercial = {
  currency: OREMEA_PRICING.current.currency,
  priceCents: OREMEA_PRICING.current.standardPriceCents,
  purchaseType: OREMEA_PRICING.current.purchaseType,
  billingInterval: OREMEA_PRICING.current.billingInterval,
  invitationOnly: OREMEA_PRICING.current.invitationOnly,
} as const;

const resonanceRooms = [
  {
    id: "resonance-hearth",
    name: "Resonance · The Hearth",
    description: "Begin connection through safety, presence and belonging.",
    whopUrl: "https://whop.com/oremea/resonance-hearth/",
    sourceRef: "docs/resonance-seed-audit-hearth.md",
  },
  {
    id: "resonance-mirror",
    name: "Resonance · Mirror",
    description: "Sharpen relational self-awareness through reflection.",
    whopUrl: "https://whop.com/oremea/resonance-mirror/",
    sourceRef: "docs/resonance-seed-audit-mirror.md",
  },
  {
    id: "resonance-garden",
    name: "Resonance · Garden",
    description: "Explore care, reciprocity and emotional tending.",
    whopUrl: "https://whop.com/oremea/resonance-garden/",
    sourceRef: "docs/resonance-seed-audit-garden.md",
  },
  {
    id: "resonance-bearing",
    name: "Resonance · Bearing",
    description: "Make values, direction and deeper alignment visible.",
    whopUrl: "https://whop.com/oremea/resonance-d7/",
    sourceRef: "docs/resonance-seed-audit-bearing.md",
  },
  {
    id: "resonance-pulse",
    name: "Resonance · Pulse",
    description: "Explore attraction, aliveness, chemistry and relational rhythm.",
    whopUrl: "https://whop.com/oremea/resonance-pulse/",
    sourceRef: "docs/resonance-seed-audit-pulse.md",
  },
  {
    id: "resonance-shadow",
    name: "Resonance · Shadow",
    description: "Bring fear and trigger patterns beneath connection into view.",
    whopUrl: "https://whop.com/oremea/resonance-shadow/",
    sourceRef: "docs/resonance-seed-audit-shadow.md",
  },
  {
    id: "resonance-forge",
    name: "Resonance · Forge",
    description: "Explore conflict, rupture, honesty, repair and restoration.",
    whopUrl: "https://whop.com/oremea/resonance-forge/",
    sourceRef: "docs/resonance-seed-audit-forge.md",
  },
  {
    id: "resonance-vision",
    name: "Resonance · Vision",
    description: "Imagine the future shape of connection consciously and clearly.",
    whopUrl: "https://whop.com/oremea/resonance-vision/",
    sourceRef: "docs/resonance-seed-audit-vision.md",
  },
  {
    id: "resonance-gathering",
    name: "Resonance · Gathering",
    description: "Reflect, gather and make meaning of what has emerged.",
    whopUrl: "https://whop.com/oremea/resonance-gathering/",
    sourceRef: "docs/resonance-seed-audit-gathering.md",
  },
  {
    id: "resonance-becoming",
    name: "Resonance · Becoming",
    description: "Embody what emerged and carry the movement forward.",
    whopUrl: "https://whop.com/oremea/resonance-becoming/",
    sourceRef: "docs/resonance-seed-audit-becoming.md",
  },
] as const;

const resonanceProductTruth = Object.fromEntries(
  resonanceRooms.map((room) => [
    room.id,
    {
      id: room.id,
      name: room.name,
      canonicalUrl: null,
      canonicalStatus: "unresolved",
      websiteVisibility: "member_only",
      releaseStatus: "live",
      description: room.description,
      commercial: resonanceCommercial,
      commerce: {
        productId: null,
        url: room.whopUrl,
        visibility: "visible",
        discoverStatus: "live",
        affiliateStatus: "off",
      },
      sourceRefs: ["src/lib/oremea/pricing.ts", room.sourceRef],
    },
  ]),
);

export const OREMEA_PRODUCT_TRUTH = {
  recognition: {
    id: "recognition",
    name: "Recognition",
    canonicalUrl: "https://recognition.oremea.com/",
    canonicalStatus: "locked",
    websiteVisibility: "public",
    releaseStatus: "hidden",
    description:
      "A private AI discussion journal for thoughts that need more than a journal page. One focused question at a time, with meaning and choices remaining yours.",
    commercial: recognitionCommercial,
    commerce: {
      productId: "prod_NAaQbeq5EAF5S",
      url: "https://whop.com/oremea/recognition/",
      visibility: "hidden",
      discoverStatus: "not_listed",
      affiliateStatus: "off",
    },
    sourceRefs: [
      "src/lib/oremea/pricing.ts",
      "app/recognition/layout.tsx",
      "middleware.ts",
    ],
  },
  compass: {
    id: "compass",
    name: "Compass",
    canonicalUrl: "https://compass.oremea.com/",
    canonicalStatus: "locked",
    websiteVisibility: "public",
    releaseStatus: "live",
    description:
      "Turn what matters into clear direction, keep it visible on a working Map, and make the next movement that is actually yours.",
    commercial: compassCommercial,
    commerce: {
      productId: "prod_KGtKE3hOcN3Z2",
      url: "https://whop.com/oremea/compass-e0/",
      visibility: "visible",
      discoverStatus: "live",
      affiliateStatus: "off",
    },
    sourceRefs: [
      "src/lib/oremea/pricing.ts",
      "app/compass/layout.tsx",
      "middleware.ts",
    ],
  },
  ...resonanceProductTruth,
  "the-current": {
    id: "the-current",
    name: "The Current · Oremea",
    canonicalUrl: null,
    canonicalStatus: "unresolved",
    websiteVisibility: "member_only",
    releaseStatus: "hidden",
    description:
      "Private self-witnessing within a newly forming one-to-one relationship.",
    commercial: currentCommercial,
    commerce: {
      productId: null,
      url: null,
      visibility: "hidden",
      discoverStatus: "not_listed",
      affiliateStatus: "off",
    },
    sourceRefs: [
      "src/lib/oremea/pricing.ts",
      "components/site/sections/current-panel.tsx",
      "app/current/page.tsx",
    ],
  },
} as const;

export type OremeaProductTruthId = keyof typeof OREMEA_PRODUCT_TRUTH;

export function oremeaProductTruthSnapshot() {
  return {
    schemaVersion: OREMEA_PRODUCT_TRUTH_SCHEMA_VERSION,
    authority: "oremea_repository",
    truthScope: "current_only",
    products: Object.values(OREMEA_PRODUCT_TRUTH),
  } as const;
}
