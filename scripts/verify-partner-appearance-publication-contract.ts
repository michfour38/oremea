import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import sharp from "sharp";

import {
  createApprovedAppearance,
  partnerAppearanceReleaseEnabled,
  referencedReleasedFilenames,
  validateApprovedAppearance,
  validReleasedMediaFilename,
} from "../src/lib/oremea/partner-appearance-release-contract";
import {
  initialAppearanceDraft,
  parsePartnerAppearanceDraft,
} from "../src/lib/oremea/partner-appearance-contract";
import { sanitizeApprovedPartnerImage } from "../src/lib/oremea/partner-appearance-image";

const original = initialAppearanceDraft("angela");
const approvedOriginal = createApprovedAppearance("angela", original);
assert.deepEqual(approvedOriginal, original);
assert.deepEqual(referencedReleasedFilenames(approvedOriginal), []);
assert.equal(partnerAppearanceReleaseEnabled(), false,
  "Partner visual publication must default to disabled.");
assert.equal(validReleasedMediaFilename("img-12345678-1234-1234-1234-123456789abc.webp"), true);
assert.equal(validReleasedMediaFilename("../img-12345678-1234-1234-1234-123456789abc.webp"), false);
assert.equal(validReleasedMediaFilename("image.svg"), false);
assert.equal(validateApprovedAppearance(approvedOriginal, "angela")?.resonanceScenes.mode, "original");

const privatePath = "/partner-assets/angela/img-12345678-1234-1234-1234-123456789abc.jpg";
const draft = parsePartnerAppearanceDraft({
  ...original,
  resonanceScenes: {
    ...original.resonanceScenes,
    mode: "custom",
    rooms: { 1: { desktop: privatePath, mobile: null } },
  },
}, "angela");
const approved = createApprovedAppearance("angela", draft);
assert.equal(approved.resonanceScenes.rooms[1]?.desktop,
  "/partner-media/angela/img-12345678-1234-1234-1234-123456789abc.webp");
assert.equal(draft.resonanceScenes.rooms[1]?.desktop, privatePath,
  "A public approval must not rewrite the saved private draft.");
assert.deepEqual(referencedReleasedFilenames(approved),
  ["img-12345678-1234-1234-1234-123456789abc.webp"]);
assert.equal(validateApprovedAppearance(approved, "angela")?.resonanceScenes.mode, "custom");
assert.equal(validateApprovedAppearance(approved, "other"), null);
assert.equal(validateApprovedAppearance({
  ...approved,
  resonanceScenes: {
    ...approved.resonanceScenes,
    rooms: { 1: { desktop: privatePath, mobile: null } },
  },
}, "angela"), null, "Approved snapshots must never expose raw private uploads.");
assert.equal(validateApprovedAppearance({
  ...approved,
  resonanceScenes: {
    ...approved.resonanceScenes,
    rooms: { 11: { desktop: null, mobile: null } },
  },
}, "angela"), null);

const source = await sharp({
  create: { width: 16, height: 16, channels: 3, background: "#bd9c45" },
})
  .jpeg()
  .withMetadata()
  .toBuffer();
const clean = await sanitizeApprovedPartnerImage(new Uint8Array(source));
const meta = await sharp(clean).metadata();
assert.equal(meta.format, "webp");
assert.equal(meta.exif, undefined);
assert.equal(meta.xmp, undefined);
assert.equal(meta.icc, undefined);
assert.ok(clean.byteLength < 2_000_000);
await assert.rejects(sanitizeApprovedPartnerImage(new Uint8Array([1, 2, 3])));

const server = readFileSync("src/lib/oremea/partner-appearance-release-server.ts", "utf8");
const sanitizer = readFileSync("src/lib/oremea/partner-appearance-image.ts", "utf8");
const publicRoute = readFileSync("app/partner-media/[slug]/[filename]/route.ts", "utf8");
const review = readFileSync("app/admin/partner-appearance/review/[slug]/page.tsx", "utf8");
const actions = readFileSync("app/admin/partner-appearance/review/actions.ts", "utf8");
const brandContext = readFileSync("src/lib/oremea/partner-brand-context.ts", "utf8");
const landing = readFileSync("app/partner/[slug]/page.tsx", "utf8");
const schema = readFileSync("prisma/schema/partner-appearance-publication.prisma", "utf8");
const migration = readFileSync("prisma/migrations/20261103160000_partner_appearance_publication/migration.sql", "utf8");

assert.match(sanitizer, /limitInputPixels: 20_000_000/);
assert.match(sanitizer, /\.rotate\(\)/);
assert.match(sanitizer, /\.webp\(/);
assert.doesNotMatch(sanitizer, /\\.(?:withMetadata|keepMetadata)\\s*\\(/);
assert.match(server, /partnerAppearanceReleaseEnabled\(\)/);
assert.match(server, /getPublishedPartnerExperience\(partner.slug\)/);
assert.match(server, /getPublishedPartnerExperience\(slug\)/);
assert.match(server, /pg_advisory_xact_lock/);
assert.match(server, /expectedDraftRevision/);
assert.match(server, /expectedApprovalVersion/);
assert.match(server, /sanitizeApprovedPartnerImage/);
assert.match(server, /approval_history\.create/);
assert.match(server, /is_active: false/);
assert.match(publicRoute, /getReleasedPartnerAsset\(slug, filename\)/);
assert.match(publicRoute, /no-store/);
assert.match(review, /await requireAdminPage\(\)/);
assert.match(review, /Approve saved revision/);
assert.match(review, /Withdraw approval/);
assert.match(actions, /await requireAdminAction\(\)/);
assert.match(brandContext, /await getReleasedPartnerBrand\(experience\)/);
assert.match(landing, /await getReleasedPartnerBrand\(partner\)/);
assert.match(schema, /model oremea_partner_appearance_publications/);
assert.match(schema, /model oremea_partner_appearance_public_assets/);
assert.match(migration, /CREATE TABLE "oremea_partner_appearance_publications"/);
assert.doesNotMatch(migration, /DROP TABLE|ALTER TABLE "oremea_entitlements"|DELETE FROM/i);
assert.doesNotMatch(server + actions, /activateCreatorSilverProduct|grantCompassAccess|setRecognitionMembershipAccess|WHOP_API_KEY|SUSTAIN_DAWN/);

console.log("Appearance approval, private-to-public media conversion, metadata removal and withdrawal contracts passed.");
