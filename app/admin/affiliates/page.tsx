import Link from "next/link";
import { requireAdminPage } from "@/lib/auth/require-admin";
import { SiteShell } from "@/components/site/site-shell";
import { OREMEA_AFFILIATE_POLICY as policy } from "@/src/lib/oremea/affiliate-policy";
import { approvedCreatorStressCases } from "@/src/lib/oremea/creator-acquisition-economics";
import { formatOremeaPrice } from "@/src/lib/oremea/pricing";
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
  const budget = approvedCreatorStressCases();

  return <SiteShell><section className="mx-auto max-w-4xl space-y-6 px-6 py-12">
    <Link href="/admin">← Oremea Admin</Link>
    <h1 className="text-3xl">Affiliate management</h1>
    <p>Oremea affiliate policy: {policy.standardRate * 100}% for eligible public products and {policy.approvedCreatorRate * 100}% for approved creators on the same customer prices and checkout. This page displays repository policy; check Whop for current live rates.</p>
    <p>Whop executes commissions and recurring subscription rewards. Update Whop global/member rates and review all existing custom creator overrides individually; repository policy changes do not update Whop. Oremea does not create a separate creator offer or first-sale override.</p>
    {whop && <a className="block underline" href={whop}>Open Whop affiliate controls</a>}

    <h2 className="text-xl">Creator setup</h2>
    <ol className="list-decimal space-y-2 pl-6">
      <li>Set eligible open Whop product rates to {policy.standardRate * 100}% with the intended recurring-payments behavior. Check member rates and update or retire every old custom creator rate so nobody remains at 30% or 40% unintentionally.</li>
      <li>Use that creator’s own external affiliate link into the ordinary Oremea funnel. Never distribute the owner’s link as a creator link.</li>
      <li>Verify a real attributed first purchase and subscription renewal in Whop before promising the commission.</li>
      <li>Verify a separate saved-card add-on purchase before promising attribution on additional purchases.</li>
    </ol>

    <h2 className="text-xl">Conservative delivery budgets at 70%</h2>
    <p>These are stress-case reserves, not provider invoices. They include stacked provider-fee assumptions, a 20% contribution reserve and, for visits, a 5% refund/dispute reserve. A zero budget means these reserves already exceed gross revenue before any delivery cost; do not treat the 70% policy as verified profitable.</p>
    <ul className="list-disc space-y-2 pl-6">
      <li>One Resonance visit: {formatOremeaPrice(budget.resonanceOneVisit.maxDeliveryBudgetCents)}.</li>
      <li>Complete Ten after one visit: {formatOremeaPrice(budget.resonanceCompleteTenFromOne.maxDeliveryBudgetCents)} for the other nine visits.</li>
      <li>Recognition: {formatOremeaPrice(budget.recognitionFirstMonth.maxDeliveryBudgetCents)} per referred member-month.</li>
      <li>Compass: {formatOremeaPrice(budget.compassFirstMonth.maxDeliveryBudgetCents)} per referred member-month.</li>
    </ul>
    <p>If delivery cost exceeds a budget, DAWN should flag it for review. DAWN cannot change price, commission, access or transfer funds and receives no income allocation.</p>

    <h2 className="text-xl">Measured provider economics</h2>
    <p>Read-only sample of recent Resonance visit payments. Missing provider costs are not treated as zero, and a requested referral is not proof of a Whop commission.</p>
    <pre className="overflow-x-auto rounded-xl border border-white/10 p-4 text-xs">{JSON.stringify(economics, null, 2)}</pre>
  </section></SiteShell>;
}
