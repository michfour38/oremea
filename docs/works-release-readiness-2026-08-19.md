# WORKS release readiness — 2026-08-19

## Recommended path

`works-production` is the canonical deployment branch for WORKS. It has WORKS-only
provider-claim and QA-supplier changes that are absent from `main`; `main` has
unrelated Oremea/Recognition changes. Continue the release from
`works/release-readiness-2026-08-19`, merge it into `works-production`, and avoid
a wholesale merge from `main`.

After the WORKS release is stable, reconcile the completed WORKS commits into
`main` from a clean integration branch so shared schema and middleware changes do
not drift indefinitely.

## What is already substantial

- Anonymous founder intake, saved searches and production briefs.
- Production-path construction, evidence-aware provider matching and route gaps.
- Researched South African provider offering data.
- Provider outreach, secure response links and customer sourcing requests.
- Provider profiles, claims, workspace, inbox, reviews and demand insights.
- PayFast plan and subscription handling with a dedicated contract check.
- Dedicated WORKS domain routing and legal surfaces.

## Release blockers

1. The live deployment is loading Clerk development keys. Replace them with the
   production Clerk keys and use WORKS-safe fallback redirects.
2. The live homepage logs a React hydration mismatch. The release branch removes
   the nested main landmark and makes the footer year a server-provided value;
   verify the console again on the preview deployment before promotion.
3. No local production database credentials are available in this workspace, so
   migration and real brief/provider data flows still need a connected preview or
   production smoke test.

## Provider capability boundary

Buyer matching remains viable against the researched provider offering records.
Self-service providers can now create structured `works_offerings` from their
workspace, including categories, services, processes, packaging formats, quantity
ranges and lead times. Active provider-entered offerings participate as possible
fits. They cannot produce a confirmed fit while their evidence status is
`SELF_REPORTED`; a WORKS source or evidence review is still required.

## Changes in this pass

- Clean production canonical URLs on the WORKS subdomain.
- Correct Oremea/footer destinations from the WORKS host.
- A single public founder header and a working My WORKS destination.
- Correct provider navigation, including billing.
- Next.js image optimization for the WORKS logo.
- WORKS error and not-found boundaries.
- Honest provider onboarding/plan copy around capability setup.
- Authenticated provider offering setup wired into the matching graph.
- A self-reported evidence state that prevents provider-entered data from being presented as confirmed.
- `noindex` metadata for the dedicated QA supplier profile.
- Removal of three superseded, unreferenced V1 components.
- A focused WORKS release-surface contract in the launch checks.
- Prisma CLI declared at the same version as Prisma Client, with the stale package-lock project name corrected.
- DAWN-guided canonical metadata, visible evidence copy, sitemap, search/retrieval crawler controls and evidence-aligned structured data.
- Public provider offerings shown with their evidence status; self-reported offerings are excluded from public `makesOffer` schema until reviewed.
- A focused DAWN SEO contract in the launch checks.
