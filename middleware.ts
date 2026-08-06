import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";

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
  if (!isPublicRoute(req)) {
    auth().protect();
  }
});

export const config = {
  matcher: ["/((?!_next|.*\\..*).*)", "/(api|trpc)(.*)"],
};