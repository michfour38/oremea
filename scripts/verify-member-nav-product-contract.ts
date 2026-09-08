import assert from "node:assert/strict"
import { readFileSync } from "node:fs"
import { resolveMemberNavProduct } from "../src/lib/oremea/member-nav-product"

const hostCases = [
  ["recognition.oremea.com", "/begin", "recognition"],
  ["resonance.oremea.com", "/", "resonance"],
  ["compass.oremea.com", "/map", "compass"],
] as const

for (const [hostname, pathname, expected] of hostCases) {
  assert.equal(
    resolveMemberNavProduct({ hostname, pathname }),
    expected,
    `${hostname}${pathname} must highlight ${expected}.`,
  )
}

const pathCases = [
  ["/recognition/archive", "recognition"],
  ["/resonance/room/arrival", "resonance"],
  ["/compass/map", "compass"],
] as const

for (const [pathname, expected] of pathCases) {
  assert.equal(
    resolveMemberNavProduct({ pathname }),
    expected,
    `${pathname} must highlight ${expected} outside the live product hostname.`,
  )
}

assert.equal(
  resolveMemberNavProduct({
    hostname: "www.oremea.com:443",
    pathname: "/profile",
  }),
  null,
  "Non-product pages must not imply that the participant is inside a product.",
)
assert.equal(
  resolveMemberNavProduct({ pathname: "/recognitional" }),
  null,
  "Product matching must respect path-segment boundaries.",
)

const memberNav = readFileSync("app/(member)/member-nav.tsx", "utf8")

assert.match(
  memberNav,
  /aria-current=\{active \? "page" : undefined\}/,
  "The active product must be exposed to assistive technology.",
)
assert.match(
  memberNav,
  /border-\[#C8A96A\]\/45[\s\S]*bg-\[#C8A96A\]\/10/,
  "The active product must receive a visible gold treatment.",
)

console.log("Member navigation product contract checks passed.")
