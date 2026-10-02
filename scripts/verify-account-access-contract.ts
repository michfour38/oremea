import assert from "node:assert/strict";
import { existsSync, readFileSync, readdirSync, statSync } from "node:fs";
import { extname, join } from "node:path";

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
const adminAccess = readFileSync("lib/auth/admin-access.ts", "utf8");
const recognitionAccess = readFileSync(
  "src/lib/recognition/recognition-conversation-access.ts",
  "utf8",
);
const compassAccess = readFileSync(
  "src/lib/compass/compass-access.ts",
  "utf8",
);
const compassAccessPage = readFileSync("app/compass/access/page.tsx", "utf8");
const currentAccess = readFileSync(
  "src/lib/current/current-access.ts",
  "utf8",
);
const resonanceKeyVisit = readFileSync(
  "src/lib/resonance/eternal-key-visit.ts",
  "utf8",
);
const resonanceEntry = readFileSync("app/(member)/entry/page.tsx", "utf8");
const resonanceActions = readFileSync(
  "app/(member)/resonance/visits/actions.ts",
  "utf8",
);
const resonanceCheckout = readFileSync(
  "app/(member)/resonance/visits/page.tsx",
  "utf8",
);
const harmonizeSystem = readFileSync(
  "app/api/harmonize/system/route.ts",
  "utf8",
);

function runtimeSourceFiles(root: string): string[] {
  const files: string[] = [];

  for (const name of readdirSync(root)) {
    const fullPath = join(root, name);
    const stat = statSync(fullPath);

    if (stat.isDirectory()) {
      files.push(...runtimeSourceFiles(fullPath));
      continue;
    }

    if ([".ts", ".tsx", ".js", ".jsx", ".mjs", ".cjs"].includes(extname(fullPath))) {
      files.push(fullPath.replaceAll("\\", "/"));
    }
  }

  return files;
}

const runtimeIsAdminReferences = ["app", "lib", "src"]
  .flatMap(runtimeSourceFiles)
  .filter((file) => readFileSync(file, "utf8").includes("is_admin"))
  .sort();

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
  /export async function hasEternalOremeaKey[\s\S]*status === "active"[\s\S]*!eternalKey\.revoked_at[\s\S]*!eternalKey\.expires_at/,
  "Golden Key access must come from one active, unrevoked, non-expiring entitlement check.",
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

for (const [name, source] of [
  ["Recognition", recognitionAccess],
  ["Compass", compassAccess],
  ["The Current", currentAccess],
] as const) {
  assert.match(
    source,
    /hasEternalOremeaKey/,
    `${name} must recognize the Golden Key as a product-access entitlement.`,
  );
}
assert.match(
  recognitionAccess,
  /source: "eternal_key"/,
  "Recognition must preserve Golden Key identity instead of treating it as owner access.",
);
assert.match(
  compassAccess,
  /source: "eternal_key"/,
  "Compass must preserve Golden Key identity instead of treating it as owner access.",
);
assert.match(
  compassAccessPage,
  /access\.source === "eternal_key"[\s\S]*Golden Key gives you lifetime Compass access/,
  "Compass must describe Golden Key access as lifetime access, never owner access.",
);
assert.match(
  currentAccess,
  /listPendingCurrentInvitations[\s\S]*getCurrentAccessState\(userId\)[\s\S]*return \[\]/,
  "The Current must not surface payment invitations after Golden Key access is active.",
);
assert.match(
  currentAccess,
  /startCurrentCheckout[\s\S]*getCurrentAccessState\(userId\)[\s\S]*return null/,
  "The Current must refuse stale checkout acceptance when lifetime access is already active.",
);

assert.match(
  resonanceKeyVisit,
  /purchase_source: "eternal_key"/,
  "Golden Key Resonance runs must preserve entitlement provenance.",
);
assert.match(
  resonanceKeyVisit,
  /purchase_reference: purchaseReference/,
  "Golden Key Resonance room entry must keep an idempotent request reference.",
);
assert.doesNotMatch(
  resonanceKeyVisit,
  /resonance_visit_orders|resonance_visit_redemptions|remaining_quantity|whopVisitConfig|createCheckout|chargeSavedPaymentMethod/i,
  "Golden Key Resonance access must not manufacture orders, redemptions, credits, or provider charges.",
);
assert.match(
  resonanceActions,
  /redeemEternalKeyVisit/,
  "Resonance room entry must use the dedicated Golden Key entitlement path.",
);
assert.match(
  resonanceEntry,
  /∞ All Access · Golden Key/,
  "The Resonance chooser must display lifetime all-access to Key holders.",
);
assert.match(
  resonanceEntry,
  /const canPurchase = !eternalKey/,
  "The Resonance chooser must not expose purchase CTAs to a Golden Key holder.",
);
assert.match(
  resonanceCheckout,
  /if \(await hasEternalOremeaKey\(userId\)\) redirect\(roomTarget\?\.entryPath \?\? "\/entry"\)/,
  "Direct Resonance checkout navigation must route Golden Key holders back to room selection.",
);
assert.match(
  harmonizeSystem,
  /if \(!eternalKey && ownedSpaceCount >= INCLUDED_OWNED_SPACE_LIMIT\)/,
  "Golden Key holders must bypass Harmonize's paid owned-space limit.",
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

assert.deepEqual(
  runtimeIsAdminReferences,
  ["lib/auth/admin-access.ts"],
  "Runtime admin authority must stay centralized; no route or feature may read or write is_admin directly.",
);
assert.match(
  adminAccess,
  /prisma\.profiles\.findUnique\([\s\S]*select:\s*\{\s*is_admin:\s*true\s*\}/,
  "The canonical admin helper must read only the is_admin flag it needs.",
);
assert.doesNotMatch(
  adminAccess,
  /prisma\.profiles\.(create|update|upsert|updateMany|createMany|delete|deleteMany)/,
  "Admin status must never be mutated by the runtime admin helper.",
);
assert.doesNotMatch(
  adminAccess,
  /publicMetadata|privateMetadata|unsafeMetadata/,
  "Admin authority must not silently move into user or Clerk metadata.",
);

assert.doesNotMatch(
  autoFlagger,
  /suspendAccount|account-access|banUser/,
  "Content auto-flags must not directly suspend accounts; security escalation stays separate.",
);

console.log("Account access and eternal key contract checks passed.");
