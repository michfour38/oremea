import assert from "node:assert/strict";

async function main() {
  const state = globalThis as unknown as { prisma?: unknown };
  const oldPrisma = state.prisma;
  const oldFetch = globalThis.fetch;
  const oldKey = process.env.WHOP_API_KEY;
  process.env.WHOP_API_KEY = "fixture";
  state.prisma = {
    resonance_visit_orders: { findMany: async () => [{whop_payment_id:"pay_fixture"}] },
    resonance_whop_catalog: { findUnique: async () => ({company_id:"biz_fixture",product_id:"prod_fixture",plans:{},webhook_id:null}) },
  };
  let companyId = "biz_fixture";
  globalThis.fetch = async (url, init) => {
    assert.equal(init?.method,"GET");
    assert.doesNotMatch(String(url), /accounts|balance|transfers/);
    if (String(url).includes("/fees?")) return Response.json({data:[{amount:3.27,currency:"usd",type:"payment_processing_percentage_fee",name:"private@example.test"}],page_info:{has_next_page:false}});
    return Response.json({id:"pay_fixture",company:{id:companyId},currency:"usd",amount_after_fees:46.73,total:50,tax_amount:0,refunded_amount:null,user:{email:"private@example.test"}});
  };
  try {
    const { observeWhopVisitEconomics } = await import("../src/lib/whop/affiliate-economics-observer");
    const report = await observeWhopVisitEconomics();
    assert.equal(report.observedPayments,1);
    assert.equal(report.providerAmountAfterFeesCents,4673);
    assert.equal(report.feeBreakdownCents?.payment_processing_percentage_fee,327);
    assert.equal(report.confirmedCommissionCents,null);
    assert.equal(report.finalRetainedRevenueCents,null);
    assert.doesNotMatch(JSON.stringify(report), /pay_fixture|biz_fixture|private@example/);
    companyId = "biz_other";
    const rejected = await observeWhopVisitEconomics();
    assert.equal(rejected.observedPayments,0);
    assert.equal(rejected.availability,"unavailable");
    assert.equal(rejected.providerGrossCents,null);
    assert.equal(rejected.providerAmountAfterFeesCents,null);
    assert.equal(rejected.feeBreakdownCents,null);
    assert.ok(!("diagnostics" in rejected), "DAWN receives aggregates only");
    globalThis.fetch = async () => Response.json({error:{message:"Business account API key is not authorized for the member:email:read scope. private@example.test",code:"forbidden"}}, {status:403});
    const denied = await observeWhopVisitEconomics({includeDiagnostics:true});
    assert.ok("diagnostics" in denied);
    assert.deepEqual(denied.diagnostics?.[0], {stage:"payment",reason:"http_error",status:403,missingScope:"member:email:read"});
    assert.doesNotMatch(JSON.stringify(denied), /private@example|pay_fixture|biz_fixture/);
    globalThis.fetch = async (url) => String(url).includes("/fees?")
      ? Response.json({data:[{amount:2.87,currency:"usd",type:"payment_processing_percentage_fee"}],page_info:{has_next_page:false}})
      : Response.json({error:{message:"Not authorized for member\\:email\\:read scope"}}, {status:403});
    const partial = await observeWhopVisitEconomics({includeDiagnostics:true});
    assert.equal(partial.availability,"partial");
    assert.equal(partial.observedFeePayments,1);
    assert.equal(partial.providerGrossCents,null);
    assert.equal(partial.feeBreakdownCents?.payment_processing_percentage_fee,287);
    assert.ok("diagnostics" in partial);
    assert.equal(partial.diagnostics?.[0].missingScope,"member:email:read");
    globalThis.fetch = async (url) => String(url).includes("/fees?")
      ? Response.json({error:{message:"Forbidden"}}, {status:403})
      : Response.json({id:"pay_fixture",company:{id:"biz_fixture"},currency:"usd",amount_after_fees:47.13,total:50});
    const paymentOnly = await observeWhopVisitEconomics();
    assert.equal(paymentOnly.availability,"partial");
    assert.equal(paymentOnly.providerGrossCents,5000);
    assert.equal(paymentOnly.feeBreakdownCents,null);
    assert.equal(paymentOnly.finalRetainedRevenueCents,null);
    globalThis.fetch = async () => Response.json({});
    const malformed = await observeWhopVisitEconomics({includeDiagnostics:true});
    assert.ok("diagnostics" in malformed);
    assert.equal(malformed.diagnostics?.[0].reason,"schema_mismatch");
  } finally {
    state.prisma = oldPrisma; globalThis.fetch = oldFetch;
    if (oldKey === undefined) delete process.env.WHOP_API_KEY; else process.env.WHOP_API_KEY = oldKey;
  }
  console.log("Whop economics observation is read-only, scoped, redacted and explicit about unverified net revenue.");
}
main().catch(error => {console.error(error);process.exitCode=1;});
