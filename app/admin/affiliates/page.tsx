import Link from "next/link";
import { requireAdminPage } from "@/lib/auth/require-admin";
import { SiteShell } from "@/components/site/site-shell";
import { OREMEA_AFFILIATE_POLICY as policy } from "@/src/lib/oremea/affiliate-policy";
import {
  creatorAcquisitionStressCase,
  creatorBackendStressCases,
} from "@/src/lib/oremea/creator-acquisition-economics";
import { OREMEA_PRICING, formatOremeaPrice } from "@/src/lib/oremea/pricing";
import { loadResonanceWhopCatalog } from "@/src/lib/whop/resonance-catalog";
import { observeWhopVisitEconomics } from "@/src/lib/whop/affiliate-economics-observer";

export const dynamic = "force-dynamic";

export default async function AffiliateAdminPage() {
  await requireAdminPage();
  const [catalog, economics] = await Promise.all([
    loadResonanceWhopCatalog().catch(() => null),
    observeWhopVisitEconomics({ includeDiagnostics: true }).catch(() => ({ availability: "unavailable" })),
  ]);
  const whop = catalog ? `https://whop.com/dashboard/${encodeURIComponent(catalog.companyId)}/affiliates/` : null;
  const firstSale = creatorAcquisitionStressCase();
  const backend = creatorBackendStressCases();
  const complete = backend.resonanceCompleteTenFromFirstVisit;

  return <SiteShell><section className="mx-auto max-w-4xl space-y-6 px-6 py-12">
    <Link href="/admin">← Oremea Admin</Link>
    <h1 className="text-3xl">Affiliate management</h1>

    <div className="space-y-2 rounded-xl border border-white/10 p-4">
      <p><strong>Launch authority</strong></p>
      <p>Standard/open affiliates: {policy.standardRate * 100}%.</p>
      <p>Specifically approved creators: {policy.approvedCreatorRate * 100}% from the first attributable sale onward.</p>
      <p>Customer pricing is identical for direct, affiliate and creator traffic. There is no creator-only discount and no 100% first-sale offer.</p>
    </div>

    <p>Whop executes commissions and recurring subscription rewards. Individual creator approval and saved rates are managed in Whop.</p>
    {whop && <a className="block underline" href={whop}>Open Whop affiliate controls</a>}

    <h2 className="text-xl">Resonance creator economics</h2>
    <div className="space-y-2 rounded-xl border border-white/10 p-4">
      <p>One visit: {formatOremeaPrice(OREMEA_PRICING.resonance.visitPricesCents[1])}.</p>
      <p>Approved creator commission at 40%: {formatOremeaPrice(firstSale.creatorCommissionCents)}.</p>
      <p>Conservative contribution after creator commission, stacked provider-fee reserve, refund/dispute reserve and a {formatOremeaPrice(firstSale.deliveryReserveCents)} first-visit delivery reserve: {formatOremeaPrice(Math.max(0, firstSale.contributionCents))}.</p>
      <p>Complete Ten total: {formatOremeaPrice(OREMEA_PRICING.resonance.visitPricesCents[10])}.</p>
      <p>After a {formatOremeaPrice(firstSale.amountCents)} first visit, completing the remaining nine is {formatOremeaPrice(complete.priceCents)}.</p>
      <p>Creator earnings across the full {formatOremeaPrice(OREMEA_PRICING.resonance.visitPricesCents[10])} customer spend are {formatOremeaPrice(complete.creatorEarningsAcrossTenCents)} when both transactions are attributable at 40%.</p>
    </div>

    <h2 className="text-xl">Subscription safety floor</h2>
    <p>At the {policy.approvedCreatorRate * 100}% creator rate and a 20% contribution target, the maximum delivery-cost budgets under the conservative provider-fee reserve are:</p>
    <ul className="list-disc space-y-2 pl-6">
      <li>Recognition ({formatOremeaPrice(OREMEA_PRICING.recognition.standardPriceCents)}/month): {formatOremeaPrice(backend.recognitionFirstMonth.maxDeliveryBudgetCents)} per referred member-month.</li>
      <li>Compass ({formatOremeaPrice(OREMEA_PRICING.compass.standardPriceCents)}/month): {formatOremeaPrice(backend.compassFirstMonth.maxDeliveryBudgetCents)} per referred member-month.</li>
    </ul>
    <p>If observed monthly AI/delivery cost rises above either budget, DAWN should surface a unit-economics review. It must not silently change price, commission or access.</p>

    <h2 className="text-xl">Creator setup</h2>
    <ol className="list-decimal space-y-2 pl-6">
      <li>Keep the normal Oremea customer pricing unchanged.</li>
      <li>In Whop, keep the open/default affiliate rate at {policy.standardRate * 100}%.</li>
      <li>Specifically approve selected creators at {policy.approvedCreatorRate * 100}%.</li>
      <li>Remove any 100% first-sale override, creator-only price, coupon or special discount.</li>
      <li>Use the creator&apos;s own external affiliate link into Oremea.</li>
      <li>Run a real attributable purchase before relying on provider-recorded commission, especially for saved-card/add-on purchases.</li>
    </ol>

    <p>DAWN observes aggregate economics only. It cannot approve creators, change rates, pay affiliates, transfer money, reserve income, or change Whop financial settings. DAWN receives no income allocation.</p>
    <h2 className="text-xl">Measured provider economics</h2>
    <p>Read-only sample of the latest 25 Resonance visit payments. Missing or incomplete provider values are not treated as zero.</p>
    <pre className="overflow-x-auto rounded-xl border border-white/10 p-4 text-xs">{JSON.stringify(economics, null, 2)}</pre>
    <p>Verify an actual attributable sale for each approved arrangement before relying on reported commission. Saved-card additional purchases require a separate attribution check.</p>
  </section></SiteShell>;
}
