import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const page = readFileSync("app/admin/partner-appearance/page.tsx", "utf8");
const preview = readFileSync("components/admin/partner-appearance-preview.tsx", "utf8");
const studio = readFileSync("app/partner/studio/[slug]/page.tsx", "utf8");

assert.match(page, /await requireAdminPage\(\)/,
  "The OREMEA admin appearance editor must retain its existing admin role.");
assert.match(page, /robots: \{ index: false, follow: false \}/);
assert.match(page, /PartnerAppearancePreview/);
assert.match(page, /Manage partner editor permissions/);
assert.match(studio, /getPartnerAppearanceEditor\(slug\)/,
  "Partner studio must check a granted editor for that precise slug.");
assert.match(studio, /notFound\(\)/);

assert.match(preview, /getResonanceSceneBackgrounds/);
assert.match(preview, /safePartnerBackgroundAsset/);
assert.match(preview, /Keep original OREMEA artwork/);
assert.match(preview, /Optional partner artwork/);
assert.match(preview, /Plain background/);
assert.match(preview, /Save changes/);
assert.match(preview, /type="file"/);
assert.match(preview, /method: "PUT"/);
assert.match(preview, /method: "POST"/);
assert.match(preview, /revision/);
assert.match(preview, /private draft only/);
assert.match(preview, /aria-pressed/);
assert.doesNotMatch(preview, /prisma|localStorage|sessionStorage|WHOP_API_KEY|NEXT_PUBLIC_WHOP/,
  "Partner editing must not ship secret providers or store private data in the browser.");
assert.doesNotMatch(page, /oremea_partner_memberships\.update|publishPartnerOffer/,
  "Appearance editing must never change entitlements or publish an offer.");

console.log("Permission-gated saveable partner preview contract passed.");
