import { OREMEA_PRICING } from "../src/lib/oremea/pricing"
import { COMPASS_PRICING } from "../src/lib/compass/compass-pricing"
import { readFileSync } from "node:fs"

function assert(condition: unknown, message: string): asserts condition {
  if (!condition) throw new Error(message)
}

assert(
  COMPASS_PRICING.launchPriceCents === OREMEA_PRICING.compass.launchPriceCents,
  "Compass price must reference the central pricing registry.",
)
assert(
  COMPASS_PRICING.standardPriceCents === OREMEA_PRICING.compass.standardPriceCents,
  "Compass standard price must reference the central pricing registry.",
)
assert(
  COMPASS_PRICING.launchPriceCents === 1999 &&
    COMPASS_PRICING.standardPriceCents === 1999,
  "Compass current price must remain USD 19.99/month without a comparison-price fiction.",
)
assert(
  COMPASS_PRICING.billingInterval === "month" &&
    COMPASS_PRICING.purchaseType === "subscription" &&
    COMPASS_PRICING.cancelAnytime === true,
  "Compass must remain one monthly membership that can be cancelled anytime.",
)
assert(
  COMPASS_PRICING.legacyPassAccessDays === 30,
  "Historic Compass passes must retain their original 30-day expiry contract.",
)

const accessPage = readFileSync("app/compass/access/page.tsx", "utf8")
assert.doesNotMatch(
  accessPage,
  /Choose 30-day pass|30-day pass or monthly|want a defined Compass period|COMPASS_CHECKOUT_URL/,
  "Compass must not publicly sell the superseded 30-day pass.",
)
assert.match(
  accessPage,
  /Cancel anytime[\s\S]*Archive/i,
  "Compass checkout must communicate monthly cancellation and preserved Archive access.",
)

console.log("Compass pricing contract checks passed.")
