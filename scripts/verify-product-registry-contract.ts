import assert from "node:assert/strict";

import {
  OREMEA_PRODUCT_REGISTRY,
  formatOremeaPrice,
} from "../src/lib/oremea/product-registry";

assert.deepEqual(
  Object.keys(OREMEA_PRODUCT_REGISTRY),
  ["recognition", "resonance", "compass"],
  "The canonical registry must contain the three live Oremea products.",
);

const recognition = OREMEA_PRODUCT_REGISTRY.recognition;
assert.equal(recognition.name, "Recognition");
assert.equal(recognition.availability, "live");
assert.equal(recognition.entryUrl, "https://recognition.oremea.com");
assert.equal(formatOremeaPrice(recognition.pricing.launchPriceCents), "$9.99");
assert.equal(recognition.pricing.purchaseType, "one_time");
assert.equal(recognition.access.includedRefinements, 1);

const resonance = OREMEA_PRODUCT_REGISTRY.resonance;
assert.equal(resonance.name, "Resonance");
assert.equal(resonance.availability, "live");
assert.equal(resonance.entryUrl, "/resonance");
assert.equal(formatOremeaPrice(resonance.pricing.launchPriceCents), "$19.99");
assert.equal(formatOremeaPrice(resonance.pricing.regularPriceCents), "$29.99");
assert.equal(resonance.pricing.purchaseType, "one_time");
assert.equal(resonance.access.days, 7);
assert.equal(resonance.access.autoRenews, false);

const compass = OREMEA_PRODUCT_REGISTRY.compass;
assert.equal(compass.name, "Compass");
assert.equal(compass.availability, "live");
assert.equal(compass.entryUrl, "/compass/access");
assert.equal(formatOremeaPrice(compass.pricing.launchPriceCents), "$19.99");
assert.equal(formatOremeaPrice(compass.pricing.regularPriceCents), "$29.99");
assert.equal(compass.pricing.purchaseType, "one_time");
assert.equal(compass.access.days, 30);
assert.equal(compass.access.autoRenews, false);

console.log("Canonical product registry contract checks passed.");
