import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const publicPricingFiles = [
  "app/page.tsx",
  "components/site/product-launch-price.tsx",
  "components/site/sections/compare-recognition.tsx",
  "components/site/sections/compare-resonance.tsx",
  "components/site/sections/compare-compass.tsx",
  "components/site/sections/explore-ecosystem.tsx",
];

const registryBackedProductSurfaces = [
  "app/page.tsx",
  "components/site/sections/compare-recognition.tsx",
  "components/site/sections/compare-resonance.tsx",
  "components/site/sections/compare-compass.tsx",
  "components/site/sections/explore-ecosystem.tsx",
];

const publicPricingSource = publicPricingFiles
  .map((file) => `${file}\n${readFileSync(file, "utf8")}`)
  .join("\n\n");

const forbiddenLegacyCopy = [
  /\$9\.99\/month/i,
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

for (const file of registryBackedProductSurfaces) {
  const source = readFileSync(file, "utf8");

  assert.match(
    source,
    /OREMEA_PRODUCT_REGISTRY/,
    `${file} must read product commercial truth from the canonical registry.`,
  );

  assert.doesNotMatch(
    source,
    /["']https:\/\/(?:recognition|resonance|compass)\.oremea\.com["']/,
    `${file} must not hard-code an Oremea product subdomain.`,
  );

  assert.doesNotMatch(
    source,
    /["']\/(?:resonance|compass\/access)["']/,
    `${file} must not hard-code a canonical product entry route.`,
  );
}

console.log("Public pricing contract checks passed.");
