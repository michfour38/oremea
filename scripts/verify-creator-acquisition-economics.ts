import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";

import { OREMEA_AFFILIATE_POLICY } from "../src/lib/oremea/affiliate-policy";
import {
  CREATOR_ACQUISITION_POLICY,
  creatorAcquisitionStressCase,
  creatorBackendStressCases,
} from "../src/lib/oremea/creator-acquisition-economics";

const firstSale = creatorAcquisitionStressCase();
const backend = creatorBackendStressCases();

assert.equal(CREATOR_ACQUISITION_POLICY.customerPriceCents, 5000);
assert.equal(CREATOR_ACQUISITION_POLICY.creatorFrontEndRate, 0.40);
assert.equal(CREATOR_ACQUISITION_POLICY.creatorBackendRate, 0.40);
assert.equal(CREATOR_ACQUISITION_POLICY.standardAffiliateRate, 0.30);
assert.equal(CREATOR_ACQUISITION_POLICY.dedicatedHiddenProviderProductRequired, false);
assert.equal(CREATOR_ACQUISITION_POLICY.neverApplyFrontEndRateToStandardResonanceCatalog, false);

assert.equal(OREMEA_AFFILIATE_POLICY.standardRate, 0.30);
assert.equal(OREMEA_AFFILIATE_POLICY.approvedCreatorRate, 0.40);
assert.equal(OREMEA_AFFILIATE_POLICY.creatorAcquisition.firstSaleRate, 0.40);
assert.equal(OREMEA_AFFILIATE_POLICY.creatorAcquisition.backendRate, 0.40);
assert.equal(OREMEA_AFFILIATE_POLICY.creatorSpecificDiscount, false);

// A creator-referred first $50 visit must stand on its own economically. There
// is no planned acquisition loss and no assumption that a second purchase will
// rescue the first sale.
assert.equal(firstSale.creatorCommissionCents, 2000);
assert.equal(firstSale.providerFeeReserveCents, 453);
assert.equal(firstSale.refundDisputeReserveCents, 250);
assert.equal(firstSale.deliveryReserveCents, 500);
assert.equal(firstSale.contributionCents, 1797);
assert.equal(firstSale.acquisitionInvestmentCents, 0);

// Customer pricing remains the normal $400 Complete Ten ladder. A buyer who
// starts at $50 can add the remaining nine for $350. At a uniform 40% creator
// rate the creator earns $20 + $140 = $160 across the $400 customer spend.
assert.equal(backend.resonanceCompleteTenFromFirstVisit.priceCents, 35000);
assert.equal(backend.resonanceCompleteTenFromFirstVisit.creatorCommissionCents, 14000);
assert.equal(backend.resonanceCompleteTenFromFirstVisit.creatorEarningsAcrossTenCents, 16000);
assert.equal(backend.resonanceCompleteTenFromFirstVisit.maxDeliveryBudgetCents, 9262);
assert.ok(
  backend.resonanceCompleteTenFromFirstVisit.maxDeliveryBudgetCents /
    backend.resonanceCompleteTenFromFirstVisit.remainingVisits > 1000,
);

assert.equal(backend.recognitionFirstMonth.maxDeliveryBudgetCents, 590);
assert.equal(backend.compassFirstMonth.maxDeliveryBudgetCents, 1522);
assert.ok(backend.recognitionFirstMonth.maxDeliveryBudgetCents > 0);
assert.ok(backend.compassFirstMonth.maxDeliveryBudgetCents > 0);

const admin = fs.readFileSync(
  path.join(process.cwd(), "app/admin/affiliates/page.tsx"),
  "utf8",
);
const provisionAction = fs.readFileSync(
  path.join(process.cwd(), "app/admin/resonance-commerce/actions.ts"),
  "utf8",
);
const creatorLanding = fs.readFileSync(
  path.join(process.cwd(), "app/(marketing)/resonance/creator/page.tsx"),
  "utf8",
);
const purchaseActions = fs.readFileSync(
  path.join(process.cwd(), "app/(member)/resonance/visits/actions.ts"),
  "utf8",
);
const visitOrders = fs.readFileSync(
  path.join(process.cwd(), "src/lib/resonance/visit-orders.ts"),
  "utf8",
);
const middleware = fs.readFileSync(
  path.join(process.cwd(), "middleware.ts"),
  "utf8",
);

// The creator landing remains an attribution-friendly invitation, but checkout
// must use the normal Resonance product and central price. No active UI or admin
// action may create/provision the retired hidden starter offer.
assert.match(creatorLanding, /purchaseVisits/);
assert.match(creatorLanding, /OREMEA_PRICING\.resonance\.visitPricesCents\[1\]/);
assert.match(creatorLanding, /name="quantity" value="1"/);
assert.match(creatorLanding, /same Resonance price as every other customer/i);
assert.doesNotMatch(creatorLanding, /purchaseCreatorStarter/);
assert.doesNotMatch(creatorLanding, /creatorStarterEligibility/);
assert.doesNotMatch(creatorLanding, /CREATOR_ACQUISITION_POLICY/);
assert.doesNotMatch(purchaseActions, /purchaseCreatorStarter/);
assert.doesNotMatch(purchaseActions, /startCreatorStarterPurchase/);
assert.match(provisionAction, /provisionResonanceWhopCatalog\(\)/);
assert.doesNotMatch(provisionAction, /provisionCreatorStarterWhopCatalog/);

// Historical hidden-starter provider records may still be recognized by the
// webhook settlement matcher, but they cannot be a new-sale path.
assert.match(visitOrders, /loadCreatorStarterWhopCatalog/);
assert.match(visitOrders, /starter\?\.planId === planId/);
assert.match(visitOrders, /applyVisitPaymentEvent/);
assert.match(visitOrders, /applyVisitRefundEvent/);

assert.match(admin, /Standard\/open affiliates/);
assert.match(admin, /Specifically approved creators/);
assert.match(admin, /no creator-only discount and no 100% first-sale offer/i);
assert.match(admin, /Remove any 100% first-sale override/i);
assert.match(middleware, /"\/resonance\/creator\(\.\*\)"/);

console.log("Creator economics unified: normal customer pricing, 30% standard affiliates, 40% approved creators, no 100% first-sale path.");
