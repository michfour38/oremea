# WORKS PayFast deployment

WORKS provider billing is implemented as a server-owned PayFast subscription flow. Public plan prices remain canonical in `lib/works/providers/public-plans.ts`; browser input never supplies an amount.

## Railway variables

Set these only on the WORKS/Oremea runtime that serves `works.oremea.com`:

- `PAYFAST_MERCHANT_ID`
- `PAYFAST_MERCHANT_KEY`
- `PAYFAST_PASSPHRASE`
- `PAYFAST_SANDBOX=true` while validating Sandbox, then `false` for live
- `WORKS_PUBLIC_URL=https://works.oremea.com`

Do not commit live values.

## PayFast endpoints owned by WORKS

- checkout creation: `POST /api/works/billing/payfast/checkout`
- ITN receiver: `POST /api/works/billing/payfast/itn`
- subscription state/cancellation: `/api/works/billing/payfast/subscription`

The checkout route requires an authenticated Clerk user who owns the selected WORKS provider. The ITN endpoint is public by necessity but activates access only after signature verification, PayFast source verification, merchant and amount validation, and PayFast server-to-server confirmation.

## Sandbox release check

1. Apply the production migration before serving the new code.
2. Configure Sandbox merchant ID, key and passphrase in Railway.
3. Keep `PAYFAST_SANDBOX=true`.
4. Sign in as a provider owner and open `/provider/billing` on `works.oremea.com`.
5. Start Active or Growth checkout and complete the PayFast Sandbox subscription.
6. Confirm the ITN changes the provider commercial plan only after PayFast confirms the payment.
7. Repeat the same ITN and confirm no duplicate billing event or access mutation occurs.
8. Cancel from the WORKS billing screen and confirm PayFast acknowledges cancellation before WORKS returns the provider to Free.
9. Switch to live merchant credentials and `PAYFAST_SANDBOX=false` only after the Sandbox cycle passes.

## Failure rule

A browser return from PayFast is never proof of payment. WORKS treats the verified ITN as the authority. If signature, source, merchant, amount or server confirmation fails, plan access does not change.
