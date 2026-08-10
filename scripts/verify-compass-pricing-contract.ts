import { OREMEA_PRICING } from "../src/lib/oremea/pricing"
import { COMPASS_PRICING } from "../src/lib/compass/compass-pricing"

function assert(condition: unknown, message: string): asserts condition {
  if (!condition) throw new Error(message)
}

assert(
  COMPASS_PRICING.launchPriceCents === OREMEA_PRICING.compass.launchPriceCents,
  "Compass launch price must reference the central pricing registry.",
)
assert(
  COMPASS_PRICING.standardPriceCents === OREMEA_PRICING.compass.standardPriceCents,
  "Compass standard price must reference the central pricing registry.",
)
assert(
  COMPASS_PRICING.accessDays === OREMEA_PRICING.compass.accessDays,
  "Compass access days must reference the central pricing registry.",
)
assert(
  COMPASS_PRICING.autoRenews === OREMEA_PRICING.compass.autoRenews,
  "Compass renewal behavior must reference the central pricing registry.",
)

console.log("Compass pricing contract checks passed.")
