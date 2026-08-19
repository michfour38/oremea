# WORKS production deployment

WORKS is deployed as an independent Railway service from the same repository.

## Production branch

- Branch: `works-production`
- Production domain: `https://works.oremea.com`
- Do not point the WORKS Railway service at `main`.
- Start release work from `works-production`, merge the reviewed release branch back into it, then reconcile completed WORKS commits into `main` separately. Do not merge `main` wholesale into WORKS production.

## Railway service

Create a service named `WORKS` from `michfour38/oremea` and set its source branch to `works-production`.

Use the normal application commands:

- Build: `npm run build`
- Start: `npm start`

The service can use the same PostgreSQL database as the Oremea application. WORKS tables are namespaced with `works_` models.

## Required environment variables

Copy the values required by WORKS from the existing Oremea environment rather than creating a second database or authentication project.

At minimum:

- `DATABASE_URL`
- `DIRECT_URL`
- `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY`
- `CLERK_SECRET_KEY`
- `NEXT_PUBLIC_CLERK_SIGN_IN_FALLBACK_REDIRECT_URL=/`
- `NEXT_PUBLIC_CLERK_SIGN_UP_FALLBACK_REDIRECT_URL=/`
- `RESEND_API_KEY`
- `WORKS_OUTREACH_FROM`
- `WORKS_HOST=works.oremea.com`
- `WORKS_PUBLIC_URL=https://works.oremea.com`
- `NEXT_PUBLIC_APP_URL=https://works.oremea.com`

Keep secrets in Railway variables only. Never commit their real values.

The production service must use Clerk production keys (`pk_live_…` and
`sk_live_…`). Development keys are not suitable for `works.oremea.com` and
produce a production warning in the browser.

Configure `npm run db:migrate:deploy` as the Railway pre-deploy command so a
new application version never starts against an older WORKS schema.

## Domain

Attach `works.oremea.com` to the WORKS Railway service. Railway will provide the DNS target that must be added where `oremea.com` DNS is managed.

The middleware exposes clean WORKS paths on the subdomain while preserving the existing internal `/works/...` route structure.

Examples:

- `https://works.oremea.com/` → WORKS South Africa intake
- `https://works.oremea.com/respond/<token>` → secure provider response
- `https://works.oremea.com/providers/join` → provider onboarding

## Release rule

WORKS changes are developed and validated away from `main`. The dedicated WORKS service follows `works-production`, so Recognition, Compass and Resonance releases do not redeploy WORKS.

Once the dedicated service and domain are confirmed live, the legacy `/works` entry on the main Oremea deployment can be changed in a separate main-app release to redirect to `https://works.oremea.com`.

## Provider evidence boundary

Signed-in providers can create structured offerings from the capability
workspace. A complete, active offering enters customer matching immediately as
a possible fit. Provider-supplied information is stored as `SELF_REPORTED` and
cannot produce a confirmed fit until WORKS reviews the relevant source or
evidence. Editing a reviewed offering returns it to `SELF_REPORTED` so stale
confirmation is never carried over to changed capability information.

## Release verification

Before promoting a WORKS release:

1. Run `npm run typecheck`, `npm run lint`, `npm run test:works-payfast`, `npm run test:works-release`, `npm run test:works-capabilities` and `npm run test:works-seo`.
2. Confirm the production migration command completed before the application started.
3. Verify `/`, `/robots.txt`, `/sitemap.xml`, `/my`, `/providers/plans`, `/providers/join`, `/provider`, `/provider/capabilities`, `/provider/billing` and one real public provider profile on the clean subdomain paths.
4. Confirm no React hydration errors or Clerk development-key warnings appear in the browser console.
5. Keep `PAYFAST_SANDBOX=true` until a full notify/return/cancel test passes, then switch the production credentials and sandbox flag together.
6. Confirm the canonical URL and visible facts match the JSON-LD on the buyer page, provider plans and the sampled provider profile.
