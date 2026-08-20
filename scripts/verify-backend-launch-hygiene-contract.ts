import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";

const middleware = readFileSync("middleware.ts", "utf8");
const contactRoute = readFileSync("app/api/contact/route.ts", "utf8");
const searchSessionCreateRoute = readFileSync(
  "app/api/works/search-sessions/route.ts",
  "utf8"
);
const searchSessionRoute = readFileSync(
  "app/api/works/search-sessions/[sessionId]/route.ts",
  "utf8"
);
const briefCreateRoute = readFileSync(
  "app/api/works/briefs/route.ts",
  "utf8"
);
const briefRoute = readFileSync(
  "app/api/works/briefs/[briefId]/route.ts",
  "utf8"
);
const briefAnswersRoute = readFileSync(
  "app/api/works/briefs/[briefId]/answers/route.ts",
  "utf8"
);
const procurementRoute = readFileSync(
  "app/api/works/procurement-requests/route.ts",
  "utf8"
);
const outreachRoute = readFileSync(
  "app/api/works/provider-outreach/route.ts",
  "utf8"
);
const ownership = readFileSync(
  "lib/works/searches/anonymous-search-ownership.ts",
  "utf8"
);

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

assert.match(
  searchSessionCreateRoute,
  /normalizeWorksBrowserSessionId/,
  "Anonymous WORKS searches must reject malformed browser-session identifiers."
);
assert.match(
  searchSessionCreateRoute,
  /setWorksBrowserSessionCookie/,
  "Anonymous WORKS search creation must bind ownership to a server-set cookie."
);
assert.match(
  ownership,
  /httpOnly:\s*true/,
  "The anonymous WORKS ownership cookie must be HttpOnly."
);
assert.match(
  ownership,
  /sameSite:\s*"lax"/,
  "The anonymous WORKS ownership cookie must use SameSite=Lax."
);
assert.match(
  ownership,
  /secure:\s*process\.env\.NODE_ENV === "production"/,
  "The anonymous WORKS ownership cookie must be Secure in production."
);

for (const [name, source] of [
  ["search restore/update", searchSessionRoute],
  ["brief creation", briefCreateRoute],
  ["brief restore", briefRoute],
  ["founder answers", briefAnswersRoute],
  ["sourcing contact data", procurementRoute],
  ["provider outreach", outreachRoute],
] as const) {
  assert.match(
    source,
    /ownsWorksAnonymousSearch/,
    `WORKS ${name} must verify anonymous browser ownership.`
  );
}

assert.match(
  outreachRoute,
  /searchSession\.brief_id !== briefId/,
  "Provider outreach must bind the requested brief to the owned search session."
);
assert.match(
  outreachRoute,
  /\["SENT", "RESPONDED", "DECLINED"\]\.includes\(existingOutreach\.status\)/,
  "Provider outreach must prevent accidental repeat sends after a provider was contacted."
);

console.log("Backend launch hygiene contract checks passed.");
