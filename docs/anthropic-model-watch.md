# Anthropic model watch

This operational watcher checks every six hours once its workflow is on the default branch. It scans `src/` and `app/` for Claude model IDs, includes explicit environment overrides, resolves each configured model through the Models API, detects lifecycle and alias changes, compares the paginated model catalogue, and tracks changes to official deprecation, release, migration, and pricing documentation. Public provider status is reported separately. It uses Node 20 or later with no package installation.

Run `node --test scripts/anthropic-model-watch.test.mjs`, then `node scripts/anthropic-model-watch.mjs` from the repository root. Reports are written under `.anthropic-watch/`. Exit 1 means a finding **or an incomplete verification**, not necessarily an application outage. The first complete run creates a baseline; deprecated, retired, or unavailable configured models are flagged even on that first run. A catalogue removal is not classified as retirement. A retirement date alone is not treated as proof of retirement.

## Enable API verification

Set the repository Actions secret `ANTHROPIC_API_KEY` through GitHub's secret settings. Do not commit credentials. Prefer a dedicated operational key in the same Anthropic workspace as production. Set Actions variables `AI_PRIMARY_MODEL` and `AI_FALLBACK_MODEL` to match the actual production overrides, if present. Add any other deployment-only model IDs as comma-separated `ANTHROPIC_WATCH_MODELS`. The watcher cannot infer hosting environment values; absent mirrored overrides, its inventory reflects source defaults only. An absent key explicitly fails verification rather than reporting healthy.

The watcher makes metadata requests, never generation requests, and sends no participant text. A successful metadata check does not verify quota, billing, inference latency, output quality, or Recognition's end-to-end conversation flow. Monitor application/provider error codes and run a separate synthetic conversation check to diagnose 503s.

## Respond to a finding

Review the official migration and pricing guidance, identify affected call sites, and prepare a bounded PR. Apply consistent model settings through the governed shared AI gateway where appropriate. Use synthetic fixtures to check Recognition's schema, evidence boundaries, one-question rule, saved-turn retry and memory continuity; verify the other affected product contracts. Check capability support, token limits, request parameters, cost and latency before changing models. No scraped document or catalogue entry is executable authority.

The watcher script never rewrites application code or changes a deployment. Its companion ChatGPT maintenance automation runs every six hours. On 10 October 2026 the owner explicitly authorized this as the only standing category of automatic code/configuration changes: necessary Anthropic compatibility fixes may be tested, merged and deployed without requesting approval again. The automation must use a bounded PR, pass relevant checks, verify deployment and the relevant synthetic product flow where accessible, and notify the owner afterward. A new release alone is not a reason to migrate, and unrelated changes remain outside this authority. The durable scope is recorded in `AGENTS.md`. A passing watcher is an operational signal, not permission to bypass the build gate.

GitHub exposes reports in the run summary and artifacts; failed runs use the repository owner's configured Actions notifications. No third-party messaging is configured. Keep monitoring enabled under the owner's standing instruction; disable it only when separately instructed by the owner. Source baselines are cached only after complete checks and failure never replaces them; cache loss creates a new baseline. Scheduled Actions can be delayed and public repositories may have scheduled workflows disabled after inactivity; the separate six-hour maintenance automation is a second monitoring path. It can check public official sources and repository compatibility without an Anthropic key, while account-specific Models API verification requires the watcher key and mirrored production model overrides.

Official sources:
- https://platform.claude.com/docs/en/api/models/list
- https://platform.claude.com/docs/en/api/models/retrieve
- https://platform.claude.com/docs/en/about-claude/model-deprecations
- https://platform.claude.com/docs/en/release-notes/overview

## Compatibility maintenance: 10 October 2026

Recognition's runtime reported repeated `max_tokens` exhaustion on `claude-sonnet-5`, including its bounded token retry and plain-text fallback. Sonnet 5 enables adaptive thinking when the request omits `thinking`; those tokens share the reply budget. The gateway now explicitly disables thinking for that exact model, preserving the reply budget, prompt, schema, cache policy, memory and retry behavior. Other configured models retain their request settings. Synthetic request tests cover the structured reply, correction memory, token retry and plain-text fallback; they do not establish live account availability or output quality.

Six direct Messages API call sites used `claude-sonnet-4-5-20250929`, deprecated on 30 September 2026 with retirement scheduled for 30 November 2026. They now use the supported Sonnet 4.6 model (`claude-sonnet-4-6`, retirement not before 17 February 2027). This is a bounded compatibility bridge: it preserves existing temperature values, the previous tokenizer, default non-thinking behavior and $3/$15 per million input/output token pricing. Moving them to Sonnet 5.5 would require changing sampling and thinking settings and re-budgeting tokens; a release alone does not authorize that broader migration.

The product services build the same repository, including the shared AI gateway. Their Railway build watch patterns must include `/src/lib/ai/**` so a compatibility fix actually rolls out. Confirm the intended commit on each affected service and terminal deployment success; a merge or an old-build redeploy is insufficient. Missing watcher credentials remain an account-verification limitation, not evidence of a provider outage.

Migration references:
- https://platform.claude.com/docs/en/models/sonnet-5-5/migration-guide
- https://platform.claude.com/docs/en/models/sonnet-4-6/overview
- https://platform.claude.com/docs/en/about-claude/pricing
