import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";

// No extra public URLs are required to retire old authentication or test flows.
for (const removed of [
  "app/protected-test/page.tsx",
  "app/(member)/resonance/test/page.tsx",
  "lib/supabase/browser.ts",
  "lib/supabase/server.ts",
]) {
  assert.equal(existsSync(removed), false, "Obsolete surface remains: " + removed);
}

const callback = readFileSync("app/auth/callback/route.ts", "utf8");
assert.match(callback, /SAFE_RETURN_PATHS = new Set/, "Legacy auth must only allow approved local destinations.");
assert.match(callback, /parsed\.origin !== "https:\/\/oremea\.invalid"/, "Legacy return targets cannot point offsite.");
assert.match(callback, /new URL\("\/sign-in", incoming\.origin\)/, "Retired Supabase emails must go through Clerk login.");
assert.match(callback, /signIn\.searchParams\.set\("redirect_url", destination\)/, "Legacy sign-in must preserve a safe return destination.");
assert.doesNotMatch(callback, /createServerClient|exchangeCodeForSession|\/login\?error/, "Supabase must not regain control of sign-in.");

const compass = readFileSync("app/compass/access/page.tsx", "utf8");
assert.match(compass, /"\/sign-in\?redirect_url=%2Faccess"/, "Compass sign-in must lead back to product access.");
assert.doesNotMatch(compass, /"\/sign-in\?redirect_url=%2F"/, "Compass must not discard prospects on the home page.");

const compatible = [
  ["app/(marketing)/resonance/creator/page.tsx", /redirect\("\/resonance\/visits"\)/],
  ["app/(marketing)/resonance/resume/page.tsx", /redirect\("\/entry"\)/],
  ["app/resonance-rooms/page.tsx", /permanentRedirect\("\/resonance\/enter"\)/],
  ["app/dashboard/page.tsx", /redirect\("\/resonance"\)/],
  ["app/(member)/journey/page.tsx", /redirect\("\/resonance"\)/],
  ["app/(member)/journey/unlock/page.tsx", /redirect\("\/entry"\)/],
];
for (const [path, expected] of compatible) {
  assert.match(readFileSync(path, "utf8"), expected, "Published legacy destination changed: " + path);
}
assert.equal(existsSync("app/(member)/resonance/purchase/page.tsx"), true,
  "Retain the feature-gated historic purchase lane until provider migration is verified.");

console.log("Retired obsolete surfaces removed; canonical and legacy journeys preserved.");
