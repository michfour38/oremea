# OREMEA canonical routes and retirement policy

Last reviewed: 2026-10-26. This is a route inventory, **not** permission
to remove a path merely because it is old. Do not create new public routes
to fix an existing sign-in or payment flow; repair the canonical destination.

## Canonical customer entry

| Purpose | Canonical address | Behind the scenes |
|---|---|---|
| Site / offers | `https://www.oremea.com/` and `/explore` | Marketing and cross-product discovery |
| Sign in / sign up | `/sign-in`, `/sign-up` | Clerk, preserving an appropriate local return URL |
| Recognition marketing | `https://recognition.oremea.com/` | Server rewrite to `/recognition/purchase` |
| Recognition use | `https://recognition.oremea.com/begin` | Server rewrite to `/recognition` |
| Compass marketing | `https://compass.oremea.com/` | Server rewrite to `/compass/access` |
| Compass use | `https://compass.oremea.com/begin` | Server rewrite to `/compass` |
| Resonance marketing | `https://resonance.oremea.com/` | Server rewrite to `/resonance/enter` |
| Resonance visits and purchases | `/resonance/visits` and `/resonance/complete` | Signed-in payment journey, owned by provider contracts |
| Resonance room selection | `/entry` | Signed-in, entitlement checked; active run continues at `/resonance` |
| Golden Key | `/key`, `/key/claim/[token]` | Protected dashboard, public invitation landing only |
| Creator Silver Key | `/key/silver`, `/key/silver/claim/[token]` | Protected dashboard, public invitation landing only |
| Support | `/contact` | Public contact form, server-side email |

Paths on product-specific hostnames are intentionally rewritten; these are
**not separate product implementations**. Protected member routes and internal
API endpoints remain real, purpose-specific routes.

## Legacy URLs to preserve as redirects

- `/resonance/creator` → `/resonance/visits`: old creator referral
  links may still be in direct messages. Affiliate cookie logic must continue.
- `/resonance/resume` → `/entry`: historical resume links.
- `/resonance-rooms` → `/resonance/enter`: historical discovery links.
- `/dashboard` → `/resonance`; `/journey` → `/resonance`;
  `/journey/unlock` → `/entry`: old bookmarked locations.
- `/resonance/purchase?week=N`: existing individual room checkout,
  retained while the newer visits funnel is feature-gated.
- `/auth/callback`: retired Supabase callback compatibility endpoint.
  It must **never** authenticate with Supabase or trust unapproved external
  redirect parameters; it returns through Clerk sign-in.

Do not remove these until a documented dependency check confirms that no
paid returns, invitations, bookmarks, provider callbacks, or affiliate links
still rely on them. Preserving a redirect is not duplicating a product.

## Removed obsolete surfaces

- `/protected-test`: old public-facing authenticated debug page that
  displayed an internal user identifier.
- `/resonance/test`: old single-tester page that only redirected home.
- `lib/supabase/browser.ts` and `lib/supabase/server.ts`: empty stubs
  from the retired Supabase identity implementation.

The owner-only product test facility remains at `/internal/product-test`,
with its existing access restrictions. Do not replace it with a public
debug route.

## Changes to shipping standards

1. Use the existing route unless a distinct product capability requires a
   separate customer URL. No duplicate sign-in funnels or new payment pages.
2. Preserve published aliases as **thin redirects**, never copied pages.
3. Recheck the canonical destination and return-to-journey across
   authentication and checkout.
4. Keep a regression test for removed debug surfaces and retained published
   aliases. Green HTTP checks are not equivalent to a completed purchase.
5. Removing an unused package dependency requires an independently verified
   source search and matching lockfile update; do not silently modify payment
   or authentication dependencies.
