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
const myWorks = read("components/works/account/my-works-dashboard.tsx");
const accountButton = read("components/works/works-account-button.tsx");
const providerOnboarding = read("components/works/provider/provider-onboarding-v2.tsx");
const providerCreateApi = read("app/api/works/providers/new/route.ts");
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
requireText(marketPage, "Before you describe it", "Material matching limits must appear before the customer starts the brief.");
rejectText(marketPage, "What WORKS does—and does not claim", "Material pre-start information must not be stranded below the customer flow.");
if (marketPage.indexOf("Before you describe it") > marketPage.indexOf("<FounderConversationV2")) {
  throw new Error("Material matching limits must appear before the customer flow.");
}
requireText(customerFlow, "embedded?: boolean", "The customer flow must explicitly support embedded rendering.");
requireText(customerFlow, 'embedded ? "pb-6" : "min-h-screen', "The embedded customer flow must not force an empty viewport beneath the form.");
requireText(customerFlow, 'href="/works/my"', "Signed-in customers need a working path to My WORKS.");
rejectText(customerFlow, '<main className="py-10', "The embedded customer flow must not create a nested main landmark.");

requireText(myWorks, 'bg-[#f3eee4]', "My WORKS must provide its own readable full-page surface.");
requireText(myWorks, "Begin with the product you need made.", "The empty My WORKS state must give the customer a clear next action.");
requireText(providerOnboarding, "SignUpButton", "Provider onboarding must offer provider account creation explicitly.");
requireText(providerOnboarding, "forceRedirectUrl={returnUrl}", "Provider authentication must return to provider onboarding.");
requireText(providerOnboarding, "response.status === 409", "An existing business match must enter the connection flow instead of becoming a dead-end error.");
requireText(providerOnboarding, "claimPanelRef.current?.scrollIntoView", "An existing business match must keep the manufacturer at the connection action.");
requireText(providerCreateApi, "alreadyConnected", "The duplicate-business response must distinguish the current manager from a new claimant.");
requireText(accountButton, "user.hasImage", "The WORKS account control must use a supplied profile image when available.");
requireText(accountButton, "user.setProfileImage", "The WORKS account control must let people save an adjusted profile image.");
requireText(accountButton, 'label="Zoom"', "The WORKS photo editor must expose a zoom control.");

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
