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
const middleware = readFileSync("middleware.ts", "utf8");
const exploreEcosystem = readFileSync(
  "components/site/sections/explore-ecosystem.tsx",
  "utf8",
);
const compareResonance = readFileSync(
  "components/site/sections/compare-resonance.tsx",
  "utf8",
);

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

assert.match(
  exploreEcosystem,
  /href:\s*"https:\/\/resonance\.oremea\.com"/,
  "Explore must route Resonance through its canonical product host.",
);
assert.doesNotMatch(
  exploreEcosystem,
  /href:\s*"\/resonance\/enter"/,
  "Explore must not send Resonance prospects through the old main-site implementation path.",
);
assert.match(
  compareResonance,
  /href="https:\/\/resonance\.oremea\.com"/,
  "Compare must route Resonance through its canonical product host.",
);
assert.doesNotMatch(
  compareResonance,
  /href="\/resonance\/enter"/,
  "Compare must not send Resonance prospects through the old main-site implementation path.",
);

assert.match(
  middleware,
  /function isResonanceProtectedPath[\s\S]*pathname === "\/archive"[\s\S]*pathname === "\/resonance\/archive"/,
  "Resonance Archive must be protected on both canonical and legacy implementation paths.",
);
assert.match(
  middleware,
  /pathname === "\/archive" \|\| pathname === "\/archive\/"\)[\s\S]*rewriteResonancePath\(req, "\/resonance\/archive"\)/,
  "The canonical Resonance Archive path must rewrite to the existing archive implementation.",
);
assert.match(
  middleware,
  /pathname === "\/resonance\/archive" \|\|[\s\S]*redirectResonancePath\(req, "\/archive"\)/,
  "Legacy Resonance Archive URLs must canonicalize to resonance.oremea.com/archive.",
);

console.log("Public product routing contract checks passed.");
