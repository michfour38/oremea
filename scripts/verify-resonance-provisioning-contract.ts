import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { OREMEA_PRICING } from "../src/lib/oremea/pricing";

async function main() {
  const model = {};
  const testGlobal = globalThis as unknown as { prisma?: unknown };
  const originalPrisma = testGlobal.prisma;
  testGlobal.prisma = { resonance_whop_catalog: model };
  const { provisionResonanceWhopCatalog } = await import("../src/lib/whop/resonance-catalog");
  const originalFetch = globalThis.fetch;
  const savedKey = process.env.WHOP_API_KEY;
  const savedCompany = process.env.WHOP_COMPANY_ID;
  process.env.WHOP_API_KEY = "local-fixture-only";
  delete process.env.WHOP_COMPANY_ID;
  const prices = OREMEA_PRICING.resonance.visitPricesCents;
  const specs = [
    ...([1, 2, 3, 4, 5, 6, 7, 8] as const).map(q => ({ key: `WHOP_RESONANCE_VISITS_${q}_PLAN_ID`, price: prices[q] / 100 })),
    ...([1, 3, 4] as const).map(q => ({ key: `WHOP_RESONANCE_COMPLETE_FROM_${q}_PLAN_ID`, price: (prices[10] - prices[q]) / 100 })),
  ];
  const plans = specs.map((s, i) => ({ id: `plan_fixture${i}`, product: { id: "prod_fixture" },
    initial_price: s.price, plan_type: "one_time", currency: "usd", visibility: "hidden",
    expiration_days: null, trial_period_days: null, adaptive_pricing_enabled: false,
    internal_notes: `oremea:resonance-visits:v1:${s.key}` }));
  let stored: { company_id: string } | null = { company_id: "biz_fixture" };
  let writes = 0;
  const calls: string[] = [];
  Object.assign(model, { findUnique: async () => stored, upsert: async () => { writes++; return {}; } });
  globalThis.fetch = async (url, init) => {
    const target = new URL(String(url));
    calls.push(target.pathname);
    assert.equal(init?.method, "GET", "Existing resources must be reused without writes.");
    assert.equal(target.searchParams.get("company_id"), "biz_fixture");
    if (target.pathname.endsWith("/products")) return Response.json({ data: [
      { id: "prod_fixture", visibility: "hidden", metadata: { oremea_catalog: "oremea_resonance_visits_v1" } },
    ] });
    if (target.pathname.endsWith("/plans")) return Response.json({ data: plans });
    if (target.pathname.endsWith("/webhooks")) return Response.json({ data: [
      { id: "hook_fixture", url: "https://www.oremea.com/api/webhooks/whop", enabled: true,
        events: ["payment.succeeded", "payment.failed", "refund.created", "refund.updated"] },
    ] });
    throw new Error("Unexpected endpoint: " + target.pathname);
  };
  try {
    for (let i = 0; i < 2; i++) {
      const result = await provisionResonanceWhopCatalog();
      assert.deepEqual(result, { companyId: "biz_fixture", productId: "prod_fixture", planCount: 11, webhookId: "hook_fixture" });
    }
    assert.equal(writes, 2);
    assert.equal(calls.some(path => /accounts|balance/.test(path)), false);
    process.env.WHOP_COMPANY_ID = "biz_other";
    const previousCalls = calls.length;
    await assert.rejects(provisionResonanceWhopCatalog, { stage: "account", code: "conflict" });
    assert.equal(calls.length, previousCalls, "Conflicting company configuration must stop before Whop calls.");
    stored = null;
    process.env.WHOP_COMPANY_ID = "biz_fixture";
    assert.equal((await provisionResonanceWhopCatalog()).planCount, 11);
    delete process.env.WHOP_COMPANY_ID;
    await assert.rejects(provisionResonanceWhopCatalog, { stage: "account", code: "validation" });
    process.env.WHOP_COMPANY_ID = "../../accounts/me";
    await assert.rejects(provisionResonanceWhopCatalog, { stage: "account", code: "validation" });
    process.env.WHOP_COMPANY_ID = "biz_fixture";
    plans[0].initial_price = 1;
    await assert.rejects(provisionResonanceWhopCatalog, { stage: "plans", code: "validation" });
    const catalogSource = readFileSync("src/lib/whop/resonance-catalog.ts", "utf8");
  const requiredEventsBlock = catalogSource.match(/const REQUIRED_WEBHOOK_EVENTS = \[([\s\S]*?)\] as const;/)?.[1] ?? "";
  assert.match(requiredEventsBlock, /payment\.succeeded/);
  assert.match(requiredEventsBlock, /payment\.failed/);
  assert.match(requiredEventsBlock, /refund\.created/);
  assert.match(requiredEventsBlock, /refund\.updated/);
  assert.doesNotMatch(
    requiredEventsBlock,
    /["']payment\.canceled["']/,
    "Do not send unsupported payment.canceled in Whop's required webhook event list.",
  );
  const webhookRoute = readFileSync("app/api/webhooks/whop/route.ts", "utf8");
  assert.match(
    webhookRoute,
    /payment\.canceled/,
    "The route may remain tolerant of a legacy or unexpected canceled-payment payload.",
  );
    const page = readFileSync("app/(member)/resonance/visits/page.tsx", "utf8");
    assert.match(page, /order\?\.status === "pending" \|\| order\?\.status === "failed"/);
    assert.match(page, /order\.whop_checkout_id && canResumeCheckout && checkoutEnabled/);
    const completion = readFileSync("app/(member)/resonance/complete/page.tsx", "utf8");
    assert.match(completion, /order.status === "failed" && order.kind === "initial"/);
    assert.match(completion, /\/resonance\/visits\?order=\$\{order.id\}/);
    const adminTrace = readFileSync("app/admin/resonance-commerce/page.tsx", "utf8");
  assert.match(adminTrace, /owner-only lifecycle trace/);
  assert.match(adminTrace, /Requested referral/);
  assert.match(adminTrace, /Unresolved checkouts older than 30 minutes/);
  assert.match(adminTrace, /Whop remains the source of truth for actual affiliate attribution and commission/);
  assert.doesNotMatch(adminTrace, /Creator Resonance Starter/);
  assert.match(adminTrace, /order\._count\.redemptions/);
  assert.doesNotMatch(adminTrace, /order\.buyer_email/);
  const traceCatalogSource = readFileSync("src/lib/whop/resonance-catalog.ts", "utf8");
  for (const field of ["amount_cents", "parent_id", "affiliate_code", "whop_plan_id", "paid_at", "created_at"]) {
    assert.match(traceCatalogSource, new RegExp(`${field}: true`));
  }
  assert.match(traceCatalogSource, /_count: \{ select: \{ redemptions: true \} \}/);
  console.log("Provisioning reuses the company/catalog without financial endpoints; conflict, missing ID, wrong price, decline recovery, and owner-only transaction trace guards passed (mocked provider/storage).");
  } finally {
    testGlobal.prisma = originalPrisma;
    globalThis.fetch = originalFetch;
    if (savedKey === undefined) delete process.env.WHOP_API_KEY; else process.env.WHOP_API_KEY = savedKey;
    if (savedCompany === undefined) delete process.env.WHOP_COMPANY_ID; else process.env.WHOP_COMPANY_ID = savedCompany;
  }
}
main().catch(error => { console.error(error); process.exitCode = 1; });
