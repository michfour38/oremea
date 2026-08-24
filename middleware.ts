import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";
import { NextResponse, type NextRequest } from "next/server";

const RECOGNITION_HOST = "recognition.oremea.com";
const COMPASS_HOST = "compass.oremea.com";
const RESONANCE_HOST = "resonance.oremea.com";
const APP_HOST = "app.oremea.com";
const WORKS_HOST = (process.env.WORKS_HOST || "works.oremea.com")
  .trim()
  .toLowerCase();
const OREMEA_PUBLIC_HOSTS = new Set(["oremea.com", "www.oremea.com"]);

function getHostname(req: NextRequest) {
  const rawHost =
    req.headers.get("x-forwarded-host") || req.headers.get("host") || "";

  return rawHost.split(",")[0].trim().split(":")[0].toLowerCase();
}

function worksDomainResponse(req: NextRequest) {
  if (getHostname(req) !== WORKS_HOST) return null;

  const { pathname } = req.nextUrl;

  // WORKS APIs already live at /api/works and keep that stable path.
  if (pathname.startsWith("/api/works")) {
    return NextResponse.next();
  }

  // Existing /works links remain valid, but the dedicated host exposes clean paths.
  if (pathname === "/works" || pathname.startsWith("/works/")) {
    const cleanUrl = req.nextUrl.clone();
    cleanUrl.pathname = pathname.slice("/works".length) || "/";
    return NextResponse.redirect(cleanUrl, 308);
  }

  const internalUrl = req.nextUrl.clone();
  internalUrl.pathname = pathname === "/" ? "/works/za" : `/works${pathname}`;
  return NextResponse.rewrite(internalUrl);
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

function rewriteResonancePath(req: NextRequest, pathname: string) {
  const url = req.nextUrl.clone();
  url.pathname = pathname;
  return NextResponse.rewrite(url);
}

function redirectResonancePath(req: NextRequest, pathname: string) {
  const url = new URL(`https://${RESONANCE_HOST}${pathname}`);
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

function resonanceDomainResponse(req: NextRequest) {
  const host = getHostname(req);
  const { pathname } = req.nextUrl;

  // On the Resonance host, /entry is the actual destination after a visit
  // completes. Let it render directly instead of bouncing it through / and
  // back into an internal /entry rewrite.
  if (host === RESONANCE_HOST) {
    return null;
  }

  if (host === APP_HOST) {
    if (pathname === "/entry" || pathname === "/entry/") {
      return redirectResonancePath(req, "/");
    }

    if (pathname === "/resonance" || pathname.startsWith("/resonance/")) {
      return redirectResonancePath(req, pathname);
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
      pathname === "/contact" ||
      pathname === "/reviews" ||
      pathname.startsWith("/reviews/")
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
  "/api/contact",
  "/reviews(.*)",
  "/api/reviews/submit",
  "/terms(.*)",
  "/privacy(.*)",
  "/disclaimer(.*)",
  "/refunds(.*)",
  "/conduct(.*)",
  "/sign-in(.*)",
  "/sign-up(.*)",
  "/recognition(.*)",
  "/api/recognition(.*)",
  "/api/webhooks/whop",
  "/compass/access(.*)",
  // WORKS begins anonymously. Public founder search, provider profiles,
  // provider response links and onboarding surfaces must render without
  // Clerk forcing a platform sign-in. Sensitive WORKS APIs enforce their
  // own account/session/token authorization inside each route.
  "/works(.*)",
  "/api/works(.*)",
]);

export default clerkMiddleware(async (auth, req) => {
  if (isCompassProtectedPath(req)) {
    await auth.protect();
  }

  const worksResponse = worksDomainResponse(req);
  if (worksResponse) return worksResponse;

  const host = getHostname(req);
  const { pathname } = req.nextUrl;

  if (host === RESONANCE_HOST && pathname === "/") {
    await auth.protect();
    return rewriteResonancePath(req, "/entry");
  }

  const resonanceResponse = resonanceDomainResponse(req);
  if (resonanceResponse) return resonanceResponse;

  const recognitionResponse = recognitionDomainResponse(req);
  if (recognitionResponse) return recognitionResponse;

  const compassResponse = compassDomainResponse(req);
  if (compassResponse) return compassResponse;

  if (!isPublicRoute(req)) {
    await auth.protect();
  }
});

export const config = {
  matcher: ["/((?!_next|.*\\..*).*)", "/(api|trpc)(.*)"],
};
