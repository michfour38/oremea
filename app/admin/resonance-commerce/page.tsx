import Link from "next/link";

import { SiteShell } from "@/components/site/site-shell";
import { requireAdminPage } from "@/lib/auth/require-admin";
import { getResonanceWhopProvisioningStatus } from "@/src/lib/whop/resonance-catalog";
import { formatOremeaPrice } from "@/src/lib/oremea/pricing";

import { ProvisionForm } from "./provision-form";

export const dynamic = "force-dynamic";

export default async function ResonanceCommerceAdminPage({
  searchParams,
}: {
  searchParams: Promise<{
    status?: string;
    stage?: string;
    code?: string;
    providerStatus?: string;
  }>;
}) {
  await requireAdminPage();
  const query = await searchParams;
  const status = await getResonanceWhopProvisioningStatus();

  return (
    <SiteShell>
      <section className="mx-auto w-full max-w-4xl px-6 py-12 md:px-10 md:py-16">
        <Link
          href="/admin"
          className="text-xs uppercase tracking-[0.22em] text-[#b79a63] hover:text-[#e7c98b]"
        >
          ← Oremea Admin
        </Link>

        <p className="mt-8 text-xs uppercase tracking-[0.26em] text-[#b79a63]">
          Resonance commerce
        </p>
        <h1 className="mt-4 text-4xl font-light tracking-tight md:text-5xl">
          Visit-credit checkout
        </h1>
        <p className="mt-5 max-w-2xl text-sm leading-7 text-zinc-400">
          Private setup for the Resonance visit product, fixed-price plans and
          the existing Oremea Whop webhook. Provisioning does not enable public
          visit checkout.
        </p>

        {query.status === "ready" ? (
          <p className="mt-6 rounded-2xl border border-emerald-300/20 bg-emerald-300/5 p-4 text-sm text-emerald-100">
            Resonance commerce is provisioned. Public checkout remains controlled
            separately by its feature flags.
          </p>
        ) : null}
        {query.status === "error" ? (
          <div className="mt-6 rounded-2xl border border-amber-300/20 bg-amber-300/5 p-4 text-sm text-amber-100">
            <p className="font-medium">Provisioning stopped safely. No public checkout was enabled.</p>
            <p className="mt-2 leading-6">
              {provisioningFailureMessage(query.stage, query.code, query.providerStatus)}
            </p>
            {query.stage ? (
              <p className="mt-2 text-xs uppercase tracking-[0.16em] text-amber-100/60">
                Stage: {query.stage}
                {query.providerStatus ? ` · Whop HTTP ${query.providerStatus}` : ""}
              </p>
            ) : null}
          </div>
        ) : null}

        <div className="mt-10 grid gap-4 sm:grid-cols-2">
          <Status label="Whop API key" ready={status.apiKeyConfigured} />
          <Status label="Stored catalog" ready={status.catalogConfigured} />
          <Status
            label="Fixed-price plans"
            ready={status.planCount === 11}
            detail={status.catalogConfigured ? `${status.planCount} / 11` : "Not provisioned"}
          />
          <Status
            label="Existing webhook"
            ready={Boolean(status.webhookId)}
            detail={status.webhookId ? "Connected" : "Not verified"}
          />
        </div>

        {status.productId ? (
          <p className="mt-5 text-xs text-zinc-600">
            Whop product: {status.productId}
          </p>
        ) : null}

        <div className="mt-8 rounded-2xl border border-white/10 p-5 text-sm">
          <h2 className="text-xl">Private commerce audit</h2>
          <p className="mt-3">Public visit credits: {status.visitsEnabled ? "ON" : "OFF"} · Public checkout: {status.checkoutEnabled ? "ON" : "OFF"}</p>
          <p>Company: {status.companyId ?? "Not configured"}</p>
          <p>Paid orders: {status.paidOrders} · Redeemed visits: {status.redemptions}</p>
          <div className="mt-5 overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead><tr><th>Offer</th><th>Amount</th><th>Stored Whop plan</th></tr></thead>
              <tbody>{status.plans.map((plan) => (
                <tr key={plan.key}><td className="py-2">{plan.label}</td><td>{formatOremeaPrice(plan.amountCents)}</td><td>{plan.id ?? "Missing"}</td></tr>
              ))}</tbody>
            </table>
          </div>
          <div className="mt-5 overflow-x-auto">
            <table className="w-full text-left text-xs">
              <caption className="mb-2 text-left">Latest ten orders — identifiers and settlement state only</caption>
              <thead><tr><th>Order</th><th>Status</th><th>Visits / unused</th><th>Checkout</th><th>Payment</th></tr></thead>
              <tbody>{status.recentOrders.map((order) => (
                <tr key={order.id}><td className="py-2">{order.id}</td><td>{order.status}</td><td>{order.quantity} / {order.remaining_quantity}</td><td>{order.whop_checkout_id ?? "—"}</td><td>{order.whop_payment_id ?? "—"}</td></tr>
              ))}</tbody>
            </table>
          </div>
        </div>

        <div className="mt-8 rounded-[2rem] border border-white/10 bg-black/40 p-6 md:p-8">
          <h2 className="text-2xl font-light text-zinc-100">
            Provision from the configured API key
          </h2>
          <p className="mt-3 text-sm leading-7 text-zinc-400">
            This reuses Oremea-marked resources when they already exist, creates
            only missing hidden resources, verifies every approved amount and
            one-time term, and extends the existing webhook. It fails closed on
            mismatches.
          </p>

          <ProvisionForm enabled={status.apiKeyConfigured}>
            Provision Resonance commerce
          </ProvisionForm>

          {!status.apiKeyConfigured ? (
            <p className="mt-4 text-xs leading-6 text-zinc-500">
              Add WHOP_API_KEY to the Oremea production service first. Never paste
              the key into a public page or client-side variable.
            </p>
          ) : null}
        </div>
      </section>
    </SiteShell>
  );
}

function Status({
  label,
  ready,
  detail,
}: {
  label: string;
  ready: boolean;
  detail?: string;
}) {
  return (
    <div className="rounded-2xl border border-white/10 bg-black/35 p-5">
      <p className="text-xs uppercase tracking-[0.18em] text-zinc-500">{label}</p>
      <p className="mt-2 text-lg text-zinc-100">{ready ? "Ready" : "Waiting"}</p>
      {detail ? <p className="mt-1 text-xs text-zinc-500">{detail}</p> : null}
    </div>
  );
}


function provisioningFailureMessage(
  stage?: string,
  code?: string,
  providerStatus?: string,
) {
  const stageLabel: Record<string, string> = {
    account: "reading the Whop company attached to this API key",
    product: "finding or creating the hidden Resonance Visits product",
    plans: "finding, creating, or validating the fixed-price plans",
    webhook: "finding or updating the existing Oremea Whop webhook",
    storage: "saving the verified Whop catalog in Oremea",
  };

  const where = stageLabel[stage ?? ""] ?? "an unknown provisioning step";

  if (code === "permission") {
    return `Whop denied permission while ${where}. This status alone cannot distinguish a key, role, account, or permission mismatch. Provision again to see Whop’s redacted reason below.`;
  }
  if (code === "not_found") {
    return `Whop could not find the expected resource while ${where}. This usually means the existing resource is absent or the key cannot see it.`;
  }
  if (code === "conflict") {
    return `Whop reported a resource conflict while ${where}. Oremea did not create a replacement or continue past the conflict.`;
  }
  if (code === "provider") {
    return `Whop returned ${providerStatus ? `HTTP ${providerStatus}` : "an API error"} while ${where}. No public checkout was enabled.`;
  }
  if (code === "storage") {
    return "Whop provisioning completed far enough to reach Oremea storage, but the verified catalog could not be saved. No public checkout was enabled.";
  }
  if (code === "validation") {
    return `Oremea received data that did not match the expected safe contract while ${where}. It stopped rather than adopting or creating uncertain commerce resources.`;
  }

  return "Provisioning stopped before the commerce catalog was verified. No public checkout was enabled.";
}
