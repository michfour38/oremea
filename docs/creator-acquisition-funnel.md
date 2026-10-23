# Creator referrals

Updated 2026-10-23: eligible standard/open affiliates and specifically approved creators are both targeted for 70%; this supersedes the 2026-09-28 30%/40% acquisition policy. Both send customers through the same Oremea purchase paths, plans, and prices. There is no creator-only price, discount, starter product, or first-sale commission override.

The legacy `/resonance/creator` link redirects to the ordinary Resonance visit purchase page. Affiliate attribution is carried through the existing referral cookie and checkout. Whop is the source of truth for actual commission and renewal attribution.

## Owner setup

1. Set the open rates to 70% on eligible products in Whop, without opening invitation-only or otherwise hidden products.
2. Audit member rates and all historical named custom deals: replace old 40% overrides with 70% where eligible. Preserve recurring rewards as previously chosen; make no separate creator-only pricing.
3. Have creators distribute their own external affiliate links into Oremea. Verify an attributed purchase and renewal in Whop before promising their earnings.
4. Test a separate saved-card visit addition and cross-product purchase before claiming those later charges retain the referral.
5. Check refund reversals, fees, settlement timing, and actual spendable balance on a real provider transaction.

The old hidden creator starter catalog, if present from historical use, is read only for settlement and refunds of old orders. The admin provisioner cannot create or sell it.

At 70%, a $50 visit reserves $35 for commission. The conservative delivery budget for the $50 visit and Recognition is $0 after fee, risk and contribution reserves, so owner review of observed provider economics is essential before activation. The conservative model in `src/lib/oremea/creator-acquisition-economics.ts` also reserves stacked provider fees, refund risk, and a 20% contribution. The model is planning data; measured Whop records govern actual economics.
