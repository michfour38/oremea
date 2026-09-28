# Creator referrals

Approved 2026-09-28: standard/open affiliates receive 30%; specifically approved creators receive 40%. Both send customers through the same Oremea purchase paths, plans, and prices. There is no creator-only price, discount, starter product, or first-sale commission override.

The legacy `/resonance/creator` link redirects to the ordinary Resonance visit purchase page. Affiliate attribution is carried through the existing referral cookie and checkout. Whop is the source of truth for actual commission and renewal attribution.

## Owner setup

1. Keep the open rates at 30% on eligible products in Whop.
2. Assign 40% to each explicitly approved creator in Whop, including recurring rewards where supported and intended.
3. Have creators distribute their own external affiliate links into Oremea. Verify an attributed purchase and renewal in Whop before promising their earnings.
4. Test a separate saved-card visit addition and cross-product purchase before claiming those later charges retain the referral.
5. Check refund reversals, fees, settlement timing, and actual spendable balance on a real provider transaction.

The old hidden creator starter catalog, if present from historical use, is read only for settlement and refunds of old orders. The admin provisioner cannot create or sell it.

At 40%, a $50 visit reserves $20 for commission. The conservative model in `src/lib/oremea/creator-acquisition-economics.ts` also reserves stacked provider fees, refund risk, and a 20% contribution. The model is planning data; measured Whop records govern actual economics.
