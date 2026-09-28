import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";

import { OREMEA_AFFILIATE_POLICY } from "../src/lib/oremea/affiliate-policy";
import {
  CREATOR_ACQUISITION_POLICY,
  creatorAcquisitionStressCase,
  creatorBackendStressCases,
} from "../src/lib/oremea/creator-acquisition-economics";

const acquisition = creatorAcquisitionStressCase();
const backend = creatorBackendStressCases();

assert.equal(CREATOR_ACQUISITION_POLICY.customerPriceCents, 5000);
assert.equal(CREATOR_ACQUISITION_POLICY.creatorFrontEndRate, 1);
assert.equal(CREATOR_ACQUISITION_POLICY.creatorBackendRate, 0.40);
assert.equal(CREATOR_ACQUISITION_POLICY.standardAffiliateRate, 0.30);
assert.equal(CREATOR_ACQUISITION_POLICY.dedicatedHiddenProviderProductRequired, true);
assert.equal(CREATOR_ACQUISITION_POLICY.neverApplyFrontEndRateToStandardResonanceCatalog, true);

assert.equal(OREMEA_AFFILIATE_POLICY.approvedCreatorRate, 0.40);
assert.equal(OREMEA_AFFILIATE_POLICY.creatorAcquisition.firstSaleRate, 1);
assert.equal(OREMEA_AFFILIATE_POLICY.creatorAcquisition.backendRate, 0.40);
assert.equal(
  OREMEA_AFFILIATE_POLICY.creatorAcquisition.neverApplyFirstSaleRateToStandardResonanceCatalog,
  true,
);

// Stress case assumes the creator commission is calculated on gross, stacks the
// public provider fee reserves, reserves 5% for refunds/disputes and $5 for the
// bounded first Resonance visit. The resulting planned acquisition investment
// must remain below $15/customer before this policy can ship.
assert.equal(acquisition.providerFeeReserveCents, 453);
assert.equal(acquisition.refundDisputeReserveCents, 250);
assert.equal(acquisition.deliveryReserveCents, 500);
assert.equal(acquisition.acquisitionInvestmentCents, 1203);
assert.ok(acquisition.acquisitionInvestmentCents <= 1500);

// Existing Resonance post-purchase funnel can move a $50 starter buyer to the
// $400 ten-visit total with a separate $350 backend purchase. At 40% backend
// commission the creator can reach $190 across those two sales, while the $350
// backend still leaves >$92 for nine visits' delivery after a 20% contribution
// reserve, stacked fee reserve and 5% refund/dispute reserve.
assert.equal(backend.resonanceCompleteTenFromStarter.priceCents, 35000);
assert.equal(backend.resonanceCompleteTenFromStarter.creatorCommissionCents, 14000);
assert.equal(backend.resonanceCompleteTenFromStarter.creatorEarningsIncludingStarterCents, 19000);
assert.equal(backend.resonanceCompleteTenFromStarter.maxDeliveryBudgetCents, 9262);
assert.ok(
  backend.resonanceCompleteTenFromStarter.maxDeliveryBudgetCents /
    backend.resonanceCompleteTenFromStarter.remainingVisits > 1000,
);

// Even if a referred subscription cancels after month one, 40% recurring
// commission must leave a positive delivery budget AND a 20% contribution
// reserve under the same conservative provider-fee stress model.
assert.equal(backend.recognitionFirstMonth.maxDeliveryBudgetCents, 590);
assert.equal(backend.compassFirstMonth.maxDeliveryBudgetCents, 1522);
assert.ok(backend.recognitionFirstMonth.maxDeliveryBudgetCents > 0);
assert.ok(backend.compassFirstMonth.maxDeliveryBudgetCents > 0);

const admin = fs.readFileSync(
  path.join(process.cwd(), "app/admin/affiliates/page.tsx"),
  "utf8",
);
const starterCatalog = fs.readFileSync(
  path.join(process.cwd(), "src/lib/whop/creator-starter-catalog.ts"),
  "utf8",
);
const normalCatalog = fs.readFileSync(
  path.join(process.cwd(), "src/lib/whop/resonance-catalog.ts"),
  "utf8",
);
const provisionAction = fs.readFileSync(
  path.join(process.cwd(), "app/admin/resonance-commerce/actions.ts"),
  "utf8",
);

assert.match(starterCatalog, /resonance-creator-starter-v1/);
assert.match(starterCatalog, /Creator Resonance Starter/);
assert.match(starterCatalog, /visibility:\s*"hidden"/);
assert.match(starterCatalog, /global_affiliate_status:\s*"disabled"/);
assert.match(starterCatalog, /member_affiliate_status:\s*"disabled"/);
assert.match(starterCatalog, /CREATOR_ACQUISITION_POLICY\.customerPriceCents/);
assert.doesNotMatch(starterCatalog, /RESONANCE_WHOP_CATALOG_KEY/);
assert.match(normalCatalog, /resonance-visits-v1/);
assert.match(provisionAction, /provisionResonanceWhopCatalog\(\)/);
assert.match(provisionAction, /provisionCreatorStarterWhopCatalog\(\)/);
assert.match(admin, /dedicated acquisition product only/i);
assert.match(admin, /never set the normal Resonance product\/catalog/i);
assert.match(admin, /one real attributable starter purchase/i);
assert.match(admin, /separate real backend\/add-on attribution test/i);

console.log("Creator acquisition economics and isolation contract verified.");
