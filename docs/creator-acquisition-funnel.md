# Oremea creator acquisition funnel

Status: economics encoded; provider acquisition product not live until the dedicated hidden Whop product + plan are configured and one real attributable sale is verified.

## The model

Oremea is using the direct-response value-ladder principle without fake urgency, fake discounts, invented scarcity or a misleading crossed-out price.

The first sale is an acquisition event. The backend makes the relationship economically valuable.

### Creator traffic

Creator-native content
→ creator-specific Oremea external affiliate link
→ conversational long-form Resonance landing page
→ one $50 Creator Resonance Starter visit
→ creator receives the approved acquisition commission
→ buyer immediately receives what they purchased
→ existing one-time Complete Ten offer / smaller addition
→ Resonance experience
→ later product continuation only when it fits the participant's actual need

### Commission architecture

- Standard/open affiliate: 30%.
- Owner-approved creator acquisition product: target first-sale rate 100%.
- Owner-approved backend: 40%.
- Recognition and Compass remain 40% recurring backend products; they are not 100%-commission acquisition products.
- The 100% rate must NEVER be placed on the normal Resonance catalog. It is isolated to a dedicated hidden acquisition product.

This prevents a creator who sends a single $50 starter buyer from being paid like an ordinary low-value affiliate while also preventing unlimited Recognition/Compass usage from being fully subsidised by Oremea.

## Unit-economics stress case

The code deliberately stress-tests more fees than a normal domestic transaction is likely to incur at once. It reserves public Whop rates checked on 2026-09-28: 2.7% + $0.30 card processing, 1.5% international card, 1% currency conversion, 2% tax service when collected, 1.25% affiliate processing, plus 0.5% recurring billing for subscriptions.

Actual provider records override assumptions; these are planning reserves, not invoices.

### $50 Creator Resonance Starter

Stress case:

- customer payment: $50.00
- creator commission reserve: 100% of gross = $50.00
- stacked provider-fee reserve: $4.53
- refund/dispute reserve: $2.50
- first-visit delivery reserve: $5.00
- maximum planned acquisition investment: $12.03

This is intentionally the harsh case. If Whop calculates the creator percentage after fees, the actual acquisition investment is lower.

### Existing Complete Ten backend after a $50 starter

The existing Resonance ladder already makes the next transaction separate:

- total ten-visit value: $400
- already purchased starter: $50
- separate Complete Ten backend purchase: $350
- creator at 40%: $140 backend commission
- creator earnings across the first two transactions: up to $190 before later recurring products
- after the 40% commission, stacked fee reserve, 5% refund/dispute reserve and 20% Oremea contribution reserve, $92.62 remains as the delivery-cost budget for the remaining nine visits

That is more than $10 per remaining visit before the 20% contribution reserve is touched.

### Recognition and Compass one-month cancellation safety

At 40% creator commission, stacked subscription fee reserve and a 20% Oremea contribution target:

- Recognition at $19.99/month may spend up to $5.90 in delivery cost for that referred member-month before the target contribution reserve is touched.
- Compass at $50/month may spend up to $15.22 in delivery cost for that referred member-month before the target contribution reserve is touched.

Observed AI/delivery cost must be compared with these thresholds. DAWN may surface a review; it may not silently change price, commission or access.

## Funnel rules

1. **Hook:** creator content starts with a recognisable human problem, not Oremea features.
2. **Story / recognition:** the landing page lets the buyer recognise themselves before explaining the product.
3. **Trust:** clearly say what Resonance does and does not do; no diagnosis, guaranteed outcome or invented claim.
4. **Single front-end decision:** one Creator Resonance Starter visit. Do not make creator traffic choose among three packages before the first yes.
5. **Deliver the purchase:** the first visit is secure before any next offer appears.
6. **One-time offer:** the existing Complete Ten screen is the backend OTO. "No thanks" remains easy and visible.
7. **Backend:** 40% creator economics on approved additional purchases and recurring products.
8. **Lifecycle:** after actual participation, route by need rather than forcing Recognition or Compass as generic bumps.
9. **Attribution:** never promise cross-product commission unless the creator attribution for that later checkout can be verified.
10. **Disclosure:** creator promotions must disclose the financial relationship in a clear way appropriate to the channel and applicable law.

## Provider configuration required before launch

Create a dedicated hidden Whop product / hidden one-time pricing option named internally along the lines of `Creator Resonance Starter` at $50. It must be operationally separate from the normal Resonance product so its acquisition commission cannot leak onto package/backend sales.

Set these production variables only after the provider IDs are verified:

- `WHOP_RESONANCE_CREATOR_STARTER_PRODUCT_ID`
- `WHOP_RESONANCE_CREATOR_STARTER_PLAN_ID`

Then configure each owner-approved creator:

- acquisition product: target 100% first-sale rate, if Whop permits the intended rate for the account
- approved backend products: 40%, recurring where relevant

Run one real creator-linked sale end-to-end before opening the offer broadly. Verify attribution, the actual commission basis, Whop fee records, refund reversal behaviour, pending/available timing and final spendable balance.

## Sources checked 2026-09-28

- Whop pricing: https://whop.com/network/pricing/
- Whop affiliate attribution on custom domains: https://docs.whop.com/third-party-integrations/embedded-checkouts/attribute-affiliates-embedded-checkout
- Whop hidden pricing options: https://whop.com/blog/whop-pricing-options/
- Whop affiliate earnings terms: https://whop.com/earnings-terms/

The repository's measured-provider observer remains the source for actual Oremea transactions.
