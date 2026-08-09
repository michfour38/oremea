import { readFileSync } from "node:fs";

function assert(condition: unknown, message: string): asserts condition {
  if (!condition) throw new Error(message);
}

const archiveIndex = readFileSync("app/compass/archive/page.tsx", "utf8");
const archiveArea = readFileSync(
  "app/compass/archive/[area]/page.tsx",
  "utf8",
);
const archiveSession = readFileSync(
  "app/compass/archive/session/[id]/page.tsx",
  "utf8",
);
const archiveSessionView = readFileSync(
  "app/compass/archive/session/[id]/CompassArchiveSessionView.tsx",
  "utf8",
);
const restoreRoute = readFileSync(
  "app/api/compass/map/restore/route.ts",
  "utf8",
);
const profileProducts = readFileSync(
  "components/site/sections/profile-products.tsx",
  "utf8",
);

assert(
  !archiveIndex.includes('redirect("/")') &&
    !archiveArea.includes('redirect("/")') &&
    !archiveSession.includes('redirect("/")'),
  "Signed-in participants must retain read-only Compass Archive access after expiry.",
);
assert(
  archiveSession.includes("canRestoreToMap={access.active}") &&
    archiveSessionView.includes(
      "onReturn={canRestoreToMap ? returnToCurrentMap : undefined}",
    ),
  "Archive-to-Map actions must only appear during active Compass access.",
);
assert(
  restoreRoute.includes("getCompassAccessState") &&
    restoreRoute.includes("Compass access has ended."),
  "The restore API must enforce active Compass access even if called directly.",
);
assert(
  profileProducts.includes('"https://compass.oremea.com/archive"') &&
    profileProducts.includes('"Open Compass Archive"'),
  "Expired Compass profile records must lead to Archive, not active Compass.",
);

console.log("Compass Archive access contract checks passed.");
