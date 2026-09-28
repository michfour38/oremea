import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";

import { OREMEA_AFFILIATE_POLICY } from "../src/lib/oremea/affiliate-policy";
import { approvedCreatorStressCases } from "../src/lib/oremea/creator-acquisition-economics";
import { OREMEA_PRICING } from "../src/lib/oremea/pricing";

const cases = approvedCreatorStressCases();
assert.equal(OREMEA_AFFILIATE_POLICY.standardRate, 0.30);
assert.equal(OREMEA_AFFILIATE_POLICY.approvedCreatorRate, 0.40);
assert.equal(cases.resonanceOneVisit.priceCents, OREMEA_PRICING.resonance.visitPricesCents[1]);
assert.equal(cases.resonanceOneVisit.creatorCommissionCents, 2000);
assert.equal(cases.resonanceOneVisit.maxDeliveryBudgetCents, 1297);
assert.equal(cases.resonanceCompleteTenFromOne.priceCents, 35000);
assert.equal(cases.resonanceCompleteTenFromOne.creatorCommissionCents, 14000);
assert.equal(cases.resonanceCompleteTenFromOne.maxDeliveryBudgetCents, 9262);
assert.equal(cases.recognitionFirstMonth.maxDeliveryBudgetCents, 590);
assert.equal(cases.compassFirstMonth.maxDeliveryBudgetCents, 1522);

const source = (file: string) => fs.readFileSync(path.join(process.cwd(), file), "utf8");
const landing = source("app/(marketing)/resonance/creator/page.tsx");
const actions = source("app/(member)/resonance/visits/actions.ts");
const orders = source("src/lib/resonance/visit-orders.ts");
const provision = source("app/admin/resonance-commerce/actions.ts");
const historicalCatalog = source("src/lib/whop/creator-starter-catalog.ts");
const policy = source("src/lib/oremea/affiliate-policy.ts");

assert.match(landing, /redirect\("\/resonance\/visits"\)/);
assert.match(actions, /requestAffiliateCode/);
assert.match(actions, /startVisitPurchase/);
assert.doesNotMatch(actions, /purchaseCreatorStarter|startCreatorStarterPurchase/);
assert.doesNotMatch(provision, /provisionCreatorStarterWhopCatalog/);
assert.match(provision, /provisionResonanceWhopCatalog/);
assert.doesNotMatch(policy, /firstSaleRate|creatorAcquisition/);
assert.match(historicalCatalog, /findUnique/);
assert.doesNotMatch(historicalCatalog, /\.create\(|\.upsert\(|provisionCreatorStarter/);
assert.match(orders, /expectedVisitProductForPlan/);
assert.match(orders, /loadCreatorStarterWhopCatalog/);
assert.match(orders, /applyVisitPaymentEvent/);
assert.match(orders, /applyVisitRefundEvent/);
assert.doesNotMatch(orders, /startCreatorStarterPurchase/);

console.log("Creator 30/40 policy, shared purchase path, and historical settlement compatibility verified.");
