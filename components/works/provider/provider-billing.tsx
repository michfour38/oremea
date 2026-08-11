"use client";

import { useEffect, useMemo, useState } from "react";

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
    setBillingLoading(true);
    setError("");
    setMessage("");
    try {
      const response = await fetch("/api/works/billing/payfast/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ providerId: selected.id, plan }),
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
      setMessage("Subscription cancelled. This business is back on the Free plan.");
      setSubscription((current) => current ? { ...current, status: "CANCELLED", cancelled_at: new Date().toISOString() } : current);
      setProviders((current) => current.map((provider) => provider.id === selected.id ? { ...provider, commercial: { plan: "FREE" } } : provider));
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
              return (
                <article key={plan.key} className={`rounded-3xl border bg-white p-6 ${plan.recommended ? "border-[#16834f]/40" : "border-black/10"}`}>
                  <p className="text-xs uppercase tracking-[0.18em] text-black/40">{plan.name}</p>
                  <p className="mt-3 font-serif text-3xl">{plan.priceLabel}</p>
                  <p className="mt-4 min-h-20 text-sm leading-6 text-black/55">{plan.detail}</p>
                  <div className="mt-5 space-y-2 border-t border-black/8 pt-5">
                    {plan.features.map((feature) => <p key={feature} className="text-sm leading-6 text-black/65">✓ {feature}</p>)}
                  </div>
                  {current ? (
                    <span className="mt-7 inline-flex rounded-full bg-[#eef7f1] px-5 py-2.5 text-sm text-[#16834f]">Current plan</span>
                  ) : plan.key === "FREE" ? null : (
                    <button
                      type="button"
                      disabled={billingLoading || subscription?.status === "ACTIVE"}
                      onClick={() => startCheckout(plan.key)}
                      className="mt-7 rounded-full bg-[#1f1c17] px-5 py-2.5 text-sm text-white disabled:cursor-not-allowed disabled:opacity-40"
                    >
                      {billingLoading ? "Opening PayFast…" : `Choose ${plan.name} →`}
                    </button>
                  )}
                </article>
              );
            })}
          </div>

          <p className="mt-6 max-w-3xl text-xs leading-5 text-black/45">Paid WORKS plans renew monthly through PayFast. WORKS changes plan access only after a verified PayFast server notification. Cancelling here also cancels the PayFast subscription and returns the business to Free.</p>
        </>
      ) : null}
    </div>
  );
}
