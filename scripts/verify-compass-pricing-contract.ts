import {
  COMPASS_PRICING,
  formatCompassPrice,
} from "../src/lib/compass/compass-pricing"

function assert(condition: unknown, message: string): asserts condition {
  if (!condition) throw new Error(message)
}

assert(
  formatCompassPrice(COMPASS_PRICING.launchPriceCents) === "$19.99",
  "Compass launch offer must remain $19.99.",
)
assert(
  formatCompassPrice(COMPASS_PRICING.standardPriceCents) === "$29.99",
  "Compass standard 30-day access must remain $29.99.",
)
assert(
  COMPASS_PRICING.accessDays === 30,
  "Compass access must remain a 30-day pass.",
)
assert(
  COMPASS_PRICING.autoRenews === false,
  "Compass access must not renew automatically.",
)

console.log("Compass pricing contract checks passed.")
