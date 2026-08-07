import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";

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

function requestHost(req: Request) {
  return (req.headers.get("x-forwarded-host") || req.headers.get("host") || "")
    .split(":")[0]
    .toLowerCase();
}

function isWorksHost(req: Request) {
  const configuredHost = process.env.WORKS_HOST?.trim().toLowerCase();
  const host = requestHost(req);
  return host === "works.oremea.com" || Boolean(configuredHost && host === configuredHost);
}

export default clerkMiddleware((auth, req) => {
  if (isWorksHost(req)) {
    const pathname = req.nextUrl.pathname;

    // WORKS APIs already live at /api/works and should keep that stable path.
    if (pathname.startsWith("/api/works")) {
      return NextResponse.next();
    }

    // Keep the public asset namespace intact (the middleware matcher excludes
    // files with extensions, but this also protects extensionless assets).
    if (pathname.startsWith("/works/") && pathname !== "/works/za") {
      const cleanUrl = req.nextUrl.clone();
      cleanUrl.pathname = pathname.slice("/works".length) || "/";
      return NextResponse.redirect(cleanUrl);
    }

    // The dedicated WORKS service exposes clean subdomain paths while the
    // existing application routes remain under /works internally.
    const internalUrl = req.nextUrl.clone();
    internalUrl.pathname =
      pathname === "/" ? "/works/za" : `/works${pathname}`;
    return NextResponse.rewrite(internalUrl);
  }

  if (!isPublicRoute(req)) {
    auth().protect();
  }
});

export const config = {
  matcher: ["/((?!_next|.*\\..*).*)", "/(api|trpc)(.*)"],
};
