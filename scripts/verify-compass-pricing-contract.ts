import assert from "node:assert/strict"
import { readFileSync } from "node:fs"

import { OREMEA_PRICING } from "../src/lib/oremea/pricing"
import { COMPASS_PRICING } from "../src/lib/compass/compass-pricing"

assert.equal(
  COMPASS_PRICING.launchPriceCents,
  OREMEA_PRICING.compass.launchPriceCents,
  "Compass price must reference the central pricing registry.",
)
assert.equal(
  COMPASS_PRICING.standardPriceCents,
  OREMEA_PRICING.compass.standardPriceCents,
  "Compass standard price must reference the central pricing registry.",
)
assert.equal(
  COMPASS_PRICING.launchPriceCents,
  1999,
  "Compass current launch price must remain USD 19.99/month.",
)
assert.equal(
  COMPASS_PRICING.standardPriceCents,
  1999,
  "Compass current standard price must remain USD 19.99/month without comparison-price fiction.",
)
assert.equal(
  COMPASS_PRICING.billingInterval,
  "month",
  "Compass must remain monthly.",
)
assert.equal(
  COMPASS_PRICING.purchaseType,
  "subscription",
  "Compass must remain a subscription rather than a current one-time pass.",
)
assert.equal(
  COMPASS_PRICING.cancelAnytime,
  true,
  "Compass must remain cancellable anytime.",
)
assert.equal(
  COMPASS_PRICING.legacyPassAccessDays,
  30,
  "Historic Compass passes must retain their original 30-day expiry contract.",
)

const accessPage = readFileSync("app/compass/access/page.tsx", "utf8")
const accessOffer = readFileSync("components/compass/CompassAccessOffer.tsx", "utf8")
const publicCompassAccess = `${accessPage}\n${accessOffer}`

assert.doesNotMatch(
  publicCompassAccess,
  /Choose 30-day pass|30-day pass or monthly|want a defined Compass period|COMPASS_CHECKOUT_URL|No automatic renewal|Nothing renews automatically|Standard [^\n]*-day access/,
  "Compass must not publicly sell or describe the superseded 30-day pass.",
)
assert.doesNotMatch(
  accessOffer,
  /COMPASS_PRICING\.accessDays/,
  "Compass access UI must not depend on the removed current-pass duration field.",
)
assert.match(
  publicCompassAccess,
  /Cancel anytime[\s\S]*Archive/i,
  "Compass checkout must communicate monthly cancellation and preserved Archive access.",
)

console.log("Compass pricing contract checks passed.")
