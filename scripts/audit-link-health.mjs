// Public link integrity check: local Next.js pages/assets plus opt-in remote HTTP checks.
// No authentication, payments, webhook actions or private URLs are used.
import { existsSync, readdirSync, readFileSync } from "node:fs";
import { join, relative } from "node:path";

const EXTERNAL = process.argv.includes("--external");
const REPORT_ONLY = process.argv.includes("--report-only");
const roots = ["app", "components", "src"];
const CODE = /\.(?:tsx?|jsx?)$/;
const KNOWN_HOSTS = new Set([
  "oremea.com", "www.oremea.com", "recognition.oremea.com",
  "resonance.oremea.com", "compass.oremea.com", "app.oremea.com",
]);

function walk(path) {
  if (!existsSync(path)) return [];
  return readdirSync(path, { withFileTypes: true }).flatMap(entry => {
    const child = join(path, entry.name);
    return entry.isDirectory() ? walk(child) : entry.isFile() ? [child] : [];
  });
}

const sources = roots.flatMap(walk).filter(path => CODE.test(path));
const appFiles = walk("app");
const publicFiles = new Set(walk("public").map(path => "/" + relative("public", path).replaceAll("\\", "/")));
const routeFiles = appFiles.filter(path => /\/(?:page|route)\.(?:tsx?|jsx?)$/.test(path));

function routeMatcher(path) {
  const segments = path.replace(/^app\//, "").replace(/(?:^|\/)(?:page|route)\.(?:tsx?|jsx?)$/, "")
    .split("/").filter(s => s && !/^\(.*\)$/.test(s));
  return new RegExp("^" + (segments.map(segment => {
    if (/^\[\[\.\.\.[^\]]+\]\]$/.test(segment)) return "(?:/.*)?";
    if (/^\[\.\.\.[^\]]+\]$/.test(segment)) return "/.+";
    if (/^\[[^\]]+\]$/.test(segment)) return "/[^/]+";
    return "/" + segment.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  }).join("") || "/") + "/?$");
}
const routeMatchers = routeFiles.map(routeMatcher);
function pageExists(pathname) {
  return routeMatchers.some(regex => regex.test(pathname));
}
function oremeaPath(host, path) {
  if (host === "recognition.oremea.com") {
    if (path === "/" || path === "/purchase") return "/recognition/purchase";
    if (path === "/begin") return "/recognition";
    if (path === "/archive") return "/recognition/archive";
  }
  if (host === "resonance.oremea.com") {
    if (path === "/") return "/resonance/enter";
    if (path === "/archive") return "/resonance/archive";
  }
  if (host === "compass.oremea.com") {
    if (path === "/" || path === "/access") return "/compass/access";
    if (path === "/begin") return "/compass";
    if (path === "/map") return "/compass/map";
    if (path === "/archive") return "/compass/archive";
    if (path.startsWith("/archive/")) return "/compass" + path;
  }
  if (host === "app.oremea.com" && path === "/entry") return "/entry";
  // Main-site redirects and host-specific legacy aliases still resolve to these local pages.
  if (path === "/begin") return "/recognition";
  return path;
}

// Only probe routes intended for public access. Member/admin routes can
// deliberately return 404 to anonymous callers and must not be exposed by a link audit.
function isPublicLiveUrl(url) {
  const parsed = new URL(url);
  const host = parsed.hostname;
  const path = parsed.pathname.replace(/\/$/, "") || "/";
  if (host === "www.oremea.com" || host === "oremea.com") {
    return path === "/" || [
      "/explore", "/oremea", "/about", "/compare", "/party", "/resonance-rooms",
      "/resonance/enter", "/resonance/creator", "/contact", "/feedback", "/reviews",
      "/terms", "/privacy", "/cookies", "/paia", "/disclaimer", "/refunds",
      "/conduct", "/sign-in", "/sign-up", "/recognition", "/compass/access",
    ].some(prefix => path === prefix || path.startsWith(prefix + "/"));
  }
  if (host === "recognition.oremea.com") return ["/", "/purchase", "/begin"].includes(path);
  if (host === "resonance.oremea.com") return path === "/";
  if (host === "compass.oremea.com") return ["/", "/access"].includes(path);
  return false;
}

const refs = [];
const dynamic = [];
const patterns = [
  /\b(?:href|src|poster|action)\s*=\s*["']([^"'\s]+)["']/g,
  /\b(?:href|src|url|whopUrl|canonicalUrl|returnUrl|destination)\s*:\s*["']([^"']+)["']/g,
  /\b(?:redirect|permanentRedirect|router\.push|router\.replace|window\.location\.replace)\s*\(\s*["']([^"']+)["']/g,
  /\bwindow\.location\.href\s*=\s*["']([^"']+)["']/g,
  /\b(?:href|src)\s*=\s*\{\s*["']([^"']+)["']\s*\}/g,
];

for (const file of sources) {
  const code = readFileSync(file, "utf8");
  const seen = new Set();
  for (const pattern of patterns) {
    for (const match of code.matchAll(pattern)) {
      const value = match[1].replace(/&amp;/g, "&");
      if (!value.startsWith("/") && !/^https?:\/\//i.test(value)) continue;
      const line = code.slice(0, match.index).split("\n").length;
      const key = line + ":" + value;
      if (!seen.has(key)) refs.push({ file, line, value });
      seen.add(key);
    }
  }
  if (/\b(?:href|src)\s*=\s*\{(?!\s*["'])/.test(code)) dynamic.push(file);
}

const broken = [];
// Navigation that promises public access must not be silently gated by Clerk.
const middleware = existsSync("middleware.ts") ? readFileSync("middleware.ts", "utf8") : "";
const publicMatcher = middleware.split("const isPublicRoute = createRouteMatcher([")[1]?.split("]);")[0] || "";
for (const matcher of ["/about(.*)", "/party(.*)", "/cookies(.*)", "/paia(.*)"]) {
  if (!publicMatcher.includes('"' + matcher + '"')) {
    broken.push("middleware.ts: missing public access matcher " + matcher);
  }
}
for (const protectedMatcher of ["/admin(.*)", "/key(.*)", "/current(.*)", "/harmonize(.*)"]) {
  if (publicMatcher.includes('"' + protectedMatcher + '"')) {
    broken.push("middleware.ts: member/admin route inadvertently public " + protectedMatcher);
  }
}
const remote = new Map();
const siteRoutes = new Map();
// Always monitor critical anonymous entry routes, even when a future refactor
// removes a literal link from source. This is a small, safe GET/HEAD allowlist.
const criticalPublicUrls = [
  "https://www.oremea.com/",
  "https://www.oremea.com/explore",
  "https://www.oremea.com/compare",
  "https://www.oremea.com/about/oremea",
  "https://www.oremea.com/cookies",
  "https://www.oremea.com/paia",
  "https://www.oremea.com/party",
  "https://www.oremea.com/party/questions",
  "https://recognition.oremea.com/",
  "https://resonance.oremea.com/",
  "https://compass.oremea.com/",
];
for (const url of criticalPublicUrls) {
  siteRoutes.set(url, [{ file: "critical-public-paths", line: 0 }]);
}

const skipped = [];
const checkedLocal = new Set();
for (const ref of refs) {
  let u;
  try { u = new URL(ref.value, "https://www.oremea.com"); }
  catch { continue; }
  if (!["http:", "https:"].includes(u.protocol)) continue;
  const path = decodeURIComponent(u.pathname).replace(/\/$/, "") || "/";
  const origin = u.hostname.toLowerCase();
  const display = u.origin + u.pathname;
  if (!KNOWN_HOSTS.has(origin)) {
    // Do not send signed/session URLs, or private tokens, to a remote checker.
    if (u.username || u.password || /(?:token|secret|session|key|signature|code)/i.test(u.search)) {
      skipped.push(ref.file + ":" + ref.line + " signed/private URL");
      continue;
    }
    if (u.protocol === "https:" && !/^(localhost|127\.|10\.|192\.168\.|172\.|169\.254\.)/.test(origin)
      && !origin.endsWith(".internal") && !origin.endsWith(".local")) {
      if (!remote.has(display)) remote.set(display, []);
      remote.get(display).push(ref);
    } else {
      skipped.push(ref.file + ":" + ref.line + " nonpublic/unsecured external URL");
    }
    continue;
  }
  if (path.startsWith("/_next/")) continue;
  // Probe public, static route references on their real hosts too; never request private API routes.
  if (isPublicLiveUrl(display) && !path.startsWith("/api/") && !path.startsWith("/internal/") && !path.startsWith("/works/")) {
    if (!siteRoutes.has(display)) siteRoutes.set(display, []);
    siteRoutes.get(display).push(ref);
  }
  if (path.startsWith("/works/")) {
    skipped.push(ref.file + ":" + ref.line + " WORKS separately deployed: " + path);
    continue;
  }
  let localPath = oremeaPath(origin, path);
  if (/\.(?:png|jpe?g|webp|svg|ico|gif|woff2?|ttf|otf|pdf|txt|xml|html|avif|mp4|webm)$/i.test(localPath)) {
    if (publicFiles.has(localPath) || pageExists(localPath)) {
      checkedLocal.add(localPath);
    } else broken.push(ref.file + ":" + ref.line + " missing asset " + localPath);
  } else if (pageExists(localPath)) {
    checkedLocal.add(localPath);
  } else {
    broken.push(ref.file + ":" + ref.line + " missing route " + display + " → " + localPath);
  }
}

async function probe(url) {
  const options = { redirect: "follow", signal: AbortSignal.timeout(12000), headers: { "User-Agent": "OremeaLinkAudit/1.0" } };
  try {
    let response = await fetch(url, { ...options, method: "HEAD" });
    if ([400, 403, 404, 405, 410, 429, 501].includes(response.status)) {
      response = await fetch(url, { ...options, method: "GET", headers: { ...options.headers, Range: "bytes=0-0" } });
      await response.body?.cancel();
    }
    return { status: response.status, final: new URL(response.url).origin + new URL(response.url).pathname };
  } catch (e) {
    return { status: null, reason: e?.cause?.code || e?.name || "unreachable" };
  }
}

if (EXTERNAL) {
  const urls = [...new Set([...remote.keys(), ...siteRoutes.keys()])];
  let cursor = 0;
  const inconclusive = [];
  await Promise.all(Array.from({ length: Math.min(6, urls.length) }, async () => {
    while (cursor < urls.length) {
      const url = urls[cursor++];
      const { status, final, reason } = await probe(url);
      // A public landing page returning 200 only after silently redirecting to
      // sign-in is not a healthy anonymous entry point.
      const finalPath = final ? new URL(final).pathname : "";
      if (criticalPublicUrls.includes(url) && /^\\/sign-(?:in|up)(?:\\/|$)/.test(finalPath)) {
        broken.push("critical-public-paths: unexpected sign-in redirect " + url + " → " + final);
      } else if (status === 404 || status === 410) {
        for (const ref of (remote.get(url) || siteRoutes.get(url) || [])) broken.push(ref.file + ":" + ref.line + " external HTTP " + status + " " + url);
      } else if (status === null || status >= 400) {
        inconclusive.push(url + " " + (status ?? reason));
      } else {
        console.log("External OK " + status + " " + url + (final !== url ? " → " + final : ""));
      }
    }
  }));
  if (inconclusive.length) {
    console.warn("External destinations not verified (auth/rate limit/network/error):");
    inconclusive.sort().forEach(x => console.warn("  " + x));
  }
}

console.log("Link audit: " + sources.length + " code files, " + refs.length + " literal references, " +
  checkedLocal.size + " unique local destinations, " + remote.size + " external destinations, " + siteRoutes.size + " live-site URLs" +
  (EXTERNAL ? " checked" : " (remote HTTP not checked)") + ".");
console.log("Dynamic expressions in " + dynamic.length + " files require rendered/browser checks.");
if (skipped.length) console.log(skipped.length + " private/remote-app destinations were not inspected.");
if (broken.length) {
  console.error(REPORT_ONLY ? "Live references requiring repair/deployment (report-only on PR):" : "Broken references:");
  [...new Set(broken)].sort().forEach(x => console.error("  " + x));
  if (!REPORT_ONLY) process.exitCode = 1;
} else {
  console.log("No confirmed broken literal links in checked scope.");
}
