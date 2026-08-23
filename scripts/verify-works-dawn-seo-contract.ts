import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

function read(path: string) {
  return readFileSync(path, "utf8");
}

const packageJson = JSON.parse(read("package.json")) as {
  devDependencies?: Record<string, string>;
};
const seo = read("lib/works/seo.ts");
const layout = read("app/works/layout.tsx");
const market = read("app/works/[market]/page.tsx");
const plans = read("app/works/providers/plans/page.tsx");
const profile = read("app/works/providers/[slug]/page.tsx");
const robots = read("app/works/robots.txt/route.ts");
const sitemap = read("app/works/sitemap.ts");
const middleware = read("middleware.ts");

assert.equal(packageJson.devDependencies?.prisma, "^5.22.0", "Prisma CLI must be declared for clean installs and postinstall.");
assert.match(seo, /WORKS_ORIGIN = "https:\/\/works\.oremea\.com"/);
assert.match(layout, /metadataBase: new URL\(WORKS_ORIGIN\)/);
assert.match(layout, /"max-image-preview": "large"/);

assert.match(market, /"@type": "WebSite"/);
assert.match(market, /"@type": "Service"/);
assert.match(market, /Before you describe it/);
assert.match(market, /possible fits—not guarantees/);
assert.match(market, /Confirm those directly before appointing a provider/);

assert.match(plans, /"@type": "OfferCatalog"/);
assert.match(plans, /WORKS_PROVIDER_PLANS\.map/);
assert.match(profile, /Provider supplied · review pending/);
assert.match(profile, /evidence_status !== "SELF_REPORTED"/);
assert.match(profile, /structuredData\.makesOffer/);

assert.match(robots, /OAI-SearchBot/);
assert.match(robots, /"User-agent: GPTBot"/);
assert.match(robots, /"User-agent: ClaudeBot"/);
assert.match(robots, /WORKS_PRIVATE_PATHS/);
assert.doesNotMatch(seo, /"\/provider",/, "The private /provider rule must not prefix-block public /providers pages.");
assert.match(sitemap, /works_providers\.findMany/);
assert.match(sitemap, /offerings: \{ some: \{ active: true \} \}/);
assert.match(middleware, /"\/robots\.txt"/);
assert.match(middleware, /"\/sitemap\.xml"/);

console.log("✓ WORKS DAWN SEO authority and discovery contract");
