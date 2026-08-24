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
const categoryLanding = read("app/works/manufacturers/[category]/page.tsx");
const searchesSchema = read("prisma/works/searches.prisma");
const searchSessions = read("app/api/works/search-sessions/route.ts");
const conversation = read("components/works/intake/founder-conversation-v2.tsx");
const procurement = read("app/api/works/procurement-requests/route.ts");
const outreach = read("components/works/outreach/provider-outreach-panel.tsx");
const attributionMigration = read("prisma/migrations/20260824074500_add_works_acquisition_attribution/migration.sql");
const env = read(".env.example");

assert.equal(packageJson.devDependencies?.prisma, "^5.22.0", "Prisma CLI must be declared for clean installs and postinstall.");
assert.match(seo, /WORKS_ORIGIN = "https:\/\/works\.oremea\.com"/);
assert.match(layout, /metadataBase: new URL\(WORKS_ORIGIN\)/);
assert.match(layout, /"max-image-preview": "large"/);

assert.match(market, /"@type": "WebSite"/);
assert.match(market, /"@type": "Service"/);
assert.match(market, /Before you describe it/);
assert.match(market, /possible fits—not guarantees/);
assert.match(market, /Confirm those directly before appointing a provider/);
assert.match(market, /Browse by category/);
assert.match(market, /href={`\/manufacturers\/\$\{category\.slug\}`}/);
assert.match(market, /Describe what you need once/);

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

assert.match(seo, /product, component, formula, packaging or production service/);
assert.match(categoryLanding, /manufacturers in South Africa/);
assert.match(categoryLanding, /"@type": "CollectionPage"/);
assert.match(categoryLanding, /initialCategoryKey={category.key}/);
assert.match(categoryLanding, /possible fit, not a guarantee/);
assert.match(categoryLanding, /href={worksUrl\(`\/providers\/\$\{item\.provider\.slug\}`\)}/);
assert.match(sitemap, /works_market_categories\.findMany/);
assert.match(sitemap, /`\/manufacturers\/\$\{category\.category\.slug\}`/);

for (const field of [
  "landing_path",
  "referrer_host",
  "utm_source",
  "utm_medium",
  "utm_campaign",
  "utm_term",
  "utm_content",
]) {
  assert.match(searchesSchema, new RegExp(field));
  assert.match(attributionMigration, new RegExp(field));
}
assert.match(searchesSchema, /capture_point/);
assert.match(searchSessions, /landing_path: landingPath/);
assert.match(searchSessions, /utm_campaign: utmCampaign/);
assert.match(conversation, /function acquisitionAttribution/);
assert.match(conversation, /attribution: acquisitionAttribution\(\)/);
assert.match(conversation, /capturePoint: "route-sourcing-fallback"/);
assert.match(outreach, /capturePoint: "provider-outreach"/);
assert.match(procurement, /capture_point: capturePoint/);
assert.match(procurement, /notifyOremeaOfSourcingLead/);
assert.match(procurement, /WORKS_LEAD_NOTIFY_TO/);
assert.match(env, /WORKS_LEAD_NOTIFY_TO=support@oremea\.com/);

console.log("✓ WORKS DAWN visibility, attraction, attribution and lead-capture contract");
