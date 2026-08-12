import assert from "node:assert/strict";
import { readdirSync, readFileSync, statSync } from "node:fs";
import { join, relative } from "node:path";

import { OREMEA_PRICING } from "../src/lib/oremea/pricing";

const registryPath = "src/lib/oremea/pricing.ts";
const pricingAdapters = [
  "src/lib/recognition/recognition-pricing.ts",
  "src/lib/resonance/resonance-pricing.ts",
  "src/lib/compass/compass-pricing.ts",
  "src/lib/current/current-pricing.ts",
];

assert.deepEqual(
  Object.keys(OREMEA_PRICING).sort(),
  ["compass", "current", "recognition", "resonance"],
  "Every currently priced Oremea product must live in the central pricing registry",
);

for (const file of pricingAdapters) {
  const source = readFileSync(file, "utf8");
  assert.match(
    source,
    /src\/lib\/oremea\/pricing/,
    `${file} must reference the central pricing registry`,
  );
  assert.doesNotMatch(
    source,
    /(?:launchPriceCents|standardPriceCents|regularPriceCents)\s*:\s*\d+/,
    `${file} must not define its own numeric price`,
  );
  assert.doesNotMatch(
    source,
    /["'`]\$\d/,
    `${file} must not define a formatted dollar price`,
  );
}

function sourceFiles(root: string): string[] {
  const files: string[] = [];
  for (const entry of readdirSync(root)) {
    const path = join(root, entry);
    const stat = statSync(path);
    if (stat.isDirectory()) {
      files.push(...sourceFiles(path));
    } else if (/\.(?:ts|tsx)$/.test(entry)) {
      files.push(path);
    }
  }
  return files;
}

for (const root of ["app", "components", "src"]) {
  for (const file of sourceFiles(root)) {
    const normalized = relative(".", file).replaceAll("\\", "/");
    if (normalized === registryPath) continue;

    const source = readFileSync(file, "utf8");
    assert.doesNotMatch(
      source,
      /["'`]\$\d+(?:\.\d{1,2})?/,
      `${normalized} contains a hard-coded dollar price; reference ${registryPath} instead`,
    );
    assert.doesNotMatch(
      source,
      /(?:launchPriceCents|standardPriceCents|regularPriceCents)\s*:\s*\d+/,
      `${normalized} defines a product price outside ${registryPath}`,
    );
  }
}

console.log("Central Oremea pricing registry checks passed.");
