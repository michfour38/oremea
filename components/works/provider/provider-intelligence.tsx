"use client";

import { useEffect, useState } from "react";

type Intelligence = {
  provider: { id: string; name: string; plan: string };
  windowDays: number;
  summary: { evaluatedBriefs: number; matchingBriefs: number; possibleBriefs: number; missedBriefs: number };
  detailAvailable: boolean;
  gaps: { key: string; label: string; noMatch: number; unknown: number; hard: number; total: number }[];
};

export function ProviderIntelligence({ providerId }: { providerId: string }) {
  const [data, setData] = useState<Intelligence | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const response = await fetch(`/api/works/provider/intelligence?providerId=${encodeURIComponent(providerId)}`);
        const payload = await response.json();
        if (!response.ok) throw new Error(payload?.error ?? "WORKS could not load demand intelligence.");
        if (!cancelled) setData(payload);
      } catch (err) {
        if (!cancelled) setError(err instanceof Error ? err.message : "WORKS could not load demand intelligence.");
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, [providerId]);

  if (loading) return <p className="text-sm text-black/40">Reading recent WORKS demand…</p>;
  if (error) return <p className="text-sm text-red-700">{error}</p>;
  if (!data) return null;

  return <section className="rounded-3xl border border-black/10 bg-white/70 p-6">
    <div className="flex flex-wrap items-end justify-between gap-4">
      <div>
        <p className="text-xs font-medium uppercase tracking-[0.18em] text-[#16834f]">Demand intelligence</p>
        <h2 className="mt-2 font-serif text-3xl text-[#1f1c17]">What WORKS has seen in the last {data.windowDays} days</h2>
      </div>
      <span className="text-xs uppercase tracking-[0.14em] text-black/35">Private to your provider account</span>
    </div>

    <div className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
      <article className="rounded-2xl border border-black/8 bg-[#fbfaf7] p-4"><p className="text-3xl font-serif">{data.summary.evaluatedBriefs}</p><p className="mt-1 text-xs text-black/45">briefs evaluated against your offerings</p></article>
      <article className="rounded-2xl border border-black/8 bg-[#fbfaf7] p-4"><p className="text-3xl font-serif">{data.summary.matchingBriefs}</p><p className="mt-1 text-xs text-black/45">contained at least one genuine match</p></article>
      <article className="rounded-2xl border border-black/8 bg-[#fbfaf7] p-4"><p className="text-3xl font-serif">{data.summary.possibleBriefs}</p><p className="mt-1 text-xs text-black/45">could fit once missing facts are resolved</p></article>
      <article className="rounded-2xl border border-black/8 bg-[#fbfaf7] p-4"><p className="text-3xl font-serif">{data.summary.missedBriefs}</p><p className="mt-1 text-xs text-black/45">fell outside current evidence or capability</p></article>
    </div>

    {data.detailAvailable ? (
      <div className="mt-7 border-t border-black/8 pt-6">
        <p className="text-sm font-medium">Where opportunity is being lost or left unresolved</p>
        <p className="mt-2 max-w-3xl text-xs leading-5 text-black/45">WORKS only shows aggregate matching criteria here. Customer identities, private brief answers and competitor information stay hidden.</p>
        {data.gaps.length ? <div className="mt-5 space-y-3">{data.gaps.map((gap) => <div key={gap.key} className="flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-black/8 bg-[#fbfaf7] px-4 py-3"><div><p className="text-sm font-medium">{gap.label}</p><p className="mt-1 text-xs text-black/40">{gap.noMatch} outside current fit · {gap.unknown} unresolved{gap.hard ? ` · ${gap.hard} hard constraint${gap.hard === 1 ? "" : "s"}` : ""}</p></div><span className="text-sm text-black/45">{gap.total}</span></div>)}</div> : <p className="mt-5 text-sm text-black/40">No recurring gaps have emerged yet.</p>}
      </div>
    ) : (
      <div className="mt-7 rounded-2xl bg-[#eef7f1] p-5">
        <p className="text-sm font-medium">Detailed demand intelligence is part of Growth.</p>
        <p className="mt-2 text-xs leading-5 text-black/50">Your aggregate evaluation totals remain visible here. Growth adds recurring gap patterns so you can see where demand exists around your capabilities without exposing customer briefs.</p>
      </div>
    )}
  </section>;
}
