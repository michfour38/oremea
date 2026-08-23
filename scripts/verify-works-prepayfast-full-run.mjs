import { randomUUID } from "node:crypto";
import { execFileSync } from "node:child_process";
import { mkdtempSync, readFileSync, readdirSync, statSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

const WORKS = "https://works.oremea.com";
const OREMEA = "https://www.oremea.com";

function fail(message) {
  throw new Error(message);
}

async function request(url, init = {}) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 25_000);
  try {
    return await fetch(url, {
      redirect: "manual",
      signal: controller.signal,
      headers: {
        "user-agent": "oremea-works-prepayfast-readiness/2026-08-23",
        ...(init.headers || {}),
      },
      ...init,
    });
  } finally {
    clearTimeout(timer);
  }
}

async function textPage(base, path, expected = []) {
  const response = await request(`${base}${path}`);
  const text = await response.text();
  console.log(`PAGE ${response.status} ${base}${path}`);
  if (response.status !== 200) fail(`${path} returned ${response.status}`);
  for (const needle of expected) {
    if (!text.includes(needle)) fail(`${path} is missing required copy: ${needle}`);
  }
  return { response, text };
}

console.log("=== 1. PUBLIC MERCHANT-REVIEW SURFACES ===");
const home = await textPage(WORKS, "/", [
  "Need something made? Start below",
  "Know who can make it",
  "Build the brief",
  "See the route",
  "Reach suitable providers",
]);
await textPage(WORKS, "/providers/plans", [
  "R599 / month",
  "R1,999 / month",
  "What paid plans buy",
  "What they never buy",
]);
await textPage(WORKS, "/providers/join");
await textPage(WORKS, "/provider/billing", ["Plans &amp; billing", "Choose how WORKS participates"]);
await textPage(WORKS, "/terms", ["South African law", "support@oremea.com"]);
await textPage(WORKS, "/verification");
await textPage(WORKS, "/reviews-policy");
await textPage(WORKS, "/partner-disclosure");
await textPage(WORKS, "/sign-in");
await textPage(OREMEA, "/refunds", ["Payments, Subscriptions, Cancellation &amp; Refund Policy", "South Africa"]);
await textPage(OREMEA, "/privacy", ["Privacy"]);
await textPage(OREMEA, "/contact", ["support@oremea.com"]);

if (!/rel=["']canonical["'][^>]*https:\/\/works\.oremea\.com/i.test(home.text) &&
    !/https:\/\/works\.oremea\.com[^>]*rel=["']canonical["']/i.test(home.text)) {
  fail("WORKS homepage canonical was not present.");
}

const robots = await textPage(WORKS, "/robots.txt");
if (!/sitemap/i.test(robots.text)) fail("robots.txt does not advertise the sitemap.");
const sitemap = await textPage(WORKS, "/sitemap.xml");
const providerUrls = [...sitemap.text.matchAll(/<loc>(https:\/\/works\.oremea\.com\/providers\/([^<\/]+))<\/loc>/g)]
  .map((m) => ({ url: m[1], slug: m[2] }))
  .filter(({ slug }) => !["plans", "join", "claim", "new", "verify-claim"].includes(slug));
if (!providerUrls.length) fail("No public provider profiles were discoverable in the live sitemap.");
console.log(`PUBLIC_PROVIDERS ${providerUrls.length}`);
const provider = await textPage("", providerUrls[0].url.replace(/^https:\/\/works\.oremea\.com/, ""));
if (!/Current offerings|This business is still completing its public WORKS profile/.test(provider.text)) {
  fail("Sample public provider profile did not render its public capability state.");
}

console.log("=== 2. AUTHORIZATION FAIL-CLOSED CHECKS ===");
for (const path of [
  "/api/works/provider/me",
  "/api/works/provider-claims?q=oremea",
  "/api/works/provider/inbox",
]) {
  const r = await request(`${WORKS}${path}`);
  console.log(`PRIVATE ${r.status} ${path}`);
  if (![401, 403].includes(r.status)) fail(`${path} did not reject an anonymous request.`);
}
const unauthCheckout = await request(`${WORKS}/api/works/billing/payfast/checkout`, {
  method: "POST",
  headers: { "content-type": "application/json" },
  body: JSON.stringify({ providerId: "qa", plan: "VERIFIED", acceptRecurringTerms: true }),
});
console.log(`PAYFAST_CHECKOUT_PREAUTH ${unauthCheckout.status}`);
if (unauthCheckout.status !== 401) fail("PayFast checkout did not require authentication before billing logic.");

const itnProbe = await request(`${WORKS}/api/works/billing/payfast/itn`, {
  method: "POST",
  headers: { "content-type": "application/x-www-form-urlencoded" },
  body: "",
});
console.log(`PAYFAST_ITN_PREACCOUNT ${itnProbe.status} (503 is expected before PayFast credentials exist; 401 means credentials are already configured)`);
if (![401, 503].includes(itnProbe.status)) fail(`Unexpected pre-account PayFast ITN response ${itnProbe.status}.`);

console.log("=== 3. REAL ANONYMOUS BUYER SESSION + PRIVACY BOUNDARY ===");
const browserSessionId = randomUUID();
const createSession = await request(`${WORKS}/api/works/search-sessions`, {
  method: "POST",
  headers: { "content-type": "application/json" },
  body: JSON.stringify({
    marketSlug: "za",
    browserSessionId,
    currentStep: "qa-product",
    answers: {
      qa: true,
      purpose: "WORKS pre-PayFast readiness test; not real customer demand",
    },
  }),
});
const createSessionBody = await createSession.json().catch(() => ({}));
console.log(`SEARCH_CREATE ${createSession.status} ${JSON.stringify(createSessionBody)}`);
if (createSession.status !== 200 || !createSessionBody.sessionId) fail("QA search session could not be created.");
const cookieHeader = createSession.headers.get("set-cookie") || "";
if (!/oremea_works_browser_za=/i.test(cookieHeader) || !/httponly/i.test(cookieHeader) || !/secure/i.test(cookieHeader) || !/samesite=lax/i.test(cookieHeader)) {
  fail(`QA search ownership cookie is missing expected security flags: ${cookieHeader}`);
}
const cookie = cookieHeader.split(";")[0];
const sessionId = createSessionBody.sessionId;

const readOwned = await request(`${WORKS}/api/works/search-sessions/${sessionId}`, { headers: { cookie } });
console.log(`SEARCH_RESTORE_OWNED ${readOwned.status}`);
if (readOwned.status !== 200) fail("Owning browser could not restore its QA search.");
const readUnowned = await request(`${WORKS}/api/works/search-sessions/${sessionId}`);
console.log(`SEARCH_RESTORE_OTHER_BROWSER ${readUnowned.status}`);
if (readUnowned.status !== 404) fail("A different browser could read an anonymous QA search.");

const updateSession = await request(`${WORKS}/api/works/search-sessions/${sessionId}`, {
  method: "PATCH",
  headers: { cookie, "content-type": "application/json" },
  body: JSON.stringify({
    currentStep: "qa-quantity",
    answers: {
      qa: true,
      purpose: "WORKS pre-PayFast readiness test; not real customer demand",
      product: "QA skincare sample",
    },
  }),
});
console.log(`SEARCH_SAVE_PROGRESS ${updateSession.status}`);
if (updateSession.status !== 200) fail("QA search progress could not be saved.");

console.log("=== 4. REAL QA BRIEF -> PRODUCTION ROUTE -> RESTORE ===");
const briefResponse = await request(`${WORKS}/api/works/briefs`, {
  method: "POST",
  headers: { cookie, "content-type": "application/json" },
  body: JSON.stringify({
    marketSlug: "za",
    searchSessionId: sessionId,
    productDescription: "WORKS QA pre-PayFast readiness skincare sample — NOT a customer enquiry",
    categoryKey: "SKINCARE",
    stage: "IDEA",
    targetQuantity: 100,
    quantityUnit: "UNITS",
    requestedServiceKeys: ["FORMULATION", "MANUFACTURING", "PACKAGING"],
    packagingFormat: "BOTTLE",
    locationPreference: "ANYWHERE_MARKET",
    existingAssets: [],
  }),
});
const briefBody = await briefResponse.json().catch(() => ({}));
console.log(`BRIEF_CREATE ${briefResponse.status} briefId=${briefBody.briefId || "none"} route=${briefBody.route ? "yes" : "no"} routeError=${briefBody.routeError || "none"}`);
if (briefResponse.status !== 200 || !briefBody.briefId || !briefBody.route) {
  fail(`QA production brief failed: ${JSON.stringify(briefBody).slice(0, 800)}`);
}
const briefId = briefBody.briefId;

const restoreBrief = await request(`${WORKS}/api/works/briefs/${briefId}?searchSessionId=${encodeURIComponent(sessionId)}`, { headers: { cookie } });
const restoreBody = await restoreBrief.json().catch(() => ({}));
console.log(`BRIEF_RESTORE_OWNED ${restoreBrief.status} route=${restoreBody.route ? "yes" : "no"}`);
if (restoreBrief.status !== 200 || !restoreBody.route) fail("Owning browser could not restore the QA production route.");
const leakBrief = await request(`${WORKS}/api/works/briefs/${briefId}?searchSessionId=${encodeURIComponent(sessionId)}`);
console.log(`BRIEF_RESTORE_OTHER_BROWSER ${leakBrief.status}`);
if (leakBrief.status !== 404) fail("A different browser could restore the QA production brief.");

const finalSession = await request(`${WORKS}/api/works/search-sessions/${sessionId}`, { headers: { cookie } });
const finalSessionBody = await finalSession.json().catch(() => ({}));
console.log(`SEARCH_FINAL ${finalSession.status} status=${finalSessionBody.status} briefMatch=${finalSessionBody.briefId === briefId}`);
if (finalSession.status !== 200 || finalSessionBody.status !== "ROUTE_BUILT" || finalSessionBody.briefId !== briefId) {
  fail("QA search did not finish in ROUTE_BUILT with its production brief attached.");
}

console.log("=== 5. OFFICIAL PAYFAST PAYMENT-METHOD ASSET INSPECTION ===");
try {
  const dir = mkdtempSync(join(tmpdir(), "payfast-logo-pack-"));
  const zipPath = join(dir, "payment-methods.zip");
  execFileSync("curl", ["-fsSL", "https://payfast.io/wp-content/uploads/2026/06/Payment-Methods-Logo-Pack.zip", "-o", zipPath], { stdio: "inherit" });
  const listing = execFileSync("unzip", ["-Z1", zipPath], { encoding: "utf8" });
  console.log("PAYFAST_LOGO_PACK_FILES_START");
  console.log(listing.trim());
  console.log("PAYFAST_LOGO_PACK_FILES_END");
  const extractDir = join(dir, "extract");
  execFileSync("unzip", ["-qq", zipPath, "-d", extractDir]);
  const walk = (root) => readdirSync(root, { withFileTypes: true }).flatMap((entry) => {
    const p = join(root, entry.name);
    return entry.isDirectory() ? walk(p) : [p];
  });
  const files = walk(extractDir);
  const svgs = files.filter((p) => p.toLowerCase().endsWith(".svg")).sort((a, b) => statSync(a).size - statSync(b).size);
  if (svgs.length) {
    const svg = svgs[0];
    const content = readFileSync(svg, "utf8");
    console.log(`PAYFAST_SMALLEST_SVG ${svg.slice(extractDir.length + 1)} bytes=${Buffer.byteLength(content)}`);
    console.log(`PAYFAST_SMALLEST_SVG_BASE64 ${Buffer.from(content).toString("base64")}`);
  } else {
    console.log("PAYFAST_LOGO_PACK_HAS_NO_SVG");
  }
} catch (error) {
  console.log(`PAYFAST_LOGO_PACK_INSPECTION_WARNING ${error instanceof Error ? error.message : String(error)}`);
}

console.log("=== WORKS PRE-PAYFAST FULL RUN PASSED ===");
console.log(`QA_ARTIFACTS searchSessionId=${sessionId} briefId=${briefId}`);
