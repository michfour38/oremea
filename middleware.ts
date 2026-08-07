import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";
import { NextResponse, type NextRequest } from "next/server";

const RECOGNITION_HOST = "recognition.oremea.com";
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
  "/compass/access",
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
  const domainResponse = recognitionDomainResponse(req);
  if (domainResponse) return domainResponse;

  if (!isPublicRoute(req)) {
    auth().protect();
  }
});

export const config = {
  matcher: ["/((?!_next|.*\\..*).*)", "/(api|trpc)(.*)"],
};
