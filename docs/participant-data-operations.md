# Participant data operations

## Release boundary

Code hardening does not establish production database isolation or recoverability.
Do not apply old staging patches, restore over a source database, restart a
database, delete a source/volume, change billing, or remove a proxy as part of
this procedure. Do not put participant rows, connection URLs, passwords, exports
or encryption keys in issues, PRs, logs or CI artifacts.

## Runtime database separation

1. Inventory each deployed service's actual tables, shared profile/entitlement
   dependencies, raw SQL, sequences and required functions. WORKS has an existing
   production public-proxy dependency; retain it until a separate cutover is verified.
2. Run `scripts/security/database-permissions-audit.sql` using each intended runtime
   identity. It selects metadata only. Review PUBLIC/inherited grants, schema CREATE
   and executable SECURITY DEFINER functions; a restricted role alone cannot undo
   privileges inherited from PUBLIC. Never revoke shared privileges blindly.
3. Build an explicit per-service manifest. Render reviewed SQL offline with
   `node scripts/security/render-runtime-grants.mjs APPROVED-MANIFEST.json`.
   The example in `--help` is illustrative, not a complete production allowlist.
   The renderer creates a new NOLOGIN group with CRUD on named tables only.
   It neither changes the source owner nor provisions/prints credentials.
4. Rehearse on synthetic PostgreSQL: required operations succeed; unrelated
   narrative tables, DDL, TRUNCATE, role creation and cross-service tables fail.
   Test migration execution with a separate migration identity, not the runtime role.
5. Provision distinct LOGIN identities and secrets through the platform's secure
   secret controls. Preserve separate owner/migration credentials. Configure one
   service's runtime URL at a time, verify TLS, synthetic product paths and metadata,
   then expand. Keep rollback references private. Do not assume DIRECT_URL is safe
   for the runtime or expose it to unrelated services.
6. Design participant RLS separately, with trusted transaction-scoped identity on
   every Prisma operation and pooled-connection tests. Enabling RLS without that
   propagation breaks access; a superuser or BYPASSRLS runtime defeats it.

## Encrypted backup and isolated restore

Before any database cutover, establish a current production recovery point.
The earlier staging restore is not evidence of production recovery.

Preferred options: native scheduled backups with verified retention/access, or
a separately scheduled logical backup encrypted before persistent storage.
Do not upgrade plans without an agreed cost. For the logical route:

- Supply the database URL from an existing secure environment, never command-line
  arguments or chat. Use verified TLS and a dedicated backup identity.
- Stream `pg_dump --format=custom --no-owner --no-privileges` directly into a vetted
  encryption tool such as age using the owner's verified public recipient key.
  Persist only ciphertext in private access-controlled object storage; keep its
  decryption identity separately. Do not save plaintext dumps in general files or CI.
- Record UTC start/completion, exit status for BOTH pipeline stages, ciphertext
  checksum, PostgreSQL version, database scope and retention/expiry. A file existing
  is not backup success. Alert on failure or missed scheduled completion.
- Test by decrypting directly into `pg_restore --exit-on-error --no-owner
  --no-privileges` against a newly created, empty isolated database with unrelated
  credentials, no production routes, no application workers and no outbound mail or
  provider calls. Never use `--clean`, an original volume, or a source URL as target.
- Verify schema/constraint/index counts, aggregate row counts and representative
  synthetic flows. Preserve only metadata as restore evidence. Delete a disposable
  restore only after verifying its exact isolated identity; never delete the source.
- Choose/document actual backup retention and perform periodic restore exercises.
  Restores must reapply participant deletion records before becoming available.

Remaining prerequisites: approved destination/recipient, secure key custody,
backup schedule/retention, verified tool versions and an isolated restore target.
This document does not claim those resources have been configured.

## Narrative encryption

Transport TLS and disk encryption are separate from field encryption. Verify the
platform's current volume/snapshot encryption and operator access assurances.
Do not promise end-to-end encryption while the server reads content for AI work.

For field encryption, inventory raw messages, prompts/answers, reflections, memory
quotes, derived JSON snapshots, notifications, exports and backups. Use a vetted
authenticated encryption/envelope system, separate key management and per-record
associated data binding participant/table/record/field identity. Store algorithm
and key versions; never keep the master key in the database or repository.

Rehearse mixed-version reads, resumable backfill, rollback, key rotation, lost-key
recovery and restore. Do not encrypt a few message columns and claim all personal
information is encrypted. Do not backfill/delete existing text until key custody,
coverage, cost and recoverability have been approved and verified.

## Privacy lifecycle and processors

Recognition's memory controls remove derived excerpt copies across that account's
threads; original conversations remain until explicitly deleted. An in-progress
AI request may already contain material sent before deletion. Removing long-term
memory does not remove recent conversation context, provider copies or backups.
Deleting one conversation does not promise account-wide erasure.

Operate a verified privacy-request process covering identity verification, private
narrative, derived copies, exports, operator logs, processors and backups. Preserve
necessary transaction/shared records through purpose-specific minimization or
anonymization; do not use the guarded test-account reset as the paid-account
erasure workflow. Do not silently purge participants' archives.

Verify actual AI account retention/training terms, model coverage and any
zero-retention agreement. Verify operator/admin MFA, membership/access lists,
offboarding, log retention and backup/key access. Keep these findings private.
Record explicit retention periods after operational/legal review, then implement
and test them; do not advertise periods the infrastructure cannot enforce.

## Browser and response protection

Composer recovery is account/thread-bound in sessionStorage, expires after 30
minutes of inactivity, and is cleared on account changes and sign-out on that
origin. Legacy unowned local drafts are discarded on entry. This improves
shared-browser isolation; it does not make a shared browser or same-origin script
trusted. Previously used devices must load updated code to clear old local data.

The enforced CSP constrains framing, base URLs and plugin objects. Strict script
and connection restrictions remain a separate nonce/host-policy rollout: inventory
Clerk, bot checks, checkout and assets, validate a report-only policy without
collecting sensitive URLs/body snippets, then enforce after signed-in and checkout
tests. Do not enable report-sample or log participant URLs in CSP telemetry.
