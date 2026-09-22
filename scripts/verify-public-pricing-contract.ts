import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const priceFreeSurfaces = [
  "app/page.tsx",
  "app/resonance-rooms/page.tsx",
  "app/(marketing)/resonance/enter/page.tsx",
  "app/(member)/entry/page.tsx",
  "components/site/sections/compare-recognition.tsx",
  "components/site/sections/compare-resonance.tsx",
  "components/site/sections/compare-compass.tsx",
  "components/site/sections/explore-ecosystem.tsx",
  "components/site/sections/explore-hero.tsx",
  "components/site/sections/explore-starting-point.tsx",
  "components/site/sections/explore-what-is.tsx",
  "components/site/sections/explore-privacy-safety.tsx",
  "components/site/sections/current-panel.tsx",
];

const pricingImplementationPatterns = [
  /ProductLaunchPrice/,
  /RECOGNITION_PRICING/,
  /COMPASS_PRICING/,
  /CURRENT_PRICING/,
  /VISIT_PRICES/,
  /RESONANCE_LAUNCH_PRICE/,
  /RESONANCE_REGULAR_PRICE/,
  /formatRecognitionPrice/,
  /formatCompassPrice/,
  /formatCurrentPrice/,
  /formatOremeaPrice/,
  /\$\s*\d/,
  /\bR\s*\d/i,
  /unit="\/ month"/,
  /From[^\n]{0,80}one visit/i,
  /\d\s*and\s*\d-visit packs available/i,
];

for (const file of priceFreeSurfaces) {
  const source = readFileSync(file, "utf8");
  for (const pattern of pricingImplementationPatterns) {
    assert.doesNotMatch(
      source,
      pattern,
      `${file} must remain price-free; pricing belongs inside a purchase funnel.`,
    );
  }
}

const funnelPricing = [
  {
    file: "app/recognition/purchase/page.tsx",
    pattern: /formatRecognitionPrice\(RECOGNITION_PRICING\.launchPriceCents\)/,
  },
  {
    file: "app/compass/access/page.tsx",
    pattern: /formatCompassPrice\(COMPASS_PRICING\.launchPriceCents\)/,
  },
  {
    file: "app/(member)/resonance/visits/page.tsx",
    pattern: /formatOremeaPrice\(VISIT_PRICES\[quantity\]\)/,
  },
  {
    file: "app/(member)/resonance/purchase/page.tsx",
    pattern: /RESONANCE_LAUNCH_PRICE/,
  },
];

for (const { file, pattern } of funnelPricing) {
  assert.match(
    readFileSync(file, "utf8"),
    pattern,
    `${file} must keep pricing inside the purchase funnel.`,
  );
}

const combined = [
  ...priceFreeSurfaces,
  ...funnelPricing.map(({ file }) => file),
]
  .map((file) => `${file}\n${readFileSync(file, "utf8")}`)
  .join("\n\n");

for (const legacy of [
  /Recognition[^\n]{0,120}one-time access/i,
  /\bR520\b/i,
  /\bR1240\b/i,
  /approximately 10 weeks/i,
  /10-week structure/i,
  /\/oremea\/enter/i,
]) {
  assert.doesNotMatch(combined, legacy, `Pricing surfaces still contain legacy copy matching ${legacy}.`);
}

console.log("Public marketing is price-free; prices remain inside purchase funnels.");
