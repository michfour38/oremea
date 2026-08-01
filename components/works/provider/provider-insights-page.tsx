"use client";

import { SignedIn, SignedOut, SignInButton, UserButton } from "@clerk/nextjs";
import { useEffect, useState } from "react";

import { ProviderIntelligence } from "@/components/works/provider/provider-intelligence";
import { WorksProviderNav } from "@/components/works/provider/provider-nav";
import { WorksPageHeader } from "@/components/works/works-brand";

type Provider = { id: string; name: string };

export function ProviderInsightsPage() {
  const [providers, setProviders] = useState<Provider[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const response = await fetch("/api/works/provider/me");
        if (response.status === 401) return;
        const data = await response.json();
        if (!response.ok) throw new Error(data?.error ?? "WORKS could not load your provider account.");
        if (cancelled) return;
        const rows = (data.providers ?? []).map((provider: { id: string; name: string }) => ({ id: provider.id, name: provider.name }));
        setProviders(rows);
        setSelectedId(rows[0]?.id ?? null);
      } catch (err) {
        if (!cancelled) setError(err instanceof Error ? err.message : "WORKS could not load your provider account.");
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, []);

  return <main className="mx-auto min-h-screen w-full max-w-5xl px-5 py-8 md:px-8 md:py-12">
    <WorksPageHeader
      href="/works/provider"
      context="Provider workspace"
      action={<SignedIn><UserButton afterSignOutUrl="/works/za" /></SignedIn>}
    />

    <SignedOut><section className="py-16"><h1 className="font-serif text-4xl text-[#1f1c17]">Sign in to view provider insights</h1><SignInButton mode="modal"><button className="mt-7 rounded-full bg-[#1f1c17] px-6 py-3 text-sm text-white">Sign in →</button></SignInButton></section></SignedOut>

    <SignedIn><section className="py-10 md:py-14">
      <WorksProviderNav current="/works/provider/insights" />

      <div className="mt-10">
        <p className="text-xs font-medium uppercase tracking-[0.18em] text-[#16834f]">Private provider view</p>
        <h1 className="mt-2 font-serif text-4xl text-[#1f1c17]">Demand insights</h1>
        <p className="mt-3 max-w-2xl text-sm leading-7 text-black/50">Aggregated signals about the demand WORKS is seeing around your provider capability. Customer identities, private answers, competitor information and other providers&apos; evidence stay outside this view.</p>
      </div>

      {loading ? <p className="mt-10 text-sm text-black/40">Loading…</p> : null}
      {error ? <p className="mt-8 text-sm text-red-700">{error}</p> : null}
      {!loading && !error && providers.length === 0 ? <p className="mt-10 text-sm text-black/45">No provider profile is connected to this account yet.</p> : null}

      {providers.length > 1 ? <div className="mt-8 flex flex-wrap gap-2">{providers.map(provider => <button key={provider.id} type="button" onClick={() => setSelectedId(provider.id)} className={`rounded-full border px-4 py-2 text-sm ${selectedId === provider.id ? "border-[#1f1c17] bg-[#1f1c17] text-white" : "border-black/15 bg-white"}`}>{provider.name}</button>)}</div> : null}

      {selectedId ? <div className="mt-8"><ProviderIntelligence key={selectedId} providerId={selectedId} /></div> : null}
    </section></SignedIn>
  </main>;
}
