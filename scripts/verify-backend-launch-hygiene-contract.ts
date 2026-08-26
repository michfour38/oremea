import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";

const middleware = readFileSync("middleware.ts", "utf8");
const contactRoute = readFileSync("app/api/contact/route.ts", "utf8");

for (const deadPath of [
  "app/api/paystack/journey-success/route.ts",
  "app/api/recognition/migration-status-once/route.ts",
  ".github/workflows/read-recognition-migration-state.yml",
  "migrations",
]) {
  assert.equal(
    existsSync(deadPath),
    false,
    `${deadPath} is retired launch infrastructure and must not return.`
  );
}

assert.doesNotMatch(
  middleware,
  /resonance-seed-once/,
  "The deleted Resonance seed endpoint must not remain publicly whitelisted."
);

assert.match(
  middleware,
  /["']\/api\/contact["']/,
  "The public contact form endpoint must remain accessible without signing in."
);
assert.match(
  contactRoute,
  /Oremea website <website@oremea\.com>/,
  "Contact mail must use a sender address distinct from the support inbox."
);

console.log("Backend launch hygiene contract checks passed.");
