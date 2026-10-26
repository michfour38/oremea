import { NextRequest, NextResponse } from "next/server";

// Compatibility only: Supabase sign-in was retired when Oremea moved to Clerk.
// Do not exchange stale Supabase magic-link codes, resurrect a second session
// provider, or redirect to arbitrary external URLs supplied in email links.
const SAFE_RETURN_PATHS = new Set([
  "/",
  "/dashboard",
  "/profile",
  "/entry",
  "/resonance",
  "/recognition",
  "/compass/access",
  "/key",
  "/key/silver",
]);

function safeLegacyDestination(raw: string | null): string {
  if (!raw || !raw.startsWith("/") || raw.startsWith("//") || raw.includes("\\") ||
      /[\u0000-\u001f\u007f]/.test(raw)) return "/";
  try {
    const parsed = new URL(raw, "https://oremea.invalid");
    if (parsed.origin !== "https://oremea.invalid") return "/";
    return SAFE_RETURN_PATHS.has(parsed.pathname) ? parsed.pathname : "/";
  } catch {
    return "/";
  }
}

export async function GET(request: NextRequest) {
  const incoming = new URL(request.url);
  const destination = safeLegacyDestination(incoming.searchParams.get("redirectTo"));
  const signIn = new URL("/sign-in", incoming.origin);
  signIn.searchParams.set("redirect_url", destination);
  // Use Clerk for verification; a stale Supabase code is never a session.
  return NextResponse.redirect(signIn, 307);
}
