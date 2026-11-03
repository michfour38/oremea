import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { resolvePartnerAppearanceAccess } from "../src/lib/oremea/partner-appearance-authorization";

const editor = {
  partner_slug: "angela",
  user_id: "user_demo_editor",
  revoked_at: null,
};
const base = { requestedPartner: "angela", authenticatedUserId: "user_demo_editor" };

assert.deepEqual(resolvePartnerAppearanceAccess({
  ...base, isAdmin: false, exactPartnerGrant: editor,
}), { userId: "user_demo_editor", role: "editor" });

assert.equal(resolvePartnerAppearanceAccess({
  ...base, authenticatedUserId: null, isAdmin: true, exactPartnerGrant: editor,
}), null, "No authenticated Clerk user: no admin or editor access");

assert.equal(resolvePartnerAppearanceAccess({
  ...base, isAdmin: false, exactPartnerGrant: null,
}), null, "An arbitrary signed-in user cannot edit a partner");

assert.equal(resolvePartnerAppearanceAccess({
  ...base, requestedPartner: "another-partner",
  isAdmin: false, exactPartnerGrant: editor,
}), null, "A legitimate partner editor cannot edit another partner");

assert.equal(resolvePartnerAppearanceAccess({
  ...base, authenticatedUserId: "user_other",
  isAdmin: false, exactPartnerGrant: editor,
}), null, "A grant cannot be used by another signed-in account");

assert.equal(resolvePartnerAppearanceAccess({
  ...base, isAdmin: false,
  exactPartnerGrant: { ...editor, revoked_at: new Date("2026-11-03T10:00:00Z") },
}), null, "Revocation must stop editing immediately");

assert.deepEqual(resolvePartnerAppearanceAccess({
  ...base, authenticatedUserId: "user_admin",
  isAdmin: true, exactPartnerGrant: null,
}), { userId: "user_admin", role: "admin" },
"An authenticated OREMEA admin does not require a partner grant");

assert.equal(resolvePartnerAppearanceAccess({
  ...base, requestedPartner: "../angela",
  isAdmin: true, exactPartnerGrant: null,
}), null, "Malformed slugs are not eligible for any access");

const middleware = readFileSync("middleware.ts", "utf8");
const server = readFileSync("src/lib/oremea/partner-appearance-server.ts", "utf8");
const studio = readFileSync("app/partner/studio/[slug]/page.tsx", "utf8");
const put = readFileSync("app/api/partner-appearance/[slug]/route.ts", "utf8");
const upload = readFileSync("app/api/partner-appearance/[slug]/assets/route.ts", "utf8");
const raw = readFileSync("app/partner-assets/[slug]/[filename]/route.ts", "utf8");
const publicMedia = readFileSync("app/partner-media/[slug]/[filename]/route.ts", "utf8");
const review = readFileSync("app/admin/partner-appearance/review/[slug]/page.tsx", "utf8");
const approvals = readFileSync("app/admin/partner-appearance/review/actions.ts", "utf8");

assert.match(server, /const \{ userId \} = await auth\(\)/,
  "Identity always comes from Clerk auth");
assert.match(server, /await isOremeaAdmin\(userId\)/);
assert.match(server, /where: \{ partner_slug_user_id: \{ partner_slug: slug, user_id: userId \} \}/);
assert.match(server, /resolvePartnerAppearanceAccess/);
assert.match(studio, /getPartnerAppearanceEditor\(slug\)/);
assert.match(put, /getPartnerAppearanceEditor\(slug\)/);
assert.match(upload, /getPartnerAppearanceEditor\(slug\)/);
assert.match(raw, /getPartnerAppearanceEditor\(slug\)/);
assert.match(review, /await requireAdminPage\(\)/);
assert.match(approvals, /await requireAdminAction\(\)/);
assert.match(publicMedia, /getReleasedPartnerAsset\(slug, filename\)/);
assert.match(middleware, /"\/partner-media\/\(\.\*\)"/,
  "Browser requests for approved images reach the strict release handler");
assert.doesNotMatch(middleware, /"\/partner-assets\/\(\.\*\)"/,
  "Private images are never middleware-public");
assert.doesNotMatch(approvals, /getPartnerAppearanceEditor/,
  "Editor privileges must not be allowed to approve or publish appearance");

console.log("Clerk authorization boundary, tenant isolation, revoked access, private media and admin-only approval contracts passed.");
