# OREMEA isolated partner appearance browser rehearsal

This is a **manual, destructive-on-test-data-only** integration suite. It is separate from OREMEA's production dependency graph and existing main CI checks.

## What it exercises

1. Clerk **test-tenant** sign-in as an authorised OREMEA admin and a partner editor
2. Admin grants editing to the exact editor's Clerk user ID
3. Editor opens Angela's studio, uploads an actual small PNG and reads the private media URL
4. Anonymous access to that private image is rejected
5. Editor saves a revision; an older revision update is rejected with HTTP 409
6. Editor cannot enter the admin approval screen
7. Admin approves a specific revision, tests public media remains unavailable while releases are off, then withdraws approval
8. Admin revokes editor access; the previously valid editor session immediately loses API/private-image access

The suite does **not** create checkout plans or enable customer appearance releases. Tests currently require `OREMEA_PARTNER_APPEARANCE_RELEASE_ENABLED=false` and unpublished partner offers. It is not a replacement for a later release-enabled/public-media positive test.

## Required isolation

Use a **new and disposable** environment, not OREMEA production or the existing Railway staging environment (which holds unrelated pending changes). It needs:

- Branch `feature/configurable-partner-experiences-20261102` deployed to its own preview hostname containing `preview`, `pr-293`, or `partner-e2e` (or localhost)
- **Disposable PostgreSQL**, migrated for OREMEA and the additive partner appearance schema
- A separate Clerk **development** instance linked to this preview, not production keys. Create an admin test account and an editor test account there. Configure the test admin identity using the preview-only `OREMEA_OWNER_CLERK_USER_SHA256` fingerprint or an isolated admin profile; never edit real users.
- `OREMEA_PARTNER_ACCESS_ENABLED=false` and `OREMEA_PARTNER_APPEARANCE_RELEASE_ENABLED=false`, no Whop credentials or live billing routes
- GitHub Action **repository secrets**: `OREMEA_PARTNER_PREVIEW_URL`, `OREMEA_E2E_CLERK_PUBLISHABLE_KEY`, `OREMEA_E2E_CLERK_SECRET_KEY`, `OREMEA_E2E_ADMIN_EMAIL`, `OREMEA_E2E_EDITOR_EMAIL`, `OREMEA_E2E_EDITOR_USER_ID`

These secrets must never be put in the repository or conversation. `CLERK_SECRET_KEY` must start with `sk_test_` and the publishable key with `pk_test_`. A matching preview hostname alone does **not** prove the underlying database is isolated: verify the deployed database before running.

## Run

From an isolated machine, with test-only environment variables:

```sh
cd e2e/partner-preview
npm install
npx playwright install chromium
npx playwright test --project=chromium
```

The GitHub workflow `partner-appearance-browser-e2e.yml` is intentionally **manual-only**. Enter `ISOLATED_TEST_DATA_ONLY` to acknowledge that it will upload and mutate test appearance records. It does not run automatically on PRs. Workflow dispatch may only become visible after the workflow is on the default branch; it can also be invoked against an approved test ref using GitHub CLI when supported.

**Do not run this against a shared staging or live environment.** The suite checks the URL, Clerk test key prefixes and two explicit isolation acknowledgements before starting, but an operator must independently verify the preview's database connection and absence of customer data.

### Current execution status

Configured in PR #293 only; it is **not yet a completed browser sign-in test**. No disposable preview deployment or isolated Clerk test credentials were connected when this suite was added. The existing non-production database and policy checks remain the verified baseline.
