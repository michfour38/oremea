import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const publicPricingFiles = [
  "app/page.tsx",
  "app/(member)/entry/page.tsx",
  "app/(member)/resonance/purchase/page.tsx",
  "components/site/product-launch-price.tsx",
  "components/site/sections/compare-recognition.tsx",
  "components/site/sections/compare-resonance.tsx",
  "components/site/sections/compare-compass.tsx",
  "components/site/sections/explore-ecosystem.tsx",
];

const publicPricingSource = publicPricingFiles
  .map((file) => `${file}\n${readFileSync(file, "utf8")}`)
  .join("\n\n");

const forbiddenLegacyCopy = [
  /Recognition[^\n]{0,120}one-time access/i,
  /\bR520\b/i,
  /\bR1240\b/i,
  /approximately 10 weeks/i,
  /10-week structure/i,
  /\/oremea\/enter/i,
];

for (const pattern of forbiddenLegacyCopy) {
  assert.doesNotMatch(
    publicPricingSource,
    pattern,
    `Public pricing still contains legacy copy matching ${pattern}.`,
  );
}

for (const file of publicPricingFiles.filter((file) =>
  file.includes("compare-"),
)) {
  assert.match(
    readFileSync(file, "utf8"),
    /ProductLaunchPrice/,
    `${file} must use the shared launch-price presentation.`,
  );
}

const recognitionHomepage = readFileSync("app/page.tsx", "utf8");
const recognitionCompare = readFileSync(
  "components/site/sections/compare-recognition.tsx",
  "utf8",
);
const resonanceEntry = readFileSync("app/(member)/entry/page.tsx", "utf8");
const resonancePurchase = readFileSync(
  "app/(member)/resonance/purchase/page.tsx",
  "utf8",
);

assert.match(
  recognitionHomepage,
  /unit="\/ month"/,
  "Homepage Recognition pricing must present monthly subscription access.",
);
assert.match(
  recognitionCompare,
  /unit="\/ month"/,
  "Compare Recognition pricing must present monthly subscription access.",
);

for (const [label, source] of [
  ["Resonance room selector", resonanceEntry],
  ["Resonance purchase", resonancePurchase],
] as const) {
  assert.match(
    source,
    /RESONANCE_LAUNCH_PRICE\s*!==\s*RESONANCE_REGULAR_PRICE/,
    `${label} must detect whether a real launch discount exists.`,
  );
  assert.match(
    source,
    /HAS_RESONANCE_LAUNCH_DISCOUNT\s*\?\s*\([\s\S]*line-through[\s\S]*\)\s*:\s*null/,
    `${label} must not show a crossed-out regular price when launch and regular prices match.`,
  );
}

console.log("Public pricing contract checks passed.");
