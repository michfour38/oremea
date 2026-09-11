# Resonance visit checkout: staged implementation

This change is a draft until the Whop and PostgreSQL acceptance checks below pass. Both feature flags default to false. It does not deploy a live checkout or create Whop plans.

## Customer flow

1. `/resonance/visits`: select 1, 3, or 4 visits and pay in the embedded Whop checkout. The verified primary Oremea email identifies the buyer. This purchase settles independently.
2. `/resonance/complete?order=…`: offer the additional visits needed to reach ten. “Choose fewer” expands on the same page while the ten-visit offer remains visible. “No thanks” is beneath both. An accepted addition requests one separate saved-method charge; it cannot undo the original purchase.
3. `/entry`: show the unused visit balance and let the member choose any published room. Entering consumes one visit, creates a fresh run, and records its start time. A later entry to the same room is labelled with the next round number. Earlier reflections remain archived. The existing seven-day content progression is preserved; this change does not add a calendar-expiry job.

The initial selection and embedded checkout share one route. The smaller offer is an inline state, not a fourth page. Prices come only from `src/lib/oremea/pricing.ts`; the completion offer is the ten-visit total minus the settled initial amount. Smaller additions use standalone package pricing and exclude packages costing as much as the completion offer for fewer visits. Later purchases start a new order; historic purchases do not accumulate a retroactive discount.

## Configuration and deployment sequence

- Apply `20260910165000_resonance_visit_orders` through the existing migration deployment process before enabling either flag. It creates order and redemption tables; it does not convert historic purchases or delete runs.
- Configure the server-only Whop API key, account ID, visit product ID, plan IDs, and webhook secret in the deployment environment. `.env.example` lists the names. Existing DNS and Namecheap settings need no change.
- Create eight fixed USD standalone plans (quantities 1–8) and three completion plans (`COMPLETE_FROM_1`, `_3`, `_4`). Use one-time billing, no trial, no adaptive pricing, and no membership expiry beginning at purchase. The API preflight rejects incorrect plan amounts, currency, recurring terms, or expiry. Confirm repeat purchases under the same product are supported.
- Subscribe the existing signature-verified webhook endpoint to `payment.succeeded`, `payment.failed`, `payment.canceled`, `refund.created`, and `refund.updated`. Verify the deployed account permissions expose the required product, plan, buyer email, member, payment method, metadata, checkout ID, amount, and account fields. Missing or mismatched fields fail closed and require reconciliation.
- In an isolated test environment, set `RESONANCE_VISITS_ENABLED=true` and `RESONANCE_VISITS_CHECKOUT_ENABLED=true`, then perform the acceptance checks below. Do not enable production sales based only on mocked tests.
- After activation, `RESONANCE_VISITS_CHECKOUT_ENABLED=false` stops new package charges while `RESONANCE_VISITS_ENABLED=true` keeps purchased balances redeemable. Do not disable credit access once customers own visits.

## Required acceptance checks

1. Complete each initial package. Confirm the actual provider amount, order metadata, email, product, plan, saved-method ownership, and webhook payload. Test a declined initial attempt followed by a successful retry.
2. Accept each completion offer and one smaller offer from every initial package. Confirm a separate payment using the original saved method. The final provider charge must equal the amount the button authorizes. Tax and buyer-fee behavior is not yet verified; if amounts vary, implement a final quote/consent step before enabling one-click additions. Do not silently charge undisclosed extras.
3. Exercise a bank verification/3DS requirement, unavailable saved method, declined addition, and an interrupted API response. The draft does not implement a bank-verification continuation or an automatic retry/reconciliation worker. Resolve the exact provider behavior before launch; the UI preserves the original purchase and shows an unconfirmed state instead of claiming success.
4. Test repeated submission in two tabs, duplicate and reordered payment notifications, and reopening/reusing an old checkout configuration. One order accepts one successful payment ID; an unexpected second successful payment is rejected for manual reconciliation rather than creating duplicate credits. Confirm Whop prevents an unintended second charge, or implement provider-level checkout-use control before launch.
5. On PostgreSQL, verify simultaneous room entries create only one active run and deduct only one visit; repeated use of the same request ID returns the same run. Verify the same account lock also serializes legacy room purchases. A failed transaction must leave the balance unchanged.
6. Complete a room, enter it again, and confirm round numbering, start time, balance, and archive. Buy four visits again later and confirm a fresh independent order at the four-pack price.
7. Process full and partial refunds before and after redemption, including refund-before-success delivery. Any successful refund freezes that order's unused balance for manual review; entered rooms and archives remain. Replayed success must never refill refunded or previously used credits. Resolve partial-refund allocation operationally before releasing a freeze.
8. Close Page 2 without accepting anything, or choose “No thanks,” then return to `/entry`. The initial settled visits must remain usable. Verify ownership checks reject another account's order and redemption IDs.

## Local verification and limits

`npm run test:resonance-visits` exercises the pricing ladder, completion totals, separate repeat purchases, payment/refund matching, settlement replay rules, provider request construction, and no-retry behavior. Whop is mocked; these tests do not prove live payment or database concurrency behavior. The new test is included in the existing launch gate.

For environments where the `tsx` CLI cannot open its optional IPC socket, run the same test with `node --import tsx scripts/verify-resonance-visits-contract.ts`. Do not weaken CI gates to accommodate an environment issue.

## Provider references checked during implementation

- [Save payment methods](https://docs.whop.com/developer/guides/save-payment-methods)
- [Create payment](https://docs.whop.com/api-reference/payments/create-payment)
- [Create checkout configuration](https://docs.whop.com/api-reference/checkout-configurations/create-checkout-configuration)
- [Payment succeeded webhook](https://docs.whop.com/api-reference/payments/payment-succeeded)
- [Refund created webhook](https://docs.whop.com/api-reference/refunds/refund-created)
- [Refund updated webhook](https://docs.whop.com/api-reference/refunds/refund-updated)

These are technical API references, not evidence that a particular funnel layout or price converts best. Conversion claims require measured customer behavior.
