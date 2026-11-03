import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

import {
  MAX_PARTNER_IMAGE_BYTES,
  draftAssetPath,
  initialAppearanceDraft,
  isKnownPartner,
  parsePartnerAppearanceDraft,
  referencedPartnerImageFiles,
  sniffPartnerImage,
} from "../src/lib/oremea/partner-appearance-contract";

assert.equal(isKnownPartner("angela"), true);
assert.equal(isKnownPartner("unknown"), false);
assert.equal(isKnownPartner("../angela"), false);
const original = initialAppearanceDraft("angela");
const parsed = parsePartnerAppearanceDraft(original, "angela");
assert.deepEqual(parsed, original, "An untouched partner configuration must be valid.");
assert.equal(original.resonanceScenes.mode, "original");
assert.deepEqual(referencedPartnerImageFiles(parsed), []);
assert.throws(() => parsePartnerAppearanceDraft({ ...original, accent: "red" }, "angela"));
assert.throws(() => parsePartnerAppearanceDraft({
  ...original,
  resonanceScenes: { ...original.resonanceScenes, mode: "root" },
}, "angela"));
assert.throws(() => parsePartnerAppearanceDraft({
  ...original,
  resonanceScenes: { ...original.resonanceScenes, rooms: { 11: { desktop: null, mobile: null } } },
}, "angela"));

const filename = "img-12345678-1234-1234-1234-123456789abc.webp";
const ownPath = `/partner-assets/angela/${filename}`;
assert.equal(draftAssetPath(ownPath, "angela"), ownPath);
assert.throws(() => draftAssetPath(ownPath, "another-partner"));
assert.throws(() => draftAssetPath("https://example.com/image.webp", "angela"));
assert.throws(() => draftAssetPath("/partner-assets/angela/../../other.webp", "angela"));
assert.throws(() => draftAssetPath("/partner-assets/angela/a.svg", "angela"));

const edited = parsePartnerAppearanceDraft({
  ...original,
  resonanceScenes: {
    ...original.resonanceScenes,
    mode: "custom",
    rooms: { 1: { desktop: ownPath, mobile: ownPath } },
  },
  extra: { whopPlanId: "not-a-real-plan", membership: "active" },
}, "angela");
assert.equal(edited.resonanceScenes.mode, "custom");
assert.deepEqual(referencedPartnerImageFiles(edited), [filename]);
assert.equal("extra" in edited, false, "Price, access and arbitrary keys are ignored.");

const png = new Uint8Array([0x89,0x50,0x4e,0x47,0x0d,0x0a,0x1a,0x0a,1,2,3,4]);
const jpg = new Uint8Array([0xff,0xd8,0xff,0xe0,0,0,0,0,0,0,0,0]);
const webp = Uint8Array.from("RIFF0000WEBP".split("").map(char => char.charCodeAt(0)));
assert.equal(sniffPartnerImage(png, "image/png")?.ext, "png");
assert.equal(sniffPartnerImage(jpg, "image/jpeg")?.ext, "jpg");
assert.equal(sniffPartnerImage(webp, "image/webp")?.ext, "webp");
assert.equal(sniffPartnerImage(png, "image/jpeg"), null);
assert.equal(sniffPartnerImage(webp, "image/svg+xml"), null);
assert.equal(sniffPartnerImage(new Uint8Array(MAX_PARTNER_IMAGE_BYTES + 1), "image/png"), null);

const schema = readFileSync("prisma/schema/partner-appearance.prisma", "utf8");
const migration = readFileSync("prisma/migrations/20261103120000_partner_appearance_drafts/migration.sql", "utf8");
const server = readFileSync("src/lib/oremea/partner-appearance-server.ts", "utf8");
const put = readFileSync("app/api/partner-appearance/[slug]/route.ts", "utf8");
const upload = readFileSync("app/api/partner-appearance/[slug]/assets/route.ts", "utf8");
const imageRoute = readFileSync("app/partner-assets/[slug]/[filename]/route.ts", "utf8");
const editorActions = readFileSync("app/admin/partner-appearance/editors/actions.ts", "utf8");

assert.match(schema, /model oremea_partner_appearances/);
assert.match(schema, /model oremea_partner_appearance_assets/);
assert.match(schema, /model oremea_partner_appearance_editors/);
assert.match(migration, /CREATE TABLE "oremea_partner_appearance_assets"/);
assert.doesNotMatch(migration, /ALTER TABLE "oremea_entitlements"|DROP TABLE|DELETE FROM/i);
assert.match(server, /isOremeaAdmin\(userId\)/);
assert.match(server, /revoked_at === null/);
assert.match(server, /revision: expectedRevision/);
assert.match(server, /AppearanceConflictError/);
assert.match(server, /referencedPartnerImageFiles/);
assert.match(put, /getPartnerAppearanceEditor\(slug\)/);
assert.match(put, /request\.headers\.get\("origin"\) !== request\.nextUrl\.origin/);
assert.match(put, /savePartnerAppearanceDraft/);
assert.match(upload, /getPartnerAppearanceEditor\(slug\)/);
assert.match(upload, /request\.headers\.get\("origin"\) !== request\.nextUrl\.origin/);
assert.match(upload, /MAX_PARTNER_IMAGE_BYTES/);
assert.match(upload, /sniffPartnerImage/);
assert.match(upload, /file_bytes: Buffer\.from\(bytes\)/);
assert.match(imageRoute, /getPartnerAppearanceEditor\(slug\)/);
assert.match(imageRoute, /"Cache-Control": "private, no-store, max-age=0"/);
assert.match(imageRoute, /"X-Content-Type-Options": "nosniff"/);
assert.match(editorActions, /requireAdminAction\(\)/);
assert.match(editorActions, /client\.users\.getUser\(userId\)/);
assert.match(editorActions, /revoked_at: new Date\(\)/);
assert.doesNotMatch(server + put + upload + editorActions, /activateCreatorSilverProduct|grantCompassAccess|setRecognitionMembershipAccess|WHOP_API_KEY|SUSTAIN_DAWN/);

console.log("Partner draft validation, secure image upload, grants and database contracts passed.");
