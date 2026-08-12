import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const schema = readFileSync("prisma/schema/current.prisma", "utf8");
const service = readFileSync("src/lib/current/current-access.ts", "utf8");
const statusRoute = readFileSync("app/api/current/status/route.ts", "utf8");
const invitationRoute = readFileSync(
  "app/api/current/invitations/[id]/route.ts",
  "utf8",
);
const bell = readFileSync("components/site/current-bell.tsx", "utf8");
const siteNav = readFileSync("components/site/site-nav.tsx", "utf8");
const currentPage = readFileSync("app/current/page.tsx", "utf8");
const whopWebhook = readFileSync("app/api/webhooks/whop/route.ts", "utf8");
const pricing = readFileSync("src/lib/oremea/pricing.ts", "utf8");

assert.match(schema, /model current_launch_state/);
assert.match(schema, /launched_at\s+DateTime\?/);
assert.match(schema, /model current_qualifications/);
assert.match(schema, /user_id\s+String\s+@id/);
assert.match(
  schema,
  /@@unique\(\[user_id, source_product, source_instance_id\]\)/,
  "Current invitations must dedupe by member + product + participation instance.",
);
assert.match(service, /DEFAULT_CURRENT_LAUNCH_THRESHOLD = 50/);
assert.match(service, /CURRENT_LAUNCH_THRESHOLD/);
assert.match(service, /pg_advisory_xact_lock\(hashtext\('current-launch-gate'\)\)/);
assert.match(service, /qualifiedCount < getCurrentLaunchThreshold\(\)/);
assert.match(service, /launched_at: now/);
assert.match(service, /where: \{ invited_at: null \}/);
assert.match(service, /createInvitationInTransaction/);
assert.match(service, /The Current is still forming and checkout is locked/);
assert.match(service, /previousEventAt\.getTime\(\) > eventAt\.getTime\(\)/);
assert.match(
  service,
  /status: CURRENT_INVITATION_STATUS\.accepted[\s\S]*accepted_at: eventAt[\s\S]*resolved_at: eventAt/,
);

assert.match(statusRoute, /thread\.status !== "active"/);
assert.match(statusRoute, /Math\.floor\(thread\.message_count \/ 2\)/);
assert.match(statusRoute, /qualifyForCurrent/);
assert.doesNotMatch(
  statusRoute,
  /qualifiedCount|CURRENT_LAUNCH_THRESHOLD.*NextResponse/,
  "The public member status response must not expose the cohort count or threshold.",
);

assert.match(siteNav, /<CurrentBell signedIn=\{Boolean\(isSignedIn\)\} \/>/);
assert.match(
  bell,
  /invitations\.length === 0\) return null/,
  "No unresolved Current invitation means no header bell.",
);
assert.match(invitationRoute, /action === "accept"/);
assert.match(invitationRoute, /action === "decline"/);
assert.match(currentPage, /if \(!memberState\.member\) notFound\(\)/);

assert.match(whopWebhook, /WHOP_CURRENT_PRODUCT_ID/);
assert.match(whopWebhook, /product: "current"/);
assert.match(whopWebhook, /setCurrentMembershipAccess/);
assert.match(whopWebhook, /membership\.activated/);
assert.match(whopWebhook, /membership\.deactivated/);
assert.match(
  whopWebhook,
  /invitations\.length === 0/,
  "Current activation must require a live invitation.",
);

assert.match(
  pricing,
  /recognition:\s*\{[\s\S]*launchPriceCents: 1999,[\s\S]*standardPriceCents: 1999/,
  "Recognition must be $19.99/month in the central contract.",
);
assert.match(
  pricing,
  /current:\s*\{[\s\S]*standardPriceCents: 2999/,
  "The Current must remain $29.99/month.",
);

console.log("The Current launch + invitation contract checks passed.");
