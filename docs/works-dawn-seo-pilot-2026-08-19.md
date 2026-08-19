# WORKS DAWN SEO pilot — 19 August 2026

## Decision

Use DAWN as the authority, retrieval-readiness and measurement discipline for WORKS. Do not deploy DAWN inside the Oremea application and do not enable automatic optimization.

The 17 August DAWN authority spec described WORKS as unresolved and hidden. The current WORKS release branch is the newer authority: the customer job, South African market, provider model, provider plans, public domain and evidence boundaries are now implemented and owner-directed.

## Approved current facts used in this pass

- Canonical public origin: `https://works.oremea.com`
- Product class: production-route planning, provider discovery and matching service
- Buyer job: describe what needs to be made, understand the production route and identify suitable providers without hiding material unknowns
- Initial market: South Africa
- Customer entry: the brief and route can begin without an account
- Provider access: business management requires Clerk authentication and provider membership
- Provider plan prices: Free R0, Active R599/month, Growth R1,999/month
- Matching authority: current structured provider offerings; self-reported offerings remain possible rather than confirmed fits
- Paid participation does not buy verification, favourable reviews, ranking or guaranteed enquiries

## Implemented pilot

1. Central canonical identity and descriptions in `lib/works/seo.ts`.
2. Buyer-language title, description, visible evidence explanation and decision questions on the canonical market page.
3. Organization → WebSite → Service JSON-LD on the buyer page.
4. Visible provider-plan facts aligned with Service → OfferCatalog → Offer JSON-LD.
5. Public provider offerings exposed with their evidence status. Self-reported offerings remain visible but are excluded from `makesOffer` structured data until reviewed.
6. Clean canonical metadata for buyer, provider-plan, provider-onboarding, provider-profile and trust-policy pages.
7. Generated sitemap containing canonical public routes and qualifying public provider profiles.
8. Public-search and user-retrieval crawlers allowed on public pages; private workspaces and APIs disallowed.
9. GPTBot and ClaudeBot training access explicitly fail-closed pending a separate owner policy decision.
10. No `llms.txt`, scaled keyword pages, invented search-volume claims, comparison claims or automatic copy changes.

## Experiment record

Hypothesis: clearer buyer language, direct crawl routes, one canonical identity and evidence-aligned schema will improve qualified discovery without increasing misleading matches.

Baseline required after a preview or production deployment:

- canonical and indexability inspection for `/`, `/providers/plans` and at least one provider profile
- robots and sitemap fetch status
- Search Console indexed-page coverage and query/impression baseline
- Bing Webmaster and AI citation baseline when connected
- normalized ChatGPT referrals using `utm_source=chatgpt.com` and referrer evidence
- acquired → qualified → provider-contacted → aligned outcome counts

Guardrails:

- no fall in brief completion caused by added explanatory copy
- no self-reported offering presented as confirmed
- no private provider/customer workspace indexed
- no structured fact absent from the visible page

Rollback: revert this pilot as one change set if crawl errors, canonical drift, misleading schema or a material conversion regression is observed. Preserve the result and reason before testing a different hypothesis.

## Still unresolved

- Real buyer-language data from Search Console, on-site search, support questions and converted briefs
- Owner decision on model-training crawler access
- Search Console/Bing site verification and sitemap submission
- Production validation with the real database and production Clerk keys
- External DAWN repository and deployment authority; all DAWN automatic/external gates remain off
