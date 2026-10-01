import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";

const service = readFileSync("lib/auth/account-access.ts", "utf8");
const schema = readFileSync("prisma/schema/account-security.prisma", "utf8");
const migration = readFileSync(
  "prisma/migrations/20261001111500_account_security/migration.sql",
  "utf8",
);
const memberNav = readFileSync("app/(member)/member-nav.tsx", "utf8");
const keyBadge = readFileSync(
  "components/site/eternal-key-nav-badge.tsx",
  "utf8",
);
const keyPage = readFileSync("app/key/page.tsx", "utf8");
const adminActions = readFileSync(
  "app/admin/account-access/actions.ts",
  "utf8",
);
const adminLayout = readFileSync("app/admin/layout.tsx", "utf8");
const autoFlagger = readFileSync("lib/moderation/auto-flag.ts", "utf8");

assert.match(
  schema,
  /model account_security \{[\s\S]*status\s+String[\s\S]*suspended_at\s+DateTime\?/,
  "Account suspension must remain an explicit account-security state.",
);
assert.match(
  schema,
  /model account_security_events \{[\s\S]*event_type\s+String[\s\S]*source\s+String/,
  "Security state changes must keep an append-only event trail.",
);
assert.match(
  migration,
  /CREATE TABLE "account_security"[\s\S]*CREATE TABLE "account_security_events"/,
  "Production migration must create both current security state and audit events.",
);

assert.match(
  service,
  /ETERNAL_OREMEA_KEY = "oremea:eternal-key"/,
  "The eternal key must use one canonical entitlement key.",
);
assert.match(
  service,
  /users\.banUser\(input\.userId\)/,
  "Suspension must use Clerk's global account ban so active sessions are revoked.",
);
assert.match(
  service,
  /users\.unbanUser\(userId\)/,
  "Restoration must use Clerk's global account unban.",
);
assert.match(
  service,
  /grantEternalOremeaKey[\s\S]*expires_at: null[\s\S]*revoked_at: null/,
  "The eternal key grant must be non-expiring and active.",
);

const suspendBody = service.match(
  /export async function suspendAccount[\s\S]*?export async function restoreAccount/,
)?.[0] ?? "";
assert.doesNotMatch(
  suspendBody,
  /oremea_entitlements\.(delete|deleteMany|update|updateMany)|revoked_at|expires_at/,
  "Suspending an account must never mutate or revoke product entitlements.",
);

assert.match(
  memberNav,
  /<EternalKeyNavBadge \/>/,
  "Member navigation must render the eternal-key badge hook.",
);
assert.match(
  keyBadge,
  /https:\/\/www\.oremea\.com\/key/,
  "The literal key badge must link to the holder's Oremea Key page.",
);
assert.match(
  keyBadge,
  /<svg[\s\S]*<circle[\s\S]*<path/,
  "The member nav badge must render a literal key symbol, not only text.",
);
assert.match(
  keyPage,
  /if \(!access\.hasEternalKey\)[\s\S]*redirect\("\/profile"\)/,
  "The Oremea Key page must only open for an eternal-key holder.",
);

assert.match(
  adminActions,
  /if \(target\.userId === actorId\)/,
  "Admin self-suspension must remain blocked.",
);
assert.match(
  adminLayout,
  /import \{ requireAdminPage \} from "@\/lib\/auth\/require-admin";/,
  "Admin layout must use the canonical admin authorization helper.",
);
assert.match(
  adminLayout,
  /export default async function AdminLayout/,
  "Admin layout must remain async so it can fail closed before rendering.",
);
assert.match(
  adminLayout,
  /await requireAdminPage\(\);/,
  "Admin layout must enforce admin authorization for every child route.",
);
assert.equal(
  existsSync("lib/require-admin.ts"),
  false,
  "The obsolete duplicate admin helper must not return.",
);
assert.doesNotMatch(
  autoFlagger,
  /suspendAccount|account-access|banUser/,
  "Content auto-flags must not directly suspend accounts; security escalation stays separate.",
);

console.log("Account access and eternal key contract checks passed.");
