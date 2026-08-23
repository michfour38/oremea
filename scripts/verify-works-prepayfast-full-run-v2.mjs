import { randomUUID } from "node:crypto";
import { execFileSync } from "node:child_process";
import { mkdtempSync, readFileSync, readdirSync, statSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

const WORKS = "https://works.oremea.com";
const OREMEA = "https://www.oremea.com";
const abs = (base, path) => path.startsWith("http") ? path : `${base}${path}`;
const fail = (message) => { throw new Error(message); };

async function request(url, init = {}) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 25_000);
  try {
    return await fetch(url, {
      redirect: "manual",
      signal: controller.signal,
      headers: { "user-agent": "oremea-works-prepayfast-readiness/2026-08-23", ...(init.headers || {}) },
      ...init,
    });
  } finally { clearTimeout(timer); }
}

async function page(base, path, needles = []) {
  const url = abs(base, path);
  const response = await request(url);
  const text = await response.text();
  console.log(`PAGE ${response.status} ${url}`);
  if (response.status !== 200) fail(`${url} returned ${response.status}`);
  for (const needle of needles) if (!text.includes(needle)) fail(`${url} missing ${needle}`);
  return { response, text };
}

console.log("=== PUBLIC MERCHANT-REVIEW SURFACES ===");
const home = await page(WORKS, "/", ["Need something made? Start below", "Know who can make it", "Build the brief", "See the route", "Reach suitable providers"]);
await page(WORKS, "/providers/plans", ["R599 / month", "R1,999 / month", "What paid plans buy", "What they never buy"]);
await page(WORKS, "/providers/join");
await page(WORKS, "/provider/billing", ["Choose how WORKS participates"]);
await page(WORKS, "/terms", ["South African law", "support@oremea.com"]);
await page(WORKS, "/verification");
await page(WORKS, "/reviews-policy");
await page(WORKS, "/partner-disclosure");
await page(WORKS, "/sign-in");
await page(OREMEA, "/refunds", ["Cancellation", "Refund", "South Africa"]);
await page(OREMEA, "/privacy", ["Privacy"]);
await page(OREMEA, "/contact", ["support@oremea.com"]);
if (!/canonical[^>]+works\.oremea\.com|works\.oremea\.com[^>]+canonical/i.test(home.text)) fail("WORKS homepage canonical missing");
const robots = await page(WORKS, "/robots.txt");
if (!/sitemap/i.test(robots.text)) fail("robots.txt missing sitemap");
const sitemap = await page(WORKS, "/sitemap.xml");
const providerUrls = [...sitemap.text.matchAll(/<loc>(https:\/\/works\.oremea\.com\/providers\/([^<\/]+))<\/loc>/g)]
  .map((m) => ({ url: m[1], slug: m[2] }))
  .filter(({ slug }) => !["plans", "join", "claim", "new", "verify-claim"].includes(slug));
if (!providerUrls.length) fail("No public provider profiles in sitemap");
console.log(`PUBLIC_PROVIDERS ${providerUrls.length}`);
let providerRendered = false;
for (const candidate of providerUrls.slice(0, 5)) {
  const result = await page(WORKS, candidate.url);
  if (/Current offerings|still completing its public WORKS profile/.test(result.text)) { providerRendered = true; console.log(`PUBLIC_PROVIDER_SAMPLE ${candidate.slug}`); break; }
}
if (!providerRendered) fail("No sampled provider rendered public capability state");

console.log("=== AUTHORIZATION FAIL-CLOSED ===");
for (const path of ["/api/works/provider/me", "/api/works/provider-claims?q=oremea", "/api/works/provider/inbox"]) {
  const r = await request(`${WORKS}${path}`);
  console.log(`PRIVATE ${r.status} ${path}`);
  if (![401,403].includes(r.status)) fail(`${path} did not fail closed`);
}
const checkout = await request(`${WORKS}/api/works/billing/payfast/checkout`, {
  method: "POST", headers: { "content-type": "application/json" },
  body: JSON.stringify({ providerId: "qa", plan: "VERIFIED", acceptRecurringTerms: true }),
});
console.log(`PAYFAST_CHECKOUT_PREAUTH ${checkout.status}`);
if (checkout.status !== 401) fail("Anonymous PayFast checkout was not blocked");
const itn = await request(`${WORKS}/api/works/billing/payfast/itn`, { method: "POST", headers: { "content-type": "application/x-www-form-urlencoded" }, body: "" });
console.log(`PAYFAST_ITN_PREACCOUNT ${itn.status}`);
if (![401,503].includes(itn.status)) fail(`Unexpected pre-account ITN status ${itn.status}`);

console.log("=== REAL QA BUYER SESSION ===");
const browserSessionId = randomUUID();
const created = await request(`${WORKS}/api/works/search-sessions`, {
  method: "POST", headers: { "content-type": "application/json" },
  body: JSON.stringify({ marketSlug: "za", browserSessionId, currentStep: "qa-product", answers: { qa: true, purpose: "Pre-PayFast readiness test; not real demand" } }),
});
const createdBody = await created.json().catch(() => ({}));
console.log(`SEARCH_CREATE ${created.status} ${JSON.stringify(createdBody)}`);
if (created.status !== 200 || !createdBody.sessionId) fail("Could not create QA search session");
const setCookie = created.headers.get("set-cookie") || "";
if (!/oremea_works_browser_za=/i.test(setCookie) || !/httponly/i.test(setCookie) || !/secure/i.test(setCookie) || !/samesite=lax/i.test(setCookie)) fail(`Unsafe ownership cookie: ${setCookie}`);
const cookie = setCookie.split(";")[0];
const sessionId = createdBody.sessionId;
let r = await request(`${WORKS}/api/works/search-sessions/${sessionId}`, { headers: { cookie } });
console.log(`SEARCH_RESTORE_OWNED ${r.status}`); if (r.status !== 200) fail("Owner could not restore search");
r = await request(`${WORKS}/api/works/search-sessions/${sessionId}`);
console.log(`SEARCH_RESTORE_OTHER_BROWSER ${r.status}`); if (r.status !== 404) fail("Other browser could read search");
r = await request(`${WORKS}/api/works/search-sessions/${sessionId}`, {
  method: "PATCH", headers: { cookie, "content-type": "application/json" },
  body: JSON.stringify({ currentStep: "qa-quantity", answers: { qa: true, purpose: "Pre-PayFast readiness test; not real demand", product: "QA skincare sample" } }),
});
console.log(`SEARCH_SAVE_PROGRESS ${r.status}`); if (r.status !== 200) fail("Could not save search progress");

console.log("=== QA BRIEF -> ROUTE -> RESTORE ===");
const brief = await request(`${WORKS}/api/works/briefs`, {
  method: "POST", headers: { cookie, "content-type": "application/json" },
  body: JSON.stringify({
    marketSlug: "za", searchSessionId: sessionId,
    productDescription: "WORKS QA pre-PayFast readiness skincare sample — NOT a customer enquiry",
    categoryKey: "SKINCARE", stage: "IDEA", targetQuantity: 100, quantityUnit: "UNITS",
    requestedServiceKeys: ["FORMULATION", "MANUFACTURING", "PACKAGING"], packagingFormat: "BOTTLE",
    locationPreference: "ANYWHERE_MARKET", existingAssets: [],
  }),
});
const briefBody = await brief.json().catch(() => ({}));
console.log(`BRIEF_CREATE ${brief.status} briefId=${briefBody.briefId || "none"} route=${briefBody.route ? "yes" : "no"} routeError=${briefBody.routeError || "none"}`);
if (brief.status !== 200 || !briefBody.briefId || !briefBody.route) fail(`QA brief failed ${JSON.stringify(briefBody).slice(0,900)}`);
const briefId = briefBody.briefId;
r = await request(`${WORKS}/api/works/briefs/${briefId}?searchSessionId=${encodeURIComponent(sessionId)}`, { headers: { cookie } });
const restored = await r.json().catch(() => ({}));
console.log(`BRIEF_RESTORE_OWNED ${r.status} route=${restored.route ? "yes" : "no"}`); if (r.status !== 200 || !restored.route) fail("Owner could not restore route");
r = await request(`${WORKS}/api/works/briefs/${briefId}?searchSessionId=${encodeURIComponent(sessionId)}`);
console.log(`BRIEF_RESTORE_OTHER_BROWSER ${r.status}`); if (r.status !== 404) fail("Other browser could restore route");
r = await request(`${WORKS}/api/works/search-sessions/${sessionId}`, { headers: { cookie } });
const final = await r.json().catch(() => ({}));
console.log(`SEARCH_FINAL ${r.status} status=${final.status} briefMatch=${final.briefId === briefId}`);
if (r.status !== 200 || final.status !== "ROUTE_BUILT" || final.briefId !== briefId) fail("Search did not complete ROUTE_BUILT");

console.log("=== OFFICIAL PAYFAST PAYMENT-METHOD PACK ===");
try {
  const dir = mkdtempSync(join(tmpdir(), "pf-pack-"));
  const zip = join(dir, "methods.zip");
  execFileSync("curl", ["-fsSL", "https://payfast.io/wp-content/uploads/2026/06/Payment-Methods-Logo-Pack.zip", "-o", zip]);
  const list = execFileSync("unzip", ["-Z1", zip], { encoding: "utf8" });
  console.log("PAYFAST_LOGO_PACK_FILES_START\n" + list.trim() + "\nPAYFAST_LOGO_PACK_FILES_END");
  const out = join(dir, "out"); execFileSync("unzip", ["-qq", zip, "-d", out]);
  const walk = (root) => readdirSync(root, { withFileTypes: true }).flatMap((e) => { const p = join(root,e.name); return e.isDirectory() ? walk(p) : [p]; });
  const svgs = walk(out).filter((p) => p.toLowerCase().endsWith(".svg")).sort((a,b) => statSync(a).size - statSync(b).size);
  if (svgs.length) {
    const content = readFileSync(svgs[0], "utf8");
    console.log(`PAYFAST_SMALLEST_SVG ${svgs[0].slice(out.length+1)} bytes=${Buffer.byteLength(content)}`);
    console.log(`PAYFAST_SMALLEST_SVG_BASE64 ${Buffer.from(content).toString("base64")}`);
  } else console.log("PAYFAST_LOGO_PACK_HAS_NO_SVG");
} catch (error) { console.log(`PAYFAST_LOGO_PACK_INSPECTION_WARNING ${error instanceof Error ? error.message : String(error)}`); }

console.log("=== WORKS PRE-PAYFAST FULL RUN PASSED ===");
console.log(`QA_ARTIFACTS searchSessionId=${sessionId} briefId=${briefId}`);
