import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

import {
  partnerThemeStyle,
  safePartnerBackgroundAsset,
} from "../src/lib/oremea/partner-theme";
import { OREMEA_PARTNER_EXPERIENCES } from "../src/lib/oremea/partner-experiences";
import { getResonanceSceneBackgrounds } from "../src/lib/resonance/resonance-backgrounds";

const angela = OREMEA_PARTNER_EXPERIENCES.angela;
const style = partnerThemeStyle(angela.brand) as Record<string, string>;
assert.equal(style["--partner-bg"], angela.brand.background);
assert.equal(style["--partner-foreground"], angela.brand.foreground);
assert.equal(style["--partner-accent"], angela.brand.accent);
assert.equal(style["--partner-bg-image"], "none");
assert.equal(style["--partner-bg-image-mobile"], "none");
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
assert.equal(
  (partnerThemeStyle({
    ...angela.brand,
    backgroundAssetPath: "/partner-assets/angela/desktop.webp",
    mobileBackgroundAssetPath: "/partner-assets/angela/mobile.webp",
  }) as Record<string,string>)["--partner-bg-image-mobile"],
  'url("/partner-assets/angela/mobile.webp")',
);
assert.equal(
  (partnerThemeStyle({
    ...angela.brand,
    backgroundAssetPath: "/partner-assets/angela/desktop.webp",
  }) as Record<string,string>)["--partner-bg-image-mobile"],
  'url("/partner-assets/angela/desktop.webp")',
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
assert.match(compass, /<CompassAppearance>/, "Compass must keep its own visual system.");
assert.doesNotMatch(compass, /<PartnerProductThemeScope/,
  "Partner artwork must not replace Compass's existing background.");
assert.match(landing, /partnerThemeStyle\(brand\)/);
assert.match(landing, /partner-theme-scope/);
assert.doesNotMatch(scope, /setRecognitionMembershipAccess|grantCompassAccess|whopMembership/i);

const resonanceLayout = readFileSync("app/(member)/resonance/layout.tsx", "utf8");
const resonanceRoom = readFileSync("app/(member)/resonance/page.tsx", "utf8");
const resonanceConfig = readFileSync("src/lib/resonance/resonance-backgrounds.ts", "utf8");
const compassAppearance = readFileSync("components/compass/CompassAppearance.tsx", "utf8");

assert.match(resonanceLayout, /<PartnerProductThemeScope product="resonance">/);
assert.match(resonanceRoom, /getResonanceSceneBackgrounds/);
assert.match(compassAppearance, /localStorage\.setItem/);
assert.match(compassAppearance, /Light mode/);
assert.match(compassAppearance, /Dark mode/);
assert.match(resonanceConfig, /mode === "original"/);
assert.match(resonanceConfig, /mode === "plain"/);

const roomNames = [
  "hearth", "mirror", "garden", "compass", "pulse", "shadow",
  "forge", "vision", "the-gathering", "the-becoming",
];
for (let week = 1; week <= 10; week++) {
  const suffix = roomNames[week - 1];
  const original = {
    desktop: `/images/desktop/bg-${suffix}.webp`,
    mobile: `/images/mobile/bg-${suffix}.webp`,
  };
  assert.deepEqual(getResonanceSceneBackgrounds(week), original);
  assert.deepEqual(getResonanceSceneBackgrounds(week, angela.brand), original,
    "Default partner settings must keep the original OREMEA paintings.");
  assert.deepEqual(getResonanceSceneBackgrounds(week, {
    ...angela.brand,
    resonanceScenes: { ...angela.brand.resonanceScenes, mode: "plain" },
  }), { desktop: null, mobile: null });
}
assert.deepEqual(getResonanceSceneBackgrounds("entry"), {
  desktop: "/images/desktop/bg-entry.webp",
  mobile: "/images/mobile/bg-entry.webp",
});
assert.deepEqual(getResonanceSceneBackgrounds("archive"), {
  desktop: "/images/desktop/bg-archive.webp",
  mobile: "/images/mobile/bg-archive.webp",
});

const customBrand = {
  ...angela.brand,
  resonanceScenes: {
    ...angela.brand.resonanceScenes,
    mode: "custom" as const,
    rooms: {
      1: {
        desktop: "/partner-assets/angela/new-hearth.webp",
        mobile: "/partner-assets/angela/new-hearth-mobile.webp",
      },
      2: { desktop: "/partner-assets/angela/mirror.webp", mobile: null },
      3: { desktop: "https://untrusted.example/scene.webp", mobile: null },
    },
  },
};
assert.deepEqual(getResonanceSceneBackgrounds(1, customBrand), {
  desktop: "/partner-assets/angela/new-hearth.webp",
  mobile: "/partner-assets/angela/new-hearth-mobile.webp",
});
assert.deepEqual(getResonanceSceneBackgrounds(2, customBrand), {
  desktop: "/partner-assets/angela/mirror.webp",
  mobile: "/partner-assets/angela/mirror.webp",
});
assert.deepEqual(getResonanceSceneBackgrounds(3, customBrand), {
  desktop: "/images/desktop/bg-garden.webp",
  mobile: "/images/mobile/bg-garden.webp",
});
assert.deepEqual(getResonanceSceneBackgrounds(4, customBrand), {
  desktop: "/images/desktop/bg-compass.webp",
  mobile: "/images/mobile/bg-compass.webp",
}, "Optional custom artwork must not overwrite unrelated room scenes.");

console.log("Partner backgrounds and colours are scoped, entitlement-verified, and opt-in.");
