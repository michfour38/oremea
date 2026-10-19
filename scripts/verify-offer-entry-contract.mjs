// Contract checks for prominent anonymous offer entry points.
// This is source-level validation, not an authenticated browser purchase test.
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const read = path => readFileSync(path, "utf8");
const home = read("app/page.tsx");
const explore = read("components/site/sections/explore-ecosystem.tsx");
const nav = read("components/site/site-nav.tsx");
const footer = read("components/site/site-footer.tsx");
const middleware = read("middleware.ts");

const offers = [
  { name: "Recognition", home: "https://recognition.oremea.com", explore: "https://recognition.oremea.com", nav: "https://recognition.oremea.com", footer: "https://recognition.oremea.com" },
  { name: "Resonance", home: "/resonance/enter", explore: "/resonance/enter", nav: "https://resonance.oremea.com", footer: "/resonance/enter" },
  { name: "Compass", home: "/compass/access", explore: "https://compass.oremea.com", nav: "https://compass.oremea.com", footer: "https://compass.oremea.com" },
];

for (const offer of offers) {
  for (const [where, source, expected] of [
    ["home", home, offer.home],
    ["explore", explore, offer.explore],
    ["mobile navigation", nav, offer.nav],
    ["footer", footer, offer.footer],
  ]) {
    assert.ok(source.includes(expected), `${offer.name} ${where} entry changed or disappeared: ${expected}`);
  }
}
assert.match(home, /href=\\{product\\.href\\}/, "Homepage offer actions must use their product destination, not a dead decorative control.");
assert.match(explore, /href=\\{product\\.href\\}/, "Explore offer buttons must navigate to their declared product.");
assert.match(nav, /href=\\{product\\.href\\}/, "The mobile product navigation must link to each product host.");
assert.match(home, /onClick=\\{\\(event\\) => event\\.stopPropagation\\(\\)\\}/, "A homepage offer link must not accidentally toggle its parent card.");

// The three public product hosts have distinct root rewrite contracts.
assert.match(middleware, /host === RECOGNITION_HOST[\\s\\S]*?rewriteRecognitionPath\\(req, "\\/recognition\\/purchase"\\)/);
assert.match(middleware, /host === RESONANCE_HOST[\\s\\S]*?rewriteResonancePath\\(req, "\\/resonance\\/enter"\\)/);
assert.match(middleware, /host === COMPASS_HOST[\\s\\S]*?rewriteCompassPath\\(req, "\\/compass\\/access"\\)/);
assert.match(middleware, /isCompassProtectedPath\\(req\\)[\\s\\S]*?auth\\.protect\\(\\)/, "Compass protected routes must remain protected.");

const publicRoutes = middleware.split("const isPublicRoute = createRouteMatcher([")[1]?.split("]);")[0];
assert.ok(publicRoutes, "Public Clerk matcher missing");
for (const match of ["/about(.*)", "/party(.*)", "/cookies(.*)", "/paia(.*)"]) {
  assert.ok(publicRoutes.includes('"' + match + '"'), "Important public route is blocked: " + match);
}
for (const match of ["/admin(.*)", "/key(.*)", "/current(.*)", "/harmonize(.*)"]) {
  assert.ok(!publicRoutes.includes('"' + match + '"'), "Protected route was opened accidentally: " + match);
}

console.log("Core offer entry contracts passed (home, Explore, mobile nav, footer, and product-host rewrites).");
