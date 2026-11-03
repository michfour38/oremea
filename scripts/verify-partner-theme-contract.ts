import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

import {
  partnerThemeStyle,
  safePartnerBackgroundAsset,
} from "../src/lib/oremea/partner-theme";
import { OREMEA_PARTNER_EXPERIENCES } from "../src/lib/oremea/partner-experiences";

const angela = OREMEA_PARTNER_EXPERIENCES.angela;
const style = partnerThemeStyle(angela.brand) as Record<string, string>;
assert.equal(style["--partner-bg"], angela.brand.background);
assert.equal(style["--partner-foreground"], angela.brand.foreground);
assert.equal(style["--partner-accent"], angela.brand.accent);
assert.equal(style["--partner-bg-image"], "none");
assert.equal(safePartnerBackgroundAsset(null), null);
assert.equal(safePartnerBackgroundAsset("/partner-assets/angela/forest.webp"), "/partner-assets/angela/forest.webp");
assert.equal(safePartnerBackgroundAsset("https://example.com/forest.webp"), null);
assert.equal(safePartnerBackgroundAsset("/partner-assets/angela/test.png?x=1"), null);
assert.equal(safePartnerBackgroundAsset("/partner-assets/../evil.webp"), null);
assert.equal(safePartnerBackgroundAsset("/partner-assets/angela/test.png\");red"), null);
assert.equal(
  (partnerThemeStyle({ ...angela.brand, backgroundAssetPath: "/partner-assets/angela/forest.webp" }) as Record<string,string>)["--partner-bg-image"],
  'url("/partner-assets/angela/forest.webp")',
);

const themeCss = readFileSync("app/partner-theme.css", "utf8");
const baseCss = readFileSync("app/oremea-colors.css", "utf8");
const globals = readFileSync("app/globals.css", "utf8");
const member = readFileSync("src/lib/oremea/partner-brand-context.ts", "utf8");
const scope = readFileSync("components/oremea/PartnerProductThemeScope.tsx", "utf8");
const recognition = readFileSync("app/recognition/layout.tsx", "utf8");
const compass = readFileSync("app/compass/layout.tsx", "utf8");
const landing = readFileSync("app/partner/[slug]/page.tsx", "utf8");

assert.match(baseCss, /--oremea-gold:\s*#cda434/i, "OREMEA's main gold stays unchanged.");
assert.match(globals, /@import "\.\/partner-theme\.css";/);
assert.match(themeCss, /\.partner-theme-scope\s*\{/);
assert.match(themeCss, /--oremea-gold:\s*var\(--partner-accent\)/);
assert.match(themeCss, /--recognition-bg:\s*var\(--partner-bg\)/);
assert.match(themeCss, /--recognition-gold:\s*var\(--partner-accent\)/);
assert.match(themeCss, /--partner-bg-image/);
assert.doesNotMatch(themeCss, /:root\s*\{/);
assert.match(member, /partnerMembershipAccessEnabled\(\)/);
assert.match(member, /product_keys:\s*\{ has: product \}/);
assert.match(member, /getPublishedPartnerExperience/);
assert.match(scope, /await auth\(\)/);
assert.match(scope, /getActivePartnerBrand\(userId, product\)/);
assert.match(recognition, /<PartnerProductThemeScope product="recognition">/);
assert.match(compass, /<PartnerProductThemeScope product="compass">/);
assert.match(landing, /partnerThemeStyle\(brand\)/);
assert.match(landing, /partner-theme-scope/);
assert.doesNotMatch(scope, /setRecognitionMembershipAccess|grantCompassAccess|whopMembership/i);
console.log("Partner backgrounds and colours are scoped, entitlement-verified, and opt-in.");
