# WORKS production deployment

WORKS is deployed as an independent Railway service from the same repository.

## Production branch

- Branch: `works-production`
- Production domain: `https://works.oremea.com`
- Do not point the WORKS Railway service at `main`.

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
- `RESEND_API_KEY`
- `WORKS_OUTREACH_FROM`
- `WORKS_HOST=works.oremea.com`
- `WORKS_PUBLIC_URL=https://works.oremea.com`
- `NEXT_PUBLIC_APP_URL=https://works.oremea.com`

Keep secrets in Railway variables only. Never commit their real values.

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
