import Link from "next/link";
import { requireAdminPage } from "@/lib/auth/require-admin";
import { SiteShell } from "@/components/site/site-shell";
import { OREMEA_AFFILIATE_POLICY as policy } from "@/src/lib/oremea/affiliate-policy";
import { loadResonanceWhopCatalog } from "@/src/lib/whop/resonance-catalog";
import { observeWhopVisitEconomics } from "@/src/lib/whop/affiliate-economics-observer";

export const dynamic = "force-dynamic";

export default async function AffiliateAdminPage() {
  await requireAdminPage();
  const catalog = await loadResonanceWhopCatalog().catch(() => null);
  const economics = await observeWhopVisitEconomics({ includeDiagnostics: true }).catch(() => ({ availability: "unavailable" }));
  const whop = catalog ? `https://whop.com/dashboard/${encodeURIComponent(catalog.companyId)}/affiliates/` : null;
  return <SiteShell><section className="mx-auto max-w-4xl space-y-6 px-6 py-12">
    <Link href="/admin">← Oremea Admin</Link>
    <h1 className="text-3xl">Affiliate management</h1>
    <p>Standard affiliates: {policy.standardRate * 100}%. Owner-approved creators: {policy.approvedCreatorRate * 100}%.</p>
    <p>Whop executes commissions and recurring subscription rewards. These figures describe Oremea policy; individual approval and saved rates are managed in Whop.</p>
    {whop && <a className="block underline" href={whop}>Open Whop affiliate controls</a>}
    <ol className="list-decimal space-y-2 pl-6">
      <li>Open “Set an affiliate commission for a specific user”. Enter the creator’s verified Whop username or email.</li>
      <li>Choose Percent, enter {policy.approvedCreatorRate * 100}, retain Recurring payments, and select only their approved products.</li>
      <li>Review the named recipient and products before inviting. A standard affiliate cannot select this rate on Oremea.</li>
    </ol>
    <p>DAWN observes aggregate economics only. It cannot approve creators, change rates, pay affiliates, transfer money, reserve income, or change Whop financial settings. DAWN receives no income allocation.</p>
    <h2 className="text-xl">Measured provider economics</h2>
    <p>Read-only sample of the latest 25 Resonance visit payments. Fee categories come from Whop. Payment details and fees are read independently; partial coverage is shown explicitly. Missing or incomplete values are not treated as zero. Whop’s amount after fees is not presented as final retained revenue: commission, tax, refund and dispute reconciliation must be complete first.</p>
    <pre className="overflow-x-auto rounded-xl border border-white/10 p-4 text-xs">{JSON.stringify(economics, null, 2)}</pre>
    <p>Verify an actual attributable sale for each approved arrangement before relying on reported commission. Saved-card additional purchases require a separate attribution check.</p>
  </section></SiteShell>;
}
