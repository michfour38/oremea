import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const page = readFileSync("app/admin/partner-appearance/page.tsx", "utf8");
const preview = readFileSync("components/admin/partner-appearance-preview.tsx", "utf8");

assert.match(page, /await requireAdminPage\(\)/,
  "The partner preview must require the existing admin role.");
assert.match(page, /robots: \{ index: false, follow: false \}/);
assert.match(page, /PartnerAppearancePreview/);
assert.match(preview, /getResonanceSceneBackgrounds/);
assert.match(preview, /safePartnerBackgroundAsset/);
assert.match(preview, /"original", "Keep OREMEA artwork"/);
assert.match(preview, /"custom", "Use optional partner artwork"/);
assert.match(preview, /"plain", "Plain background"/);
assert.match(preview, /Preview only/);
assert.match(preview, /aria-pressed/);
assert.doesNotMatch(preview, /\bfetch\s*\(|prisma|localStorage|sessionStorage/,
  "Preview must not persist or publish partner settings.");
assert.doesNotMatch(page, /\bfetch\s*\(|oremea_partner_memberships\.update/,
  "Viewing appearance must never change entitlements.");

console.log("Private, read-only partner appearance preview contract passed.");
