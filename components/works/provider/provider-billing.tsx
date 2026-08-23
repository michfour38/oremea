"use client";

import { useEffect, useMemo, useState } from "react";

import { WorksRecurringCardMethods } from "@/components/works/works-recurring-card-methods";
import {
  WORKS_PROVIDER_PLANS,
  type WorksProviderPlanKey,
} from "@/lib/works/providers/public-plans";

type Provider = {
  id: string;
  name: string;
  commercial: { plan: "FREE" | "VERIFIED" | "GROWTH" | "ENTERPRISE" };
};

type Subscription = {
  id: string;
  plan: string;
  status: string;
  amount_cents: number;
  currency: string;
  started_at: string | null;
  cancelled_at: string | null;
  last_payment_at: string | null;
  created_at: string;
} | null;

export function WorksProviderBilling() {
  const [providers, setProviders] = useState<Provider[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [subscription, setSubscription] = useState<Subscription>(null);
  const [acceptedPlan, setAcceptedPlan] = useState<WorksProviderPlanKey | null>(null);
  const [loading, setLoading] = useState(true);
  const [billingLoading, setBillingLoading] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  const selected = useMemo(
    () => providers.find((provider) => provider.id === selectedId) ?? null,
    [providers, selectedId],
  );

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const response = await fetch("/api/works/provider/me", { cache: "no-store" });
        const data = await response.json();
        if (!response.ok) throw new Error(data?.error ?? "WORKS could not load your businesses.");
        if (cancelled) return;
        const rows = (data.providers ?? []) as Provider[];
        setProviders(rows);
        setSelectedId(rows[0]?.id ?? null);
      } catch (err) {
        if (!cancelled) setError(err instanceof Error ? err.message : "WORKS could not load billing.");
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    setAcceptedPlan(null);
    if (!selectedId) {
      setSubscription(null);
      return;
    }
    let cancelled = false;
    (async () => {
      try {
        const response = await fetch(
          `/api/works/billing/payfast/subscription?providerId=${encodeURIComponent(selectedId)}`,
          { cache: "no-store" },
        );
        const data = await response.json();
        if (!response.ok) throw new Error(data?.error ?? "WORKS could not load this subscription.");
        if (!cancelled) setSubscription(data.subscription ?? null);
      } catch (err) {
        if (!cancelled) setError(err instanceof Error ? err.message : "WORKS could not load this subscription.");
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [selectedId]);

  useEffect(() => {
    const payment = new URLSearchParams(window.location.search).get("payment");
    if (payment === "returned") {
      setMessage("PayFast returned you to WORKS. Your plan activates only after the verified payment notification arrives.");
    } else if (payment === "cancelled") {
      setMessage("PayFast checkout was cancelled. Your WORKS plan was not changed.");
    }
  }, []);

  async function startCheckout(plan: WorksProviderPlanKey) {
    if (!selected || plan === "FREE") return;
    if (acceptedPlan !== plan) {
      setError("Accept the recurring payment, cancellation and refund arrangement for this plan before continuing to PayFast.");
      return;
    }
    setBillingLoading(true);
    setError("");
    setMessage("");
    try {
      const response = await fetch("/api/works/billing/payfast/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          providerId: selected.id,
          plan,
          acceptRecurringTerms: true,
        }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data?.error ?? "WORKS could not open PayFast.");

      const form = document.createElement("form");
      form.method = "post";
      form.action = data.action;
      for (const [name, value] of Object.entries(data.fields as Record<string, string>)) {
        const input = document.createElement("input");
        input.type = "hidden";
        input.name = name;
        input.value = value;
        form.appendChild(input);
      }
      document.body.appendChild(form);
      form.submit();
    } catch (err) {
      setError(err instanceof Error ? err.message : "WORKS could not open PayFast.");
      setBillingLoading(false);
    }
  }

  async function cancelSubscription() {
    if (!selected || !window.confirm("Cancel this WORKS subscription now and return the business to Free?")) return;
    setBillingLoading(true);
    setError("");
    setMessage("");
    try {
      const response = await fetch("/api/works/billing/payfast/subscription", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ providerId: selected.id }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data?.error ?? "WORKS could not cancel this plan.");
      setMessage("Subscription cancelled. This business is back on the Free plan and future PayFast renewals are stopped.");
      setSubscription((current) => current ? { ...current, status: "CANCELLED", cancelled_at: new Date().toISOString() } : current);
      setProviders((current) => current.map((provider) => provider.id === selected.id ? { ...provider, commercial: { plan: "FREE" } } : provider));
      setAcceptedPlan(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "WORKS could not cancel this plan.");
    } finally {
      setBillingLoading(false);
    }
  }

  if (loading) return <p className="py-12 text-sm text-black/45">Loading WORKS billing…</p>;

  if (providers.length === 0) {
    return (
      <div className="py-12">
        <h2 className="font-serif text-3xl">Connect a business first</h2>
        <p className="mt-3 max-w-xl text-sm leading-6 text-black/55">A paid WORKS plan belongs to a specific provider business.</p>
        <a href="/works/providers/join" className="mt-6 inline-flex rounded-full bg-[#1f1c17] px-5 py-2.5 text-sm text-white">Add or connect my business →</a>
      </div>
    );
  }

  return (
    <div className="py-8">
      {providers.length > 1 ? (
        <div className="mb-8 flex flex-wrap gap-2">
          {providers.map((provider) => (
            <button
              key={provider.id}
              type="button"
              onClick={() => {
                setSelectedId(provider.id);
                setAcceptedPlan(null);
                setError("");
                setMessage("");
              }}
              className={`rounded-full border px-4 py-2 text-sm ${selectedId === provider.id ? "border-[#1f1c17] bg-[#1f1c17] text-white" : "border-black/15 bg-white"}`}
            >
              {provider.name}
            </button>
          ))}
        </div>
      ) : null}

      {selected ? (
        <>
          <div className="rounded-3xl border border-black/10 bg-white p-6">
            <p className="text-xs uppercase tracking-[0.18em] text-black/40">Current plan</p>
            <div className="mt-2 flex flex-wrap items-end justify-between gap-4">
              <div>
                <h2 className="font-serif text-3xl">{selected.name}</h2>
                <p className="mt-2 text-sm text-black/55">{selected.commercial.plan === "VERIFIED" ? "Active" : selected.commercial.plan.charAt(0) + selected.commercial.plan.slice(1).toLowerCase()}</p>
              </div>
              {subscription?.status === "ACTIVE" ? (
                <button disabled={billingLoading} onClick={cancelSubscription} className="rounded-full border border-black/15 bg-white px-4 py-2 text-sm disabled:opacity-50">Cancel subscription</button>
              ) : null}
            </div>
          </div>

          {message ? <p className="mt-5 rounded-2xl border border-black/10 bg-[#f3eee4] px-4 py-3 text-sm leading-6">{message}</p> : null}
          {error ? <p className="mt-5 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">{error}</p> : null}

          <div className="mt-8 grid gap-4 lg:grid-cols-3">
            {WORKS_PROVIDER_PLANS.map((plan) => {
              const current = selected.commercial.plan === plan.key;
              const paid = plan.key !== "FREE";
              const accepted = acceptedPlan === plan.key;
              return (
                <article key={plan.key} className={`rounded-3xl border bg-white p-6 ${plan.recommended ? "border-[#16834f]/40" : "border-black/10"}`}>
                  <p className="text-xs uppercase tracking-[0.18em] text-black/40">{plan.name}</p>
                  <p className="mt-3 font-serif text-3xl">{plan.priceLabel}</p>
                  <p className="mt-1 text-xs text-black/40">{paid ? "ZAR · recurring monthly" : "No payment required"}</p>
                  <p className="mt-4 min-h-20 text-sm leading-6 text-black/55">{plan.detail}</p>
                  <div className="mt-5 space-y-2 border-t border-black/8 pt-5">
                    {plan.features.map((feature) => <p key={feature} className="text-sm leading-6 text-black/65">✓ {feature}</p>)}
                  </div>

                  {!current && paid ? (
                    <div className="mt-6 rounded-2xl border border-black/10 bg-[#f7f3eb] p-4 text-xs leading-5 text-black/60">
                      <p className="font-semibold text-[#1f1c17]">Before PayFast</p>
                      <p className="mt-2">
                        <strong>{plan.priceLabel} in ZAR</strong> is charged for the initial successful payment, then the same amount is charged approximately monthly on the same calendar day as that first successful payment, until cancelled.
                      </p>
                      <p className="mt-2">
                        Service delivery is digital: paid WORKS access begins after WORKS receives and verifies PayFast&apos;s successful server notification.
                      </p>
                      <p className="mt-2">
                        Cancel any time from WORKS Billing. Cancellation stops future PayFast renewals and returns the business to Free. Charges already validly incurred, billing errors, failed supply and mandatory consumer rights are handled under Oremea&apos;s Payments, Subscriptions, Cancellation &amp; Refund Policy.
                      </p>
                      <p className="mt-2">
                        Oremea is domiciled in South Africa. Customer service: support@oremea.com.
                      </p>
                      <p className="mt-2">
                        Full policies: <a className="underline underline-offset-2" href="/terms" target="_blank" rel="noreferrer">WORKS Terms</a> · <a className="underline underline-offset-2" href="https://www.oremea.com/refunds" target="_blank" rel="noreferrer">Payments &amp; Refunds</a> · <a className="underline underline-offset-2" href="https://www.oremea.com/privacy" target="_blank" rel="noreferrer">Privacy &amp; POPIA</a>
                      </p>
                      <div className="mt-4">
                        <WorksRecurringCardMethods compact />
                      </div>
                      <label className="mt-4 flex cursor-pointer items-start gap-3 rounded-xl border border-black/10 bg-white p-3 text-[#1f1c17]">
                        <input
                          type="checkbox"
                          checked={accepted}
                          onChange={(event) => {
                            setAcceptedPlan(event.target.checked ? plan.key : null);
                            setError("");
                          }}
                          className="mt-0.5 h-4 w-4 shrink-0"
                        />
                        <span>
                          I accept this recurring payment, service delivery, cancellation and refund arrangement and authorise the monthly PayFast subscription described above.
                        </span>
                      </label>
                    </div>
                  ) : null}

                  {current ? (
                    <span className="mt-7 inline-flex rounded-full bg-[#eef7f1] px-5 py-2.5 text-sm text-[#16834f]">Current plan</span>
                  ) : plan.key === "FREE" ? null : (
                    <button
                      type="button"
                      disabled={billingLoading || subscription?.status === "ACTIVE" || !accepted}
                      onClick={() => startCheckout(plan.key)}
                      className="mt-7 rounded-full bg-[#1f1c17] px-5 py-2.5 text-sm text-white disabled:cursor-not-allowed disabled:opacity-40"
                    >
                      {billingLoading ? "Opening PayFast…" : accepted ? `Continue to PayFast for ${plan.name} →` : "Accept above to continue"}
                    </button>
                  )}
                </article>
              );
            })}
          </div>

          <p className="mt-6 max-w-3xl text-xs leading-5 text-black/45">Paid WORKS plans renew monthly through PayFast. WORKS changes plan access only after a verified PayFast server notification. Each checkout stores the account&apos;s dated acceptance of the recurring amount, frequency, timing, duration, cancellation and refund arrangement shown immediately before PayFast.</p>
        </>
      ) : null}
    </div>
  );
}
