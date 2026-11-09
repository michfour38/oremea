# SUSTAIN → Oremea connection rollout

## Technical implementation

Three independently consented SUSTAIN links are added for Recognition, Compass and Resonance

- SUSTAIN API PR #70 adds encrypted account-private references, short-lived one-time pairing and revocable, product-specific grants, stacked on the account Appearance PR #68
- SUSTAIN web PR #71 adds the Today connection controls, a personal reference editor and a strict browser proxy allowlist, stacked on web PR #69
- Oremea PR #304 adds a separate Clerk-authenticated confirmation page, product entitlement checks and private reference readers in Recognition, Compass and Resonance

All purchase eligibility remains defined by existing Oremea policies — the link never grants paid access

Recognition receives explicitly approved SUSTAIN references as untrusted, optional chat context, not a new Recognition message or an evidence quote

Compass receives approved references as optional Mirror context, without rewriting or reducing the seven Why layers

Resonance displays approved references privately without importing them into shared rooms, reflection submissions or the Mirror

## Railway services and deployment watch patterns

The production Oremea Railway project has **four separate Next.js services** on the same `michfour38/oremea` source branch `main`

| Service | Domain | Existing source watch pattern |
| --- | --- | --- |
| oremea | `oremea.com` | all application code |
| recognition | `recognition.oremea.com` | recognition-specific `app` / `src/lib/recognition` |
| Compass | `compass.oremea.com` | Compass-specific `app` / `src/lib/compass` |
| resonance | `resonance.oremea.com` | Resonance-specific `app` / `src/lib/resonance` |

**Before deploying production:** include `/src/lib/integrations/**` in the Recognition, Compass and Resonance Railway build watch patterns to make future security and compatibility updates of the shared connection library deploy reliably

The new Oremea account-link callback lives on `oremea.com` under `/integrations/sustain/connect` and `/api/integrations/sustain/connect`

Individual product services need production verification after the main branch merge — a green main Oremea deployment alone does not confirm all four services have taken up the shared integration

## Secrets and protected data

SUSTAIN API:
- `SUSTAIN_OREMEA_BRIDGE_SECRET`: high-entropy 32+ character server-only value
- `SUSTAIN_OREMEA_REFERENCE_KEY`: stable, backup-preserved, 32 random bytes in standard padded base64

Oremea main and product services where needed:
- `SUSTAIN_OREMEA_BRIDGE_SECRET`: identical bridge secret
- `SUSTAIN_BRIDGE_URL`: reviewed HTTPS origin of production SUSTAIN API

No env values should be added to committed code or browser-visible `NEXT_PUBLIC_` / `EXPO_PUBLIC_` variables

Missing secrets fail closed — the product must not report the link as live or silently grant anything

## Required production check

1. Take a restorable SUSTAIN database backup and validate the Prisma migration on a disposable copy first
2. Deploy the SUSTAIN API schema and code before enabling a web button
3. Configure the same shared secret on both servers and preserve the independent SUSTAIN reference encryption key
4. Update Railway watch patterns on each Oremea product service
5. Confirm a signed-in entitled Oremea account can link the **correct** SUSTAIN account for Recognition, Compass and an active Resonance journey
6. Confirm users without active entitlements cannot link or obtain access
7. Confirm an unconnected Oremea account or wrong-product link cannot fetch references, even if another product is connected
8. Confirm unlinking and removal end future reference reads, that old responses are not described as erased, and that no household Capture, Finance or other person's content is exported
9. Validate expiry, replay and account switching in actual browsers on desktop and mobile
10. Enable the UI only when both SUSTAIN and Oremea production endpoints have passed real HTTPS checks

## Package billing is a separate gate

Do not assume a SUSTAIN household subscription or an Angela bundle grants Recognition, Compass or Resonance until the **exact approved package IDs and included Oremea product entitlements** are connected through the verified purchase and cancellation lifecycle

Use the existing central pricing catalog rather than hard-coding subscriptions into this integration

The current product is opt-in **account linking and manual sharing**, not one-click export of previously saved household memory

Existing Capture authorship and household permission boundaries must be completed before considering per-record sharing
