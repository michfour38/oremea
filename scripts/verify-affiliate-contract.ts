import assert from "node:assert/strict";
import "./verify-creator-acquisition-economics";
import { affiliateCode, affiliateCheckoutUrl } from "../src/lib/whop/affiliate-attribution";
import { affiliateEconomics } from "../src/lib/oremea/affiliate-economics";
import { OREMEA_AFFILIATE_POLICY } from "../src/lib/oremea/affiliate-policy";
import { createVisitCheckout } from "../src/lib/whop/visit-payments";

async function main() {
  assert.equal(OREMEA_AFFILIATE_POLICY.standardRate, 0.3);
  assert.equal(OREMEA_AFFILIATE_POLICY.approvedCreatorRate, 0.4);
  assert.equal(OREMEA_AFFILIATE_POLICY.creatorAcquisition.firstSaleRate, 0.4);
  assert.equal(OREMEA_AFFILIATE_POLICY.creatorAcquisition.backendRate, 0.4);
  assert.equal(OREMEA_AFFILIATE_POLICY.creatorSpecificDiscount, false);
  assert.equal(OREMEA_AFFILIATE_POLICY.dawnIncomeAllocation, 0);
  for (const invalid of [null, undefined, "", "a&rate=40", "https://evil.test", "x".repeat(101)]) assert.equal(affiliateCode(invalid), null);
  assert.equal(affiliateCheckoutUrl("https://whop.com/checkout/plan_x/?redirect_url=x", "creator.one"), "https://whop.com/checkout/plan_x/?redirect_url=x&a=creator.one");
  assert.equal(affiliateCheckoutUrl("https://whop.com.evil.test/", "creator"), "https://whop.com.evil.test/");
  assert.equal(affiliateCheckoutUrl("https://whop.com/checkout/plan_x/", null), "https://whop.com/checkout/plan_x/");
  const costs = {platformAndPaymentCents:175,affiliateProcessingCents:25,taxAndRemittanceCents:0,refundsAndDisputesCents:0};
  assert.equal(affiliateEconomics(5000,"standard",costs).commissionCents,1500);
  assert.equal(affiliateEconomics(5000,"approved_creator",costs).commissionCents,2000);
  assert.equal(affiliateEconomics(5000,"approved_creator",costs).retainedRevenueCents,2800);
  assert.equal(affiliateEconomics(5000,"direct",costs).commissionCents,0);
  assert.equal(affiliateEconomics(5000,"standard",{...costs,platformAndPaymentCents:null}).retainedRevenueCents,null);
  assert.equal(affiliateEconomics(5000,"standard",costs,1400).retainedRevenueCents,3400);
  assert.equal(affiliateEconomics(5000,"standard",{...costs,refundsAndDisputesCents:5000},0).retainedRevenueCents,-200);
  const originalFetch = globalThis.fetch;
  const config = {apiKey:"fixture",companyId:"biz_fixture",productId:"prod_fixture",origin:"https://www.oremea.com"};
  const calls: Record<string,unknown>[] = [];
  globalThis.fetch = async (_url, init) => {
    const body = JSON.parse(String(init?.body)); calls.push(body);
    assert.equal(body.plan_id,"plan_fixture");
    assert.equal(body.mode,"payment");
    assert.deepEqual(body.metadata,{oremea_visit_order:"order_fixture"});
    assert.equal(body.redirect_url,"https://www.oremea.com/resonance/complete?order=order_fixture");
    assert.equal(body.commission_rate,undefined);
    return Response.json({id:"ch_fixture",company_id:"biz_fixture",plan:{id:"plan_fixture",currency:"usd",initial_price:50,plan_type:"one_time",expiration_days:null,adaptive_pricing_enabled:false}});
  };
  try {
    const order = {id:"order_fixture",whop_plan_id:"plan_fixture",amount_cents:5000};
    await createVisitCheckout({...order,affiliate_code:"standard.fixture"},config);
    await createVisitCheckout({...order,affiliate_code:"creator.fixture"},config);
    await createVisitCheckout(order,config);
    assert.equal(calls[0].affiliate_code,"standard.fixture");
    assert.equal(calls[1].affiliate_code,"creator.fixture");
    assert.equal(Object.hasOwn(calls[2],"affiliate_code"),false);
  } finally { globalThis.fetch = originalFetch; }
  console.log("Affiliate referral, unified 30/40 policy and economics contracts passed; provider execution still requires an attributable payment test.");
}
main().catch(error => { console.error(error); process.exitCode = 1; });
