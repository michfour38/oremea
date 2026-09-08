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

assert.deepEqual(
  {
    recognition: {
      launch: OREMEA_PRICING.recognition.launchPriceCents,
      standard: OREMEA_PRICING.recognition.standardPriceCents,
    },
    resonance: {
      launch: OREMEA_PRICING.resonance.launchPriceCents,
      standard: OREMEA_PRICING.resonance.standardPriceCents,
    },
    compass: {
      launch: OREMEA_PRICING.compass.launchPriceCents,
      standard: OREMEA_PRICING.compass.standardPriceCents,
    },
    current: {
      launch: OREMEA_PRICING.current.launchPriceCents,
      standard: OREMEA_PRICING.current.standardPriceCents,
    },
  },
  {
    recognition: { launch: 1999, standard: 1999 },
    resonance: { launch: 5000, standard: 5000 },
    compass: { launch: 5000, standard: 5000 },
    current: { launch: 2999, standard: 2999 },
  },
  "Visible products must use the USD 50 premium launch price while hidden products retain their approved prices",
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
