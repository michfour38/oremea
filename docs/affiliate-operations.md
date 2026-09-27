# Affiliate operations

Policy lives in `src/lib/oremea/affiliate-policy.ts`. Whop owns actual rewards,
attribution, recurring commissions and payment execution. Oremea's configuration
does not change Whop automatically. An owner rate change requires updating that
policy once and deliberately applying the corresponding Whop settings.

## Owner controls

Use `/admin/affiliates` for policy, provider economics and the Whop dashboard link.
Whop → Affiliates → Set the affiliate commission for a specific user accepts the
named creator's email/username, percentage, recurring/first-payment choice and
approved products. Use the policy's approved creator rate and recurring payments.
Never use a public URL, form field, self-declared role or DAWN recommendation as
creator approval. Standard members inherit the global rate when the member rate
is zero. The Current remains invitation-only and has no affiliate activation.

The affiliate portal is https://whop.com/oremea/affiliates. It now contains the
Oremea external landing link. Each affiliate copies their own generated link.
The owner link must not be distributed as another creator's referral link.

## Attribution

Whop's external link was observed redirecting to the Oremea home page with `a`
set to the affiliate username. A secure HTTP-only session cookie spans Oremea
subdomains and sign-in. Subscription and individual-room Whop links carry `a`;
server-created visit checkout configurations receive `affiliate_code`.
The first order creation fixes the referral; repeated requests cannot overwrite
it. Additional orders retain the original referral for reconciliation.

Whop's current saved-card Payment Create contract does not document an affiliate
parameter. Oremea does not invent one or assume that storing the parent referral
proves the add-on commission. Test provider attribution for a saved-card add-on
before promising commission on that path. Existing charging and fulfilment stay
intact. No external commission engine or payout code is introduced.

## Economics and DAWN

The protected export includes aggregate requested referrals, separately from
confirmed provider attribution. The read-only provider observer samples the
latest 25 successful/refunded visit payments, validates company and USD currency,
and reports actual fee types and amount after fees. It omits customer identifiers.
Missing permissions, incomplete fee pages, currencies or records are unavailable,
not zero. The sample is not an all-product, all-time ledger.

Final retained revenue remains unknown until commission, platform/payment fees,
affiliate-processing fees, tax/remittance, refunds and disputes are reconciled as
non-overlapping amounts. Never deduct estimated commission again from Whop's
amount-after-fees. The economics calculator can accept measured commission and
separate cost amounts; incomplete costs produce no retained-revenue total.

DAWN receives no share, accrual, reserve or transfer of Oremea income. Platform
costs are unrelated to DAWN. Its protected export is observation-only and cannot
approve creators, change rates, activate paid creator arrangements or move funds.

## Verification boundary

Standard product rates and external link were saved in production on 2026-09-27.
Whop displays recurring global rewards and supports named recurring custom offers.
No named creator was approved by this task. Actual standard and creator payment
tests, add-on attribution and reconciled net revenue require a real affiliate
identity and provider transaction evidence. Unit tests are not those live tests.

Official references checked 2026-09-27:
- https://docs.whop.com/affiliates/promote-your-business
- https://docs.whop.com/affiliates/setup-custom
- https://docs.whop.com/api-reference/checkout-configurations/create-checkout-configuration
- https://docs.whop.com/api-reference/payments/create-payment
- https://docs.whop.com/api-reference/payments/list-fees

Rollback: revert the affiliate PR and keep the additive nullable database column;
do not drop purchase data. Restore Whop rates only by a deliberate owner action.
