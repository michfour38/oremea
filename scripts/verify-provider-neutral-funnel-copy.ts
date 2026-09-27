import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const customerFacingFunnelFiles = [
  "app/recognition/purchase/page.tsx",
  "app/compass/access/page.tsx",
  "app/(member)/resonance/purchase/page.tsx",
  "app/(member)/resonance/visits/page.tsx",
];

for (const file of customerFacingFunnelFiles) {
  const source = readFileSync(file, "utf8");
  assert.doesNotMatch(
    source,
    /\bWhop\b/,
    `${file} must keep the payment provider out of customer-facing funnel copy.`,
  );
}

console.log("Customer-facing Oremea funnels remain payment-provider neutral.");
