import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const publicProductFiles = [
  "app/page.tsx",
  "app/compass/layout.tsx",
  "components/site/sections/compare-hero.tsx",
  "components/site/sections/compare-recognition.tsx",
  "components/site/sections/compare-resonance.tsx",
  "components/site/sections/compare-compass.tsx",
  "components/site/sections/compare-final-guidance.tsx",
  "components/site/sections/explore-hero.tsx",
  "components/site/sections/explore-ecosystem.tsx",
  "components/site/sections/explore-starting-point.tsx",
  "components/site/sections/explore-what-is.tsx",
];

const source = publicProductFiles
  .map((path) => `\n/* ${path} */\n${readFileSync(path, "utf8")}`)
  .join("\n");

const forbiddenPublicHierarchy = [
  /ongoing accountability conversation/i,
  /recommended starting point/i,
  /foundation of the ecosystem/i,
  /strongly recommended before progressing/i,
  /strongest foundation/i,
  /participant-owned movement after awareness/i,
  /Turn awareness into/i,
];

for (const pattern of forbiddenPublicHierarchy) {
  assert.doesNotMatch(
    source,
    pattern,
    `Public Oremea product routing must not reintroduce hierarchy or stale product identity: ${pattern}`,
  );
}

assert.match(
  source,
  /Each Oremea product stands on its own/i,
  "Public comparison copy must preserve standalone product authority.",
);
assert.match(
  source,
  /There is no locked sequence and no prerequisite product/i,
  "Explore must explicitly preserve entry-point freedom.",
);
assert.match(
  source,
  /Recognition is a private AI[\s\S]*discussion journal/i,
  "Public comparison copy must preserve Recognition's current discussion-journal identity.",
);
assert.match(
  source,
  /no room is a[\s\S]*prerequisite for another Oremea product/i,
  "Resonance must not be positioned as a prerequisite for another product.",
);
assert.match(
  readFileSync("app/compass/layout.tsx", "utf8"),
  /Turn what matters into clear direction/i,
  "Compass metadata must describe its standalone movement job rather than a prerequisite sequence.",
);

const middleware = readFileSync("middleware.ts", "utf8");
const memberNav = readFileSync("app/(member)/member-nav.tsx", "utf8");
const profileProducts = readFileSync(
  "components/site/sections/profile-products.tsx",
  "utf8",
);

assert.match(
  memberNav,
  /href="https:\/\/recognition\.oremea\.com\/archive"/,
  "Recognition Archive must use the clean Recognition product-domain route.",
);
assert.match(
  memberNav,
  /href="https:\/\/resonance\.oremea\.com\/archive"/,
  "Resonance Archive must use the clean Resonance product-domain route.",
);
assert.doesNotMatch(
  memberNav,
  /resonance\.oremea\.com\/archive\?view=day/,
  "Resonance Archive must not retain the retired day-view query.",
);
assert.match(
  memberNav,
  /href="https:\/\/compass\.oremea\.com\/archive"/,
  "Compass Archive must use the clean Compass product-domain route.",
);

assert.match(
  middleware,
  /host === RESONANCE_HOST[\s\S]*pathname === "\/archive"[\s\S]*rewriteResonancePath\(req, "\/resonance\/archive"\)/,
  "The Resonance product host must rewrite clean /archive requests to the working archive page.",
);
assert.match(
  middleware,
  /pathname === "\/resonance\/archive"[\s\S]*redirectResonancePath\(req, "\/archive"\)/,
  "Legacy internal Resonance archive paths must redirect to the clean product-domain path.",
);
assert.match(
  profileProducts,
  /href="\/resonance\/archive"/,
  "The profile still exposes the legacy Resonance archive entry and therefore requires middleware compatibility.",
);
assert.match(
  profileProducts,
  /"https:\/\/compass\.oremea\.com\/archive"/,
  "Expired Compass records must keep their clean Compass Archive destination.",
);

console.log("Public product routing contract checks passed.");
