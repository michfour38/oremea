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
const customerResume = read("components/works/intake/founder-conversation-resume.tsx");
const resumeApi = read("app/api/works/search-sessions/resume/route.ts");
const myWorks = read("components/works/account/my-works-dashboard.tsx");
const accountButton = read("components/works/works-account-button.tsx");
const providerOnboarding = read("components/works/provider/provider-onboarding-v2.tsx");
const providerCreateApi = read("app/api/works/providers/new/route.ts");
const providerClaimsApi = read("app/api/works/provider-claims/route.ts");
const providerClaimVerifyApi = read("app/api/works/provider-claims/verify/route.ts");
const providerClaimVerification = read("components/works/provider/provider-claim-verification.tsx");
const providerAccessSchema = read("prisma/works/provider-access.prisma");
const claimProfileMigration = read("prisma/migrations/20260820080000_add_works_claim_profile_draft/migration.sql");
const claimEmailMigration = read("prisma/migrations/20260820093000_add_works_claim_email_verification/migration.sql");
const footer = read("components/works/works-legal-footer.tsx");
const worksLayout = read("app/works/layout.tsx");
const providerNav = read("components/works/provider/provider-nav.tsx");
const providerDashboard = read("components/works/provider/provider-dashboard.tsx");
const providerCapabilities = read("components/works/provider/provider-capabilities.tsx");
const providerCapabilitiesApi = read("app/api/works/provider/offerings/route.ts");
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
requireText(marketPage, "<FounderConversationResumeBoundary", "The customer flow must pass through saved-progress recovery before rendering.");
const customerFlowMount = marketPage.indexOf("<FounderConversationResumeBoundary");
if (customerFlowMount < 0 || marketPage.indexOf("Before you describe it") > customerFlowMount) {
  throw new Error("Material matching limits must appear before the customer flow.");
}
requireText(customerResume, "for (let attempt = 0; attempt < 3; attempt += 1)", "Saved WORKS progress must retry transient restore failures before showing an error.");
requireText(customerResume, "Your saved WORKS progress has not been cleared.", "A temporary restore failure must tell the customer their progress was preserved.");
requireText(customerResume, "Resume saved brief →", "A recovered browser-owned search must offer an explicit resume action.");
requireText(customerResume, "Start a new product", "A recovered search must never force resumption when the customer deliberately wants a fresh brief.");
requireText(resumeApi, "worksBrowserSessionCookieName", "Saved-progress recovery must use the secure WORKS browser cookie rather than trusting a client-supplied session owner.");
requireText(resumeApi, "browser_session_id: browserSessionId", "Saved-progress recovery must only search sessions owned by the current browser.");
requireText(resumeApi, 'orderBy: { updated_at: "desc" }', "Saved-progress recovery must choose the browser's latest WORKS search.");
requireText(customerFlow, "embedded?: boolean", "The customer flow must explicitly support embedded rendering.");
requireText(customerFlow, 'embedded ? "pb-6" : "min-h-screen', "The embedded customer flow must not force an empty viewport beneath the form.");
requireText(customerFlow, 'href="/works/my"', "Signed-in customers need a working path to My WORKS.");
rejectText(customerFlow, '<main className="py-10', "The embedded customer flow must not create a nested main landmark.");

requireText(myWorks, 'bg-[#f3eee4]', "My WORKS must provide its own readable full-page surface.");
requireText(myWorks, "Begin with the product you need made.", "The empty My WORKS state must give the customer a clear next action.");
requireText(providerOnboarding, "SignUpButton", "Provider onboarding must offer provider account creation explicitly.");
requireText(providerOnboarding, "forceRedirectUrl={returnUrl}", "Provider authentication must return to provider onboarding.");
requireText(providerOnboarding, "response.status === 409 || response.status === 202", "Existing and newly staged businesses must enter the verified connection flow.");
requireText(providerOnboarding, "claimPanelRef.current?.scrollIntoView", "An existing business match must keep the manufacturer at the connection action.");
requireText(providerOnboarding, "profileDraft: form", "Manufacturer-supplied profile information must travel with an existing-listing claim.");
requireText(providerOnboarding, "setBusinessEmail(form.email.trim())", "The manufacturer must not need to retype the business email after an existing listing is found.");
requireText(providerOnboarding, '"Send verification email →"', "An unclaimed listing must require business-inbox verification before access.");
requireText(providerOnboarding, "Public claim emails cannot add another owner", "An already-managed listing must not expose a public owner-escalation path.");
requireText(providerCreateApi, "alreadyConnected", "The duplicate-business response must distinguish the current manager from a new claimant.");
requireText(providerCreateApi, "Its WORKS profile has been updated with the information you supplied", "An existing manager's submitted information must update the existing profile.");
requireText(providerCreateApi, 'profile_status: "CLAIM_INVITED"', "A brand-new business record must remain unclaimed until its inbox is verified.");
requireText(providerCreateApi, "verificationRequired: true", "A brand-new business must continue into business-email verification.");
requireText(providerCreateApi, "{ status: 202 }", "A staged business record must not be returned as a completed connection.");
rejectText(providerCreateApi, "memberships: { create", "Creating a business record must not grant provider membership before email verification.");
requireText(providerClaimsApi, "randomBytes(32)", "A provider claim verification email must use a cryptographically random token.");
requireText(providerClaimsApi, "verification_token_hash: verificationTokenHash", "A provider claim must store only the verification token hash.");
requireText(providerClaimsApi, "WorksProviderClaimStatus.PENDING", "Submitting a provider claim must remain pending until the business inbox is verified.");
requireText(providerClaimsApi, "/providers/verify-claim#token=", "The raw verification token must stay in the URL fragment instead of server logs.");
requireText(providerClaimsApi, "resend.emails.send", "WORKS must email the business inbox before granting provider access.");
rejectText(providerClaimsApi, "works_provider_memberships.upsert", "The claim-request endpoint must not grant provider membership before email confirmation.");
requireText(providerClaimsApi, "profile_draft: profileDraft", "Pending claims must retain the manufacturer's proposed profile instead of discarding it.");
requireText(providerClaimVerifyApi, "verification_expires_at: { gt: now }", "Provider claim verification tokens must be time-limited.");
requireText(providerClaimVerifyApi, "verification_token_hash: null", "A used provider claim verification token must be invalidated.");
requireText(providerClaimVerifyApi, "claim.clerk_user_id !== userId", "The email link must remain bound to the requesting WORKS account.");
requireText(providerClaimVerifyApi, "works_provider_memberships.upsert", "Only the verification endpoint may grant provider membership.");
requireText(providerClaimVerification, "Verify business email and connect", "Email opening alone must not grant access; the signed-in claimant must confirm explicitly.");
requireText(providerAccessSchema, "profile_draft  Json?", "Provider claims must persist proposed manufacturer profile changes.");
requireText(providerAccessSchema, "verification_token_hash", "Provider claims must persist a hashed email-verification token.");
requireText(claimProfileMigration, 'ADD COLUMN "profile_draft" JSONB', "Production must add storage for proposed manufacturer profile changes.");
requireText(claimEmailMigration, 'ADD COLUMN "verification_token_hash" TEXT', "Production must add provider claim email-verification state.");
requireText(worksSeo, '"/providers/verify-claim"', "Provider claim verification pages must be excluded from search indexing.");
requireText(accountButton, "user.hasImage", "The WORKS account control must use a supplied profile image when available.");
requireText(accountButton, "user.setProfileImage", "The WORKS account control must let people save an adjusted profile image.");
requireText(accountButton, 'label="Zoom"', "The WORKS photo editor must expose a zoom control.");

requireText(footer, 'https://www.oremea.com', "WORKS must use an absolute destination when returning to Oremea.");
requireText(footer, "OREMEA_LEGAL_LINKS", "Oremea legal links must leave the WORKS subdomain.");
requireText(footer, "min-[420px]:grid-cols-2", "The WORKS footer must use two compact legal columns on narrow screens that can accommodate them.");
rejectText(footer, "introductions with clear evidence boundaries.", "The WORKS footer description must not end with a decorative full stop.");
requireText(footer, "{currentYear}", "The client footer must render the server-provided year without a hydration race.");
requireText(worksLayout, "currentYear={new Date().getFullYear()}", "The WORKS server layout must provide a stable footer year.");
requireText(providerNav, 'href: "/works/provider/billing"', "Provider billing must be part of the canonical provider navigation.");
requireText(providerNav, "flex flex-wrap justify-center gap-2", "Provider workspace navigation must remain visually centred across its pages.");
requireText(providerDashboard, "mx-auto mt-10 max-w-4xl", "Provider profile content must stay centred beneath the workspace navigation.");
requireText(providerDashboard, "Business description", "Provider profile fields must have visible labels instead of relying on placeholder text.");
requireText(providerPage, 'provider.slug === "works-qa-supplier"', "The QA-only provider profile must not be indexed.");
requireText(providerDashboard, "They do not add or verify capability", "Provider demand preferences must not be presented as matching capability.");
rejectText(providerDashboard, "Open capabilities & matching →", "The profile form must not jump into capability setup before the current profile can be saved.");
requireText(providerDashboard, "edit.wantsMoreWork || edit.marketingOptIn", "Detailed work preferences must stay hidden until a provider explicitly asks for work or marketing.");
requireText(providerDashboard, "informational profile", "The work-preference section must explain when it should remain off.");
requireText(providerDashboard, 'router.push("/works/provider/capabilities")', "A successful provider profile save must advance to capabilities and matching.");
requireText(providerCapabilitiesApi, "commercial_profile: { select: { plan: true } }", "Capability setup must know whether the provider has already chosen a paid plan.");
requireText(providerCapabilities, 'selectedProvider.plan === "FREE"', "Only providers still on Free should be directed to a plan choice at the end of onboarding.");
requireText(providerCapabilities, "Continue to plan choice →", "Completed capability setup must offer pricing as the final onboarding choice.");
requireText(providerCapabilities, "Review public profile", "Providers must be able to review their completed profile before choosing pricing.");
requireText(publicPlans, "Eligible for matching after capability setup", "Provider plans must not promise matching before capability setup exists.");
requireText(middleware, 'WORKS_AUTH_PATHS = ["/sign-in", "/sign-up"]', "WORKS must expose Clerk's shared sign-in and sign-up pages on its clean host.");
requireText(middleware, "pathname.startsWith(`${authPath}/`)", "WORKS must preserve Clerk catch-all auth paths instead of rewriting them beneath /works.");

console.log("✓ WORKS release surface contract");
