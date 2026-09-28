import Link from "next/link";
import { requireAdminPage } from "@/lib/auth/require-admin";
import { SiteShell } from "@/components/site/site-shell";
import { OREMEA_AFFILIATE_POLICY as policy } from "@/src/lib/oremea/affiliate-policy";
import {
  creatorAcquisitionStressCase,
  creatorBackendStressCases,
} from "@/src/lib/oremea/creator-acquisition-economics";
import { formatOremeaPrice } from "@/src/lib/oremea/pricing";
import { loadCreatorStarterWhopCatalog } from "@/src/lib/whop/creator-starter-catalog";
import { loadResonanceWhopCatalog } from "@/src/lib/whop/resonance-catalog";
import { observeWhopVisitEconomics } from "@/src/lib/whop/affiliate-economics-observer";

export const dynamic = "force-dynamic";

export default async function AffiliateAdminPage() {
  await requireAdminPage();
  const [catalog, creatorStarter, economics] = await Promise.all([
    loadResonanceWhopCatalog().catch(() => null),
    loadCreatorStarterWhopCatalog().catch(() => null),
    observeWhopVisitEconomics({ includeDiagnostics: true }).catch(() => ({ availability: "unavailable" })),
  ]);
  const whop = catalog ? `https://whop.com/dashboard/${encodeURIComponent(catalog.companyId)}/affiliates/` : null;
  const acquisition = creatorAcquisitionStressCase();
  const backend = creatorBackendStressCases();
  const creatorStarterConfigured = Boolean(creatorStarter);

  return <SiteShell><section className="mx-auto max-w-4xl space-y-6 px-6 py-12">
    <Link href="/admin">← Oremea Admin</Link>
    <h1 className="text-3xl">Affiliate management</h1>
    <p>Standard affiliates: {policy.standardRate * 100}%. Owner-approved creator backend target: {policy.approvedCreatorRate * 100}%.</p>
    <p>Whop executes commissions and recurring subscription rewards. These figures describe Oremea policy; individual approval and saved rates are managed in Whop.</p>
    {whop && <a className="block underline" href={whop}>Open Whop affiliate controls</a>}

    <h2 className="text-xl">Creator acquisition offer</h2>
    <p className={creatorStarterConfigured ? "text-emerald-300" : "text-amber-300"}>
      {creatorStarterConfigured ? "Dedicated creator starter product is provisioned." : "Not live: provision Resonance commerce to create the isolated creator starter product."}
    </p>
    <div className="space-y-2 rounded-xl border border-white/10 p-4">
      <p>Customer front-end price: {formatOremeaPrice(acquisition.amountCents)} for one Resonance visit.</p>
      <p>Approved creator first-sale target: {policy.creatorAcquisition.firstSaleRate * 100}% on the dedicated acquisition product only.</p>
      <p>Approved creator backend target: {policy.creatorAcquisition.backendRate * 100}%.</p>
      <p>Conservative first-sale acquisition investment reserve: {formatOremeaPrice(acquisition.acquisitionInvestmentCents)}.</p>
      <p className="text-sm opacity-75">That reserve stress-tests creator commission on gross sale, stacked provider-fee reserves, a 5% refund/dispute reserve, and a {formatOremeaPrice(acquisition.deliveryReserveCents)} first-visit delivery reserve. It is intentionally harsher than a normal domestic transaction and is not a provider invoice.</p>
    </div>

    <h2 className="text-xl">The backend makes the acquisition work</h2>
    <div className="space-y-2 rounded-xl border border-white/10 p-4">
      <p>If the $50 starter buyer accepts the existing Complete Ten offer, the separate backend purchase is {formatOremeaPrice(backend.resonanceCompleteTenFromStarter.priceCents)}.</p>
      <p>At the 40% backend target, creator commission on that backend purchase would be {formatOremeaPrice(backend.resonanceCompleteTenFromStarter.creatorCommissionCents)} if the provider confirms attribution for that charge.</p>
      <p>When both transactions are attributable as intended, creator earnings across starter + Complete Ten can reach {formatOremeaPrice(backend.resonanceCompleteTenFromStarter.creatorEarningsIncludingStarterCents)} before any later subscription commissions.</p>
      <p>After the 40% backend reserve, stacked provider-fee reserve, 5% refund/dispute reserve and a 20% Oremea contribution reserve, the remaining delivery-cost budget for the other nine visits is {formatOremeaPrice(backend.resonanceCompleteTenFromStarter.maxDeliveryBudgetCents)}.</p>
    </div>

    <h2 className="text-xl">One-month subscription safety floor</h2>
    <p>At the {policy.approvedCreatorRate * 100}% creator backend target and a 20% contribution target, the maximum delivery-cost budgets under the same conservative provider-fee reserve are:</p>
    <ul className="list-disc space-y-2 pl-6">
      <li>Recognition: {formatOremeaPrice(backend.recognitionFirstMonth.maxDeliveryBudgetCents)} per referred member-month.</li>
      <li>Compass: {formatOremeaPrice(backend.compassFirstMonth.maxDeliveryBudgetCents)} per referred member-month.</li>
    </ul>
    <p>If observed monthly AI/delivery cost rises above either budget, DAWN should surface a unit-economics review. It must not silently change price, commission or access.</p>

    <h2 className="text-xl">Creator setup</h2>
    <ol className="list-decimal space-y-2 pl-6">
      <li>Use Oremea’s owner-only Resonance commerce provisioner to create/verify the dedicated hidden “Creator Resonance Starter” product and its {formatOremeaPrice(acquisition.amountCents)} one-time plan. Provisioning does not assign a creator rate.</li>
      <li>In Whop, set the approved creator’s first-sale commission target to {policy.creatorAcquisition.firstSaleRate * 100}% only for that dedicated acquisition product, if the account permits the intended rate.</li>
      <li>Set the same creator to the {policy.approvedCreatorRate * 100}% backend target on approved backend products, retaining recurring commission for subscriptions where provider attribution is supported.</li>
      <li>Use the creator’s own external affiliate link into the Oremea funnel. Never distribute the owner’s link as a creator link.</li>
      <li>Run one real attributable starter purchase and verify the provider’s recorded commission, fees, refund behavior, pending/available timing and spendable balance before opening the offer broadly.</li>
      <li>Run a separate real backend/add-on attribution test before promising the creator that saved-card or later cross-product purchases earn commission.</li>
    </ol>
    <p className="font-medium">Guardrail: never set the normal Resonance product/catalog to a {policy.creatorAcquisition.firstSaleRate * 100}% creator rate. The acquisition offer must remain isolated.</p>

    <p>DAWN observes aggregate economics only. It cannot approve creators, change rates, pay affiliates, transfer money, reserve income, or change Whop financial settings. DAWN receives no income allocation.</p>
    <h2 className="text-xl">Measured provider economics</h2>
    <p>Read-only sample of the latest 25 Resonance visit payments. Fee categories come from Whop. Payment details and fees are read independently; partial coverage is shown explicitly. Missing or incomplete values are not treated as zero. Whop’s amount after fees is not presented as final retained revenue: commission, tax, refund and dispute reconciliation must be complete first.</p>
    <pre className="overflow-x-auto rounded-xl border border-white/10 p-4 text-xs">{JSON.stringify(economics, null, 2)}</pre>
    <p>Verify an actual attributable sale for each approved arrangement before relying on reported commission. Saved-card additional purchases require a separate attribution check.</p>
  </section></SiteShell>;
}
