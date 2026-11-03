# OREMEA partner experiences — additive design

This is the initial configuration-first foundation. It does **not** provision Whop listings, charge customers, create entitlements, or connect accounts to SUSTAIN.

## One source of truth, existing contracts retained

- All indicative partner package quotes and standalone product pricing: `src/lib/oremea/pricing.ts`. The original `OREMEA_PRICING` entries are unchanged; temporary amounts are in the separate `OREMEA_PARTNER_PRICING` export.
- Existing affiliate policy and settlement: `src/lib/oremea/affiliate-policy.ts` and Whop (unchanged).
- Additional partner **presentation, draft offers, branding and intended product composition**: `src/lib/oremea/partner-experiences.ts`.
- Shared future partner route: `app/partner/[slug]/page.tsx`. It returns 404 until an authorised, provider-verified offer and partner are published. No checkout is available for Angela today.
- Actual subscriptions, transaction history and entitlements must remain in the existing provider/database records. Never trust the marketing configuration as a payment/access grant.

`pricing.ts` remains authoritative for independent OREMEA products; partner config references it rather than copying its prices. No existing Whop IDs, checkout links, product routes, or purchases have been changed.

## Angela — draft only

1. One month: SUSTAIN + Recognition.
2. Three months: SUSTAIN + Recognition + Compass.
3. Four months: currently the same confirmed product keys with expansion pending. Further products are not offered until functional, reviewed and explicitly enabled.

These are **programme durations**, not verified monthly charges. The previously discussed figures are now stored **only** as indicative whole-programme amounts in `src/lib/oremea/pricing.ts` under `OREMEA_PARTNER_PRICING`. Do not repeat numerical quotes in other configuration files, pages or documentation. The three draft records deliberately set `approvedMonthlyChargeCents: null` and `approvedOneOffChargeCents: null`. Angela still needs to confirm the per-month charge, full-term price, renewal schedule, fees and refund policy **before** adding a checkout. Monthly recurring subscriptions are the preference for new packages; standalone one-off options remain separately marketable without changing existing plans.

Partner commission preference is the existing 70% approved-creator rate. Whop remains the execution and payout authority; no commission can be promised as configured until the provider plan and payment tests confirm it. No cap is proposed.

The initial colours and copy are placeholders until Angela approves assets and wording. The optional `backgroundAssetPath` and room images must use validated local public assets; external URLs and raw CSS are not accepted. Angela defaults to the existing OREMEA Resonance artwork unless she chooses otherwise.

## Phase 2: feature-gated OREMEA membership ledger

This PR also adds the **OREMEA-only** partner membership ledger, its additive SQL migration and contract tests. All runtime lookups and webhook handling are disabled unless `OREMEA_PARTNER_ACCESS_ENABLED=true` is deliberately configured. The default is **off**, and Angela still has no published product+plan IDs.

- `prisma/schema/partner-memberships.prisma` and the corresponding migration store each Whop partner membership separately from independent OREMEA purchases.
- `src/lib/oremea/partner-membership-contract.ts` rejects unknown, ambiguous, one-off, draft or unfinished plans.
- `src/lib/oremea/partner-memberships.ts` handles dated subscription membership events, preserves event order and refuses open-ended active periods. Product access expires at the provider renewal-period end.
- The existing signed Whop webhook contains an additional, feature-gated branch. Unknown plans keep the current unfulfilled behaviour; known direct product paths retain precedence.
- Recognition and Compass get **fallback** partner access only when stronger independent entitlements are unavailable. Ending a partner membership cannot revoke an independent purchase.
- SUSTAIN is not in the OREMEA access gate, even when it is displayed as a bundle inclusion. Its product entitlement and consent integration must be developed through a separately agreed contract with the SUSTAIN workstream.
- Resonance is deliberately not opened via a generic membership flag: its visit/room-credit accounting needs a separately tested integration.

Do not turn the flag on merely because the migration has deployed. Provider plan configuration, account linking, checkout timing, refund and plan-change behaviour, and end-to-end permission tests are still prerequisites. In particular, a provider membership without a finite `renewal_period_end` is rejected for reconciliation instead of granting indefinite access.

## Phase 3: scoped colours and backgrounds

The existing `app/oremea-colors.css` remains the original OREMEA root palette (including `#cda434`). Partner visual overrides are **scoped**, not global:

- `src/lib/oremea/partner-theme.ts` converts partner brand settings to a small, safe group of CSS custom properties and limits images to approved local `/partner-assets/<partner>/...` paths.
- `app/partner-theme.css` derives product accents, text colours, panel colours and background images from those properties without modifying `:root`.
- `components/oremea/PartnerProductThemeScope.tsx` checks the signed-in customer's active, unexpired partner membership before choosing an appearance. It does not confer access.
- `app/recognition/layout.tsx`, Resonance member layouts and the room chooser use an authenticated partner theme wrapper. Partner-specific styling cannot change payment or access.
- Compass deliberately retains its existing logo and photographic backgrounds. `components/compass/CompassAppearance.tsx` adds an independent visitor-controlled light/dark option. Partner backgrounds do not replace Compass artwork.
- Resonance's `resonanceScenes.mode` controls backgrounds via `src/lib/resonance/resonance-backgrounds.ts`: `original` (default — OREMEA room paintings), `custom` (optional partner uploads for any individual rooms; missing scenes fall back to the originals), or `plain` (no room artwork). A partner does not have to produce replacement artwork to offer the journey.
- `app/partner/[slug]/page.tsx` uses the exact same background styling helper as the product layouts.

Angela's `backgroundAssetPath` is still null until an actual approved image is supplied. Her colours are placeholders. The draft launch remains blocked. Users without a verified matching membership see OREMEA's original design. A user subscribed to two different approved partners receives neutral OREMEA styling to avoid confusing branding.

The version-controlled partner registry remains the public source of truth. A private draft editor now exists for permitted partner accounts; no draft appearance is automatically published.

This completes shared **theme plumbing**, not full unbranded white-labelling. The domain, product copy, emails, icons, metadata, individual Compass component decorations, and several legacy page-specific styles still refer to OREMEA or fixed values. They need an accessibility and product-by-product audit before any partner experience can be called completely white-label. SUSTAIN remains untouched by this workstream.

## Phase 4: initial private appearance preview (superseded by saveable draft editor)

The first preview at `/admin/partner-appearance` was a local visual rehearsal. It now supports private, versioned Save and Upload operations as described in Phase 5. It still does not publish or alter live customer themes.

The admin home links to the private editor; contract checks verify authorised access and the separation from public product access. Real partner-editable persistence would require a secure admin-only write action, authorisation and asset upload flow, audit trail, and a decided override precedence between the database and version-controlled partner configuration.

## Phase 5: saved appearance drafts, approved editor access, and private uploads

The appearance editor is now **saveable**, while remaining isolated from live branding, product access and commerce:

- `/admin/partner-appearance`: owner/admin appearance editor with Save and Upload controls.
- `/admin/partner-appearance/editors`: grant/revoke an appearance editor by an existing verified Clerk user ID. Admin permission is required; grants are scoped to one partner slug.
- `/partner/studio/[slug]`: private partner editor page. A signed-in account must have an active, unrevoked grant for that exact partner (or be an OREMEA admin); otherwise the route is concealed.
- `GET/PUT /api/partner-appearance/[slug]`: permission-checked draft retrieval and optimistic-lock updates. Revision conflicts return HTTP 409; new saves do not silently overwrite another editor's changes.
- `POST /api/partner-appearance/[slug]/assets`: same-origin authenticated uploads. Only genuine PNG, JPEG, WebP files up to 1.5 MB are accepted; at most 28 images may be retained per partner. Duplicates are identified by SHA-256.
- `/partner-assets/[slug]/[filename]`: private image serving only to a permitted editor or admin. Unpublished images are never served publicly.
- New additive PostgreSQL tables: `oremea_partner_appearances` (draft JSON, version and editor), `oremea_partner_appearance_editors` (revocable grants) and `oremea_partner_appearance_assets` (private image bytes). A database migration is required before this editor can be used on a deployed branch.

Only canonical hexadecimal colours, the three accepted Resonance modes, bounded scene numbers and uploaded images belonging to the same partner may be saved. Unknown or cross-partner image paths are rejected. The original OREMEA background images are preserved; setting `original`, `custom` or `plain` remains optional. Custom means only selected scenes use supplied imagery; missing scenes retain the original.

**Saving is not publishing.** Runtime partner product pages still use the reviewed version-controlled configuration and independently verified subscriptions. No draft is automatically pushed to customers, including if a partner editor saves custom artwork. Before publication, an explicit admin approval/release step must be built, together with appropriate public image-serving rules and image metadata stripping. Current uploads are private drafts, so embedded photographic metadata is not shared publicly.

This design deliberately avoids new storage vendor credentials by retaining small files in Railway PostgreSQL. Storage caps, retention/deletion, processing and costs should be reviewed before expanding beyond the pilot.

## Required before activating any offer

1. Confirm Angela's price per billing cycle and whether the 3-/4-month programmes are minimum terms or purely suggested durations.
2. Create **additional** Whop products/plans. Keep existing independent listings and affiliate flows intact. Verify the IDs, checkout URLs, recurrence, cancellation rules, commission and real provider webhook receipts.
3. Review the feature-gated paid-entitlement foundation and complete any remaining provider lifecycle work: refunds, retries, subscription plan changes, account creation before checkout, event delivery monitoring, and independent entitlement overlap. Never grant access on the basis of a URL or partner slug.
4. Add a consent-controlled SUSTAIN↔OREMEA identity bridge only after agreeing the API contract with the other workstream. Do not modify SUSTAIN here. SUSTAIN and OREMEA accounts are currently separate; purchase/access does not itself permit private data sharing.
5. Verify private reflections, household and child data cannot leak to facilitators or analytics.
6. Confirm product readiness (Harmonize is explicitly excluded). Do not claim ten further products are available before their real product keys, access rules and tests exist.
7. Review and approve the partner theme, texts, accessibility and publication state. Publish only after end-to-end payment and authorisation checks.

## Safety boundaries

- Never edit the SUSTAIN repository from this workstream; it is under concurrent development.
- Never bypass Recognition, Compass, Resonance or other existing access guards.
- The new page is display-only, with independently verified Whop links once published.
- Draft and expansion-pending offers are filtered out, and unapproved partners return 404.
- No customer data, live prices, secrets, production configuration or Whop state are modified.

Run `npm run test:partner-experiences`, `npm run test:partner-memberships`, `npm run test:partner-theme`, `npm run test:partner-appearance-preview`, `npm run test:partner-appearance-storage`, `npm run test:central-pricing`, `npm run test:affiliates`, `npm run test:public-pricing`, `npm run test:participant-security`, `npm run typecheck`, and the normal launch suite before merging.

## Scaling pattern

One shared UI route consumes an entry in the central partner registry. To introduce a new partner: add a reviewed brand configuration and draft offers, map intended products to the existing engines, verify new checkout/entitlement routes, then publish. Do not fork a product or copy standalone pricing logic.
