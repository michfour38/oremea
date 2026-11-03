import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import ts from "typescript";
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
const matcherSection = middleware.slice(middleware.lastIndexOf("export const config = {"));
assert.ok(matcherSection.includes('"/(partner-assets|partner-media)/(.*)"'),
  "Clerk middleware must execute on image URLs even when they end in .png or .webp.");
assert.match(raw, /getPartnerAppearanceEditor\\(slug\\)/,
  "The private-image handler must verify the editor after Clerk middleware runs.");

assert.doesNotMatch(approvals, /getPartnerAppearanceEditor/,
  "Editor privileges must not be allowed to approve or publish appearance");

const browserConfig = readFileSync("e2e/partner-preview/playwright.config.ts", "utf8");
const browserSuite = readFileSync("e2e/partner-preview/specs/partner-appearance.spec.ts", "utf8");
const browserWorkflow = readFileSync(".github/workflows/partner-appearance-browser-e2e.yml", "utf8");
assert.match(browserConfig, /OREMEA_E2E_ISOLATED_PREVIEW/);
assert.match(browserConfig, /OREMEA_E2E_ALLOW_WRITES/);
assert.match(browserConfig, /pk_test_/);
assert.match(browserConfig, /sk_test_/);
assert.match(browserConfig, /oremea\\.com/);
assert.match(browserConfig, /trustedHosting/,
  "E2E session tokens may only reach explicitly supported preview providers.");
assert.match(browserSuite, /clerk\\.signIn/);
assert.match(browserSuite, /setInputFiles/);
assert.match(browserSuite, /Draft saved/);
assert.match(browserSuite, /Approve saved revision/);
assert.match(browserSuite, /Withdraw approval/);
assert.match(browserSuite, /Revoke/);
assert.match(browserWorkflow, /workflow_dispatch/);
assert.match(browserWorkflow, /ISOLATED_TEST_DATA_ONLY/);
assert.doesNotMatch(browserWorkflow, /\\bpull_request\\s*:/,
  "The mutation-capable browser suite must be manually triggered only.");

// Parse the manual browser suite in ordinary CI without launching browsers,
// contacting Clerk, consuming preview credentials, or changing a database.
for (const path of [
  "e2e/partner-preview/playwright.config.ts",
  "e2e/partner-preview/specs/global.setup.ts",
  "e2e/partner-preview/specs/partner-appearance.spec.ts",
]) {
  const compiled = ts.transpileModule(readFileSync(path, "utf8"), {
    fileName: path, reportDiagnostics: true,
    compilerOptions: {
      target: ts.ScriptTarget.ES2022,
      module: ts.ModuleKind.ESNext,
      jsx: ts.JsxEmit.ReactJSX,
    },
  });
  const errors = (compiled.diagnostics ?? [])
    .filter(diagnostic => diagnostic.category === ts.DiagnosticCategory.Error);
  assert.equal(errors.length, 0,
    `Invalid TypeScript in manual-only preview suite: ${path}`);
}

console.log("Clerk authorization boundary, tenant isolation, revoked access, private media and admin-only approval contracts passed.");
