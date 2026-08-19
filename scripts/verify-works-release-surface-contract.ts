import { readFileSync } from "node:fs";

function read(path: string) {
  return readFileSync(path, "utf8");
}

function requireText(source: string, needle: string, message: string) {
  if (!source.includes(needle)) throw new Error(message);
}

function rejectText(source: string, needle: string, message: string) {
  if (source.includes(needle)) throw new Error(message);
}

const marketPage = read("app/works/[market]/page.tsx");
const plansPage = read("app/works/providers/plans/page.tsx");
const joinPage = read("app/works/providers/join/page.tsx");
const providerPage = read("app/works/providers/[slug]/page.tsx");
const brand = read("components/works/works-brand.tsx");
const memberNav = read("components/works/member-works-nav.tsx");
const customerFlow = read("components/works/intake/founder-conversation-v2.tsx");
const footer = read("components/works/works-legal-footer.tsx");
const worksLayout = read("app/works/layout.tsx");
const providerNav = read("components/works/provider/provider-nav.tsx");
const providerDashboard = read("components/works/provider/provider-dashboard.tsx");
const publicPlans = read("lib/works/providers/public-plans.ts");
const worksSeo = read("lib/works/seo.ts");
const middleware = read("middleware.ts");

requireText(worksSeo, 'WORKS_ORIGIN = "https://works.oremea.com"', "WORKS must have one canonical production origin.");
requireText(marketPage, 'market.slug === "za" ? worksUrl("/")', "The South African WORKS intake must canonicalize to the clean production root.");
requireText(plansPage, 'worksUrl("/providers/plans")', "Provider plans must use the clean production canonical URL.");
requireText(joinPage, 'worksUrl("/providers/join")', "Provider onboarding must use the clean production canonical URL.");
requireText(providerPage, 'worksUrl(`/providers/${provider.slug}`)', "Public provider profiles must use clean production canonical URLs.");

for (const [source, name] of [[marketPage, "market"], [plansPage, "plans"], [joinPage, "join"], [providerPage, "provider"]] as const) {
  rejectText(source, 'https://works.oremea.com/works/', `The ${name} page exposes the hidden internal /works path in a canonical URL.`);
}

requireText(brand, 'href = "/works"', "WORKS brand navigation must have an explicit default destination.");
requireText(brand, "<Link href={href}", "WORKS brand navigation must honour the requested workspace destination.");
requireText(brand, 'from "next/image"', "The above-the-fold WORKS logo must use Next.js image optimization.");
requireText(memberNav, "<WorksBrand href={href}", "Member WORKS navigation must pass its destination through to the brand link.");

requireText(marketPage, "embedded", "The public WORKS page must embed the customer flow without a duplicate header.");
requireText(customerFlow, "embedded?: boolean", "The customer flow must explicitly support embedded rendering.");
requireText(customerFlow, 'href="/works/my"', "Signed-in customers need a working path to My WORKS.");
rejectText(customerFlow, '<main className="py-10', "The embedded customer flow must not create a nested main landmark.");

requireText(footer, 'https://www.oremea.com', "WORKS must use an absolute destination when returning to Oremea.");
requireText(footer, "OREMEA_LEGAL_LINKS", "Oremea legal links must leave the WORKS subdomain.");
requireText(footer, "{currentYear}", "The client footer must render the server-provided year without a hydration race.");
requireText(worksLayout, "currentYear={new Date().getFullYear()}", "The WORKS server layout must provide a stable footer year.");
requireText(providerNav, 'href: "/works/provider/billing"', "Provider billing must be part of the canonical provider navigation.");
requireText(providerPage, 'provider.slug === "works-qa-supplier"', "The QA-only provider profile must not be indexed.");
requireText(providerDashboard, "They do not add or verify capability", "Provider demand preferences must not be presented as matching capability.");
requireText(publicPlans, "Eligible for matching after capability setup", "Provider plans must not promise matching before capability setup exists.");
requireText(middleware, 'WORKS_AUTH_PATHS = ["/sign-in", "/sign-up"]', "WORKS must expose Clerk's shared sign-in and sign-up pages on its clean host.");
requireText(middleware, "pathname.startsWith(`${authPath}/`)", "WORKS must preserve Clerk catch-all auth paths instead of rewriting them beneath /works.");

console.log("✓ WORKS release surface contract");
