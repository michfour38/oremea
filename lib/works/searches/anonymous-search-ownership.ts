import type { NextRequest, NextResponse } from "next/server";

const COOKIE_PREFIX = "oremea_works_browser_";
const BROWSER_SESSION_ID =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const COOKIE_MAX_AGE_SECONDS = 60 * 60 * 24 * 180;

function marketKey(marketSlug: string) {
  return marketSlug.trim().toLowerCase().replace(/[^a-z0-9-]/g, "-");
}

export function normalizeWorksBrowserSessionId(value: unknown) {
  if (typeof value !== "string") return null;
  const normalized = value.trim();
  return BROWSER_SESSION_ID.test(normalized) ? normalized : null;
}

export function worksBrowserSessionCookieName(marketSlug: string) {
  return `${COOKIE_PREFIX}${marketKey(marketSlug)}`;
}

export function setWorksBrowserSessionCookie({
  response,
  marketSlug,
  browserSessionId,
}: {
  response: NextResponse;
  marketSlug: string;
  browserSessionId: string;
}) {
  response.cookies.set({
    name: worksBrowserSessionCookieName(marketSlug),
    value: browserSessionId,
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: COOKIE_MAX_AGE_SECONDS,
  });
}

export function ownsWorksAnonymousSearch({
  request,
  marketSlug,
  expectedBrowserSessionId,
}: {
  request: NextRequest;
  marketSlug: string;
  expectedBrowserSessionId: string | null;
}) {
  if (!expectedBrowserSessionId) return false;

  const actual = request.cookies
    .get(worksBrowserSessionCookieName(marketSlug))
    ?.value?.trim();

  return Boolean(actual && actual === expectedBrowserSessionId);
}
