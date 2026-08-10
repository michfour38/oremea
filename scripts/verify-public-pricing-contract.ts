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

const publicPricingSource = publicPricingFiles
  .map((file) => `${file}\n${readFileSync(file, "utf8")}`)
  .join("\n\n");

const forbiddenLegacyCopy = [
  /\$9\.99\/month/i,
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

console.log("Public pricing contract checks passed.");
