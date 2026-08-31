import { OREMEA_PRICING } from "@/src/lib/oremea/pricing";

export const OREMEA_PRODUCT_TRUTH_SCHEMA_VERSION = 1 as const;

export const OREMEA_PRODUCT_TRUTH = {
  recognition: {
    id: "recognition",
    name: "Recognition",
    canonicalPath: "/recognition",
    visibility: "public",
    description:
      "A private AI discussion journal for thoughts that need more than a journal page. One focused question at a time, with meaning and choices remaining yours.",
    commercial: OREMEA_PRICING.recognition,
    sourceRefs: [
      "src/lib/oremea/pricing.ts",
      "app/recognition/layout.tsx",
    ],
  },
  resonance: {
    id: "resonance",
    name: "Resonance",
    canonicalPath: "/resonance",
    visibility: "public",
    description:
      "A private seven-day room with one teacher and one relational territory. Daily questions and Mirrors stay inside the participant's own material rather than turning the room into advice, diagnosis, or a theory about the person.",
    commercial: OREMEA_PRICING.resonance,
    sourceRefs: [
      "src/lib/oremea/pricing.ts",
      "components/site/sections/compare-resonance.tsx",
    ],
  },
  compass: {
    id: "compass",
    name: "Compass",
    canonicalPath: "/compass",
    visibility: "public",
    description:
      "Turn what matters into clear direction, keep it visible on a working Map, and make the next movement that is actually yours.",
    commercial: OREMEA_PRICING.compass,
    sourceRefs: [
      "src/lib/oremea/pricing.ts",
      "app/compass/layout.tsx",
    ],
  },
  current: {
    id: "current",
    name: "The Current",
    canonicalPath: "/current",
    visibility: "member_only",
    description:
      "The shared Oremea member space. Entry is offered through participation in Oremea and remains a separate choice.",
    commercial: OREMEA_PRICING.current,
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
    products: Object.values(OREMEA_PRODUCT_TRUTH),
  } as const;
}
