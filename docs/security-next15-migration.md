# Next 15 security migration

This branch exists only to migrate Oremea from unsupported Next.js 14 to the supported Next.js 15 Maintenance LTS line before production launch.

Target stack for the migration gate:

- Next.js 15.5.21
- React 19
- React DOM 19
- Clerk Next.js v6
- matching Next.js ESLint config and React type packages

The migration remains isolated from `main` until the full Oremea launch gate and production build pass.
