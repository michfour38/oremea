import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";

const isPublicRoute = createRouteMatcher([
  "/",
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

  "/entry-mirror(.*)",
  "/api/entry-mirror(.*)",
]);

export default clerkMiddleware((auth, req) => {
  if (!isPublicRoute(req)) {
    auth().protect();
  }
});

export const config = {
  matcher: ["/((?!_next|.*\\..*).*)", "/(api|trpc)(.*)"],
};