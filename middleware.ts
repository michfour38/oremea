import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";
import { NextResponse, type NextRequest } from "next/server";

const RECOGNITION_HOST = "recognition.oremea.com";
const COMPASS_HOST = "compass.oremea.com";
const RESONANCE_HOST = "resonance.oremea.com";
const OREMEA_PUBLIC_HOSTS = new Set(["oremea.com", "www.oremea.com"]);

function getHostname(req: NextRequest) {
  const rawHost =
    req.headers.get("x-forwarded-host") || req.headers.get("host") || "";

  return rawHost.split(",")[0].trim().split(":")[0].toLowerCase();
}

function rewriteRecognitionPath(req: NextRequest, pathname: string) {
  const url = req.nextUrl.clone();
  url.pathname = pathname;
  return NextResponse.rewrite(url);
}

function redirectRecognitionPath(req: NextRequest, pathname: string) {
  const url = new URL(`https://${RECOGNITION_HOST}${pathname}`);
  url.search = req.nextUrl.search;
  return NextResponse.redirect(url, 308);
}

function recognitionDomainResponse(req: NextRequest) {
  const host = getHostname(req);
  const { pathname } = req.nextUrl;

  if (host === RECOGNITION_HOST) {
    if (pathname === "/" || pathname === "/purchase") {
      return rewriteRecognitionPath(req, "/recognition/purchase");
    }

    if (pathname === "/begin") {
      return rewriteRecognitionPath(req, "/recognition");
    }

    if (pathname === "/archive") {
      return rewriteRecognitionPath(req, "/recognition/archive");
    }

    if (pathname === "/entry") {
      return NextResponse.redirect("https://resonance.oremea.com", 307);
    }

    if (pathname === "/recognition" || pathname === "/recognition/") {
      return redirectRecognitionPath(req, "/begin");
    }

    if (
      pathname === "/recognition/purchase" ||
      pathname === "/recognition/purchase/"
    ) {
      return redirectRecognitionPath(req, "/");
    }

    if (
      pathname === "/recognition/archive" ||
      pathname === "/recognition/archive/"
    ) {
      return redirectRecognitionPath(req, "/archive");
    }

    return null;
  }

  if (OREMEA_PUBLIC_HOSTS.has(host)) {
    if (pathname === "/recognition" || pathname === "/recognition/") {
      return redirectRecognitionPath(req, "/begin");
    }

    if (
      pathname === "/recognition/purchase" ||
      pathname === "/recognition/purchase/"
    ) {
      return redirectRecognitionPath(req, "/");
    }

    if (
      pathname === "/recognition/archive" ||
      pathname === "/recognition/archive/"
    ) {
      return redirectRecognitionPath(req, "/archive");
    }
  }

  return null;
}

function rewriteCompassPath(req: NextRequest, pathname: string) {
  const url = req.nextUrl.clone();
  url.pathname = pathname;
  return NextResponse.rewrite(url);
}

function redirectCompassPath(req: NextRequest, pathname: string) {
  const url = new URL(`https://${COMPASS_HOST}${pathname}`);
  url.search = req.nextUrl.search;
  return NextResponse.redirect(url, 308);
}

function redirectToHost(req: NextRequest, host: string, pathname: string) {
  const url = new URL(`https://${host}${pathname}`);
  url.search = req.nextUrl.search;
  return NextResponse.redirect(url, 308);
}

function isCompassProtectedPath(req: NextRequest) {
  if (getHostname(req) !== COMPASS_HOST) return false;

  const { pathname } = req.nextUrl;

  return (
    pathname === "/begin" ||
    pathname === "/begin/" ||
    pathname === "/map" ||
    pathname === "/map/" ||
    pathname === "/archive" ||
    pathname === "/archive/" ||
    pathname.startsWith("/archive/") ||
    pathname === "/compass" ||
    pathname === "/compass/" ||
    pathname === "/compass/map" ||
    pathname === "/compass/map/" ||
    pathname === "/compass/archive" ||
    pathname === "/compass/archive/" ||
    pathname.startsWith("/compass/archive/")
  );
}

function compassDomainResponse(req: NextRequest) {
  const host = getHostname(req);
  const { pathname } = req.nextUrl;

  if (host === COMPASS_HOST) {
    if (
      pathname === "/" ||
      pathname === "/access" ||
      pathname === "/access/"
    ) {
      return rewriteCompassPath(req, "/compass/access");
    }

    if (pathname === "/begin" || pathname === "/begin/") {
      return rewriteCompassPath(req, "/compass");
    }

    if (pathname === "/map" || pathname === "/map/") {
      return rewriteCompassPath(req, "/compass/map");
    }

    if (pathname === "/archive" || pathname === "/archive/") {
      return rewriteCompassPath(req, "/compass/archive");
    }

    if (pathname.startsWith("/archive/")) {
      return rewriteCompassPath(req, `/compass${pathname}`);
    }

    if (pathname === "/compass" || pathname === "/compass/") {
      return redirectCompassPath(req, "/begin");
    }

    if (
      pathname === "/compass/access" ||
      pathname === "/compass/access/"
    ) {
      return redirectCompassPath(req, "/");
    }

    if (
      pathname === "/compass/map" ||
      pathname === "/compass/map/"
    ) {
      return redirectCompassPath(req, "/map");
    }

    if (
      pathname === "/compass/archive" ||
      pathname === "/compass/archive/"
    ) {
      return redirectCompassPath(req, "/archive");
    }

    if (pathname.startsWith("/compass/archive/")) {
      return redirectCompassPath(req, pathname.slice("/compass".length));
    }

    if (pathname === "/recognition" || pathname === "/recognition/") {
      return redirectRecognitionPath(req, "/");
    }

    if (
      pathname === "/recognition/archive" ||
      pathname === "/recognition/archive/"
    ) {
      return redirectRecognitionPath(req, "/archive");
    }

    if (
      pathname === "/resonance" ||
      pathname === "/resonance/" ||
      pathname === "/entry" ||
      pathname === "/entry/"
    ) {
      return redirectToHost(req, RESONANCE_HOST, "/");
    }

    if (
      pathname === "/resonance/archive" ||
      pathname === "/resonance/archive/"
    ) {
      return redirectToHost(req, RESONANCE_HOST, "/archive");
    }

    if (
      pathname === "/profile" ||
      pathname === "/compare" ||
      pathname === "/contact"
    ) {
      return redirectToHost(req, "www.oremea.com", pathname);
    }

    return null;
  }

  if (OREMEA_PUBLIC_HOSTS.has(host)) {
    if (
      pathname === "/compass/access" ||
      pathname === "/compass/access/" ||
      pathname === "/compass" ||
      pathname === "/compass/"
    ) {
      return redirectCompassPath(req, "/");
    }

    if (
      pathname === "/compass/map" ||
      pathname === "/compass/map/"
    ) {
      return redirectCompassPath(req, "/map");
    }

    if (
      pathname === "/compass/archive" ||
      pathname === "/compass/archive/"
    ) {
      return redirectCompassPath(req, "/archive");
    }

    if (pathname.startsWith("/compass/archive/")) {
      return redirectCompassPath(req, pathname.slice("/compass".length));
    }
  }

  return null;
}

const isPublicRoute = createRouteMatcher([
  "/",
  "/explore(.*)",
  "/oremea(.*)",
  "/compare(.*)",
  "/contact(.*)",
  "/terms(.*)",
  "/privacy(.*)",
  "/disclaimer(.*)",
  "/refunds(.*)",
  "/conduct(.*)",
  "/sign-in(.*)",
  "/sign-up(.*)",
  "/recognition(.*)",
  "/api/recognition(.*)",
  "/compass/access(.*)",
  // This one-time release endpoint performs its own exact-deployment-SHA and
  // expiry checks. Clerk must let the GitHub release runner reach those checks.
  "/api/admin/resonance-seed-once",
  // WORKS begins anonymously. Public founder search, provider profiles,
  // provider response links and onboarding surfaces must render without
  // Clerk forcing a platform sign-in. Sensitive WORKS APIs enforce their
  // own account/session/token authorization inside each route.
  "/works(.*)",
  "/api/works(.*)",
]);

export default clerkMiddleware((auth, req) => {
  if (isCompassProtectedPath(req)) {
    auth().protect();
  }

  const recognitionResponse = recognitionDomainResponse(req);
  if (recognitionResponse) return recognitionResponse;

  const compassResponse = compassDomainResponse(req);
  if (compassResponse) return compassResponse;

  if (!isPublicRoute(req)) {
    auth().protect();
  }
});

export const config = {
  matcher: ["/((?!_next|.*\\..*).*)", "/(api|trpc)(.*)"],
};
