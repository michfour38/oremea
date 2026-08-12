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
const recognitionConversation = readFileSync(
  "app/api/recognition/conversation/route.ts",
  "utf8",
);

assert.match(
  schema,
  /@@unique\(\[user_id, source_product, source_instance_id\]\)/,
  "Current invitations must dedupe by member + product + participation instance.",
);
assert.match(
  schema,
  /status\s+String\s+@default\("pending"\)/,
  "Current invitations must begin pending.",
);
assert.match(
  service,
  /checkout_started_at/,
  "Starting Current checkout must be tracked separately from acceptance.",
);
assert.match(
  service,
  /Starting checkout deliberately does not resolve the invitation/,
  "Abandoned Current checkout must leave the invitation pending.",
);
assert.match(
  service,
  /declined_at: now[\s\S]*resolved_at: now/,
  "Declining must explicitly resolve only that invitation.",
);
assert.match(
  service,
  /status: CURRENT_INVITATION_STATUS\.accepted[\s\S]*accepted_at: eventAt[\s\S]*resolved_at: eventAt/,
  "Verified Current membership activation must resolve pending invitations as accepted.",
);
assert.match(
  statusRoute,
  /getOremeaMemberState/,
  "The Current status endpoint must verify a real Oremea purchase record.",
);
assert.match(
  currentPage,
  /if \(!memberState\.member\) notFound\(\)/,
  "Signed-in leads must not receive The Current member page.",
);
assert.match(
  siteNav,
  /<CurrentBell signedIn=\{Boolean\(isSignedIn\)\} \/>/,
  "The www header must carry the member notification bell.",
);
assert.match(
  bell,
  /if \(!signedIn \|\| !status\?\.member\) return null/,
  "The bell must stay invisible to leads and public visitors.",
);
assert.match(
  bell,
  /status\.pendingInvitations/,
  "The bell indicator must be driven by unresolved invitations.",
);
assert.match(
  invitationRoute,
  /action === "accept"/,
  "Current invitations must support an explicit accept action.",
);
assert.match(
  invitationRoute,
  /action === "decline"/,
  "Current invitations must support an explicit decline action.",
);
assert.doesNotMatch(
  recognitionConversation,
  /createCurrentInvitation/,
  "Recognition's participation trigger must remain unwired until The Current Whop product is configured.",
);

console.log("The Current invitation contract checks passed.");
