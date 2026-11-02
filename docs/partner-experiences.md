# OREMEA partner experiences — additive design

This is the initial configuration-first foundation. It does **not** provision Whop listings, charge customers, create entitlements, or connect accounts to SUSTAIN.

## One source of truth, existing contracts retained

- Standalone USD product pricing: `src/lib/oremea/pricing.ts` (unchanged).
- Existing affiliate policy and settlement: `src/lib/oremea/affiliate-policy.ts` and Whop (unchanged).
- Additional partner **presentation, draft offers, branding and intended product composition**: `src/lib/oremea/partner-experiences.ts`.
- Shared future partner route: `app/partner/[slug]/page.tsx`. It returns 404 until an authorised, provider-verified offer and partner are published. No checkout is available for Angela today.
- Actual subscriptions, transaction history and entitlements must remain in the existing provider/database records. Never trust the marketing configuration as a payment/access grant.

`pricing.ts` remains authoritative for independent OREMEA products; partner config references it rather than copying its prices. No existing Whop IDs, checkout links, product routes, or purchases have been changed.

## Angela — draft only

1. One month: SUSTAIN + Recognition.
2. Three months: SUSTAIN + Recognition + Compass.
3. Four months: currently the same confirmed product keys with expansion pending. Further products are not offered until functional, reviewed and explicitly enabled.

These are **programme durations**, not verified monthly charges. Existing verbal amounts (R399 / R1,450 / R1,999) require confirmation of monthly charge, full-term price, renewal schedule, fees and refund policy **before** adding a checkout. Do not publish while that is unresolved. Monthly recurring subscriptions are the preference for new packages; standalone one-off options remain separately marketable without changing existing plans.

Partner commission preference is the existing 70% approved-creator rate. Whop remains the execution and payout authority; no commission can be promised as configured until the provider plan and payment tests confirm it. No cap is proposed.

The initial colours and copy are placeholders until Angela approves assets and wording. The `backgroundAssetPath` is a local public asset path, not an external URL.

## Required before activating any offer

1. Confirm Angela's price per billing cycle and whether the 3-/4-month programmes are minimum terms or purely suggested durations.
2. Create **additional** Whop products/plans. Keep existing independent listings and affiliate flows intact. Verify the IDs, checkout URLs, recurrence, cancellation rules, commission and real provider webhook receipts.
3. Build a verified, additive paid-entitlement integration: Whop event -> durable membership record -> authorised product access. Handle event ordering, refunds, retries, expired plans, duplicate events and overlapping standalone entitlements. Never grant access on the basis of a URL or partner slug.
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

Run `npm run test:partner-experiences`, `npm run test:central-pricing`, `npm run test:affiliates`, `npm run test:public-pricing`, `npm run test:participant-security`, `npm run typecheck`, and the normal launch suite before merging.

## Scaling pattern

One shared UI route consumes an entry in the central partner registry. To introduce a new partner: add a reviewed brand configuration and draft offers, map intended products to the existing engines, verify new checkout/entitlement routes, then publish. Do not fork a product or copy standalone pricing logic.
