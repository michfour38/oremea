"use client";

import { SignInButton, SignedIn, SignedOut, UserButton } from "@clerk/nextjs";
import { useEffect, useMemo, useState } from "react";

type Review = {
  id: string;
  reviewer_name: string | null;
  reviewer_company: string | null;
  public_identity: boolean;
  rating: number;
  body: string;
  verified_brief: boolean;
  provider_response: string | null;
  created_at: string;
};

type Provider = { id: string; name: string; reviews: Review[] };

export function ProviderReviewsPage() {
  const [providers, setProviders] = useState<Provider[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [drafts, setDrafts] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [savingId, setSavingId] = useState<string | null>(null);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  const selected = useMemo(() => providers.find(provider => provider.id === selectedId) ?? null, [providers, selectedId]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const response = await fetch("/api/works/provider/me");
        if (response.status === 401) return;
        const data = await response.json();
        if (!response.ok) throw new Error(data?.error ?? "WORKS could not load your provider reviews.");
        if (cancelled) return;
        const rows = (data.providers ?? []) as Provider[];
        setProviders(rows);
        setSelectedId(rows[0]?.id ?? null);
        const initial: Record<string, string> = {};
        for (const provider of rows) for (const review of provider.reviews ?? []) initial[review.id] = review.provider_response ?? "";
        setDrafts(initial);
      } catch (err) {
        if (!cancelled) setError(err instanceof Error ? err.message : "WORKS could not load your provider reviews.");
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, []);

  async function saveResponse(reviewId: string) {
    try {
      setSavingId(reviewId);
      setError("");
      setMessage("");
      const response = await fetch(`/api/works/provider/reviews/${reviewId}/response`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ response: drafts[reviewId] ?? "" }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data?.error ?? "WORKS could not save this response.");
      setProviders(current => current.map(provider => ({
        ...provider,
        reviews: provider.reviews.map(review => review.id === reviewId ? { ...review, provider_response: data.review.provider_response } : review),
      })));
      setMessage("Response saved.");
    } catch (err) {
      setError(err instanceof Error ? err.message : "WORKS could not save this response.");
    } finally {
      setSavingId(null);
    }
  }

  return <main className="mx-auto min-h-screen w-full max-w-4xl px-5 py-8 md:px-8 md:py-12">
    <header className="flex items-center justify-between border-b border-black/10 pb-5">
      <div><a href="/works/provider" className="text-xs font-semibold uppercase tracking-[0.32em] text-[#16834f]">WORKS</a><p className="mt-1 text-xs text-black/40">Provider reviews</p></div>
      <SignedIn><UserButton afterSignOutUrl="/works/za" /></SignedIn>
    </header>

    <SignedOut><section className="py-16"><h1 className="font-serif text-4xl text-[#1f1c17]">Sign in to manage provider reviews.</h1><SignInButton mode="modal"><button className="mt-7 rounded-full bg-[#1f1c17] px-6 py-3 text-sm text-white">Sign in →</button></SignInButton></section></SignedOut>

    <SignedIn><section className="py-10 md:py-14">
      <div className="flex flex-wrap items-end justify-between gap-5">
        <div><p className="text-xs font-medium uppercase tracking-[0.18em] text-[#16834f]">Reputation</p><h1 className="mt-2 font-serif text-4xl text-[#1f1c17]">Customer reviews</h1></div>
        <a href="/works/provider" className="text-sm underline underline-offset-4">Profile & capacity →</a>
      </div>

      {loading ? <p className="mt-10 text-sm text-black/40">Loading…</p> : null}
      {error ? <p className="mt-8 text-sm text-red-700">{error}</p> : null}
      {message ? <p className="mt-8 rounded-2xl bg-[#eef7f1] p-4 text-sm">{message}</p> : null}

      {providers.length > 1 ? <div className="mt-8 flex flex-wrap gap-2">{providers.map(provider => <button key={provider.id} type="button" onClick={() => setSelectedId(provider.id)} className={`rounded-full border px-4 py-2 text-sm ${selectedId === provider.id ? "border-[#1f1c17] bg-[#1f1c17] text-white" : "border-black/15 bg-white"}`}>{provider.name}</button>)}</div> : null}

      {!loading && selected && selected.reviews.length === 0 ? <div className="mt-10 rounded-3xl border border-black/10 bg-white/65 p-6 text-sm text-black/45">No published reviews yet.</div> : null}

      {selected?.reviews.length ? <div className="mt-8 space-y-4">{selected.reviews.map(review => <article key={review.id} className="rounded-3xl border border-black/10 bg-white/70 p-6">
        <p className="text-sm">{"★".repeat(review.rating)}<span className="text-black/15">{"★".repeat(5 - review.rating)}</span></p>
        <p className="mt-3 text-sm leading-7 text-black/65">{review.body}</p>
        <p className="mt-3 text-xs text-black/40">{review.public_identity ? (review.reviewer_name ?? "WORKS customer") : "WORKS customer"}{review.public_identity && review.reviewer_company ? ` · ${review.reviewer_company}` : ""}{review.verified_brief ? " · Verified WORKS brief" : ""}</p>
        <div className="mt-5 border-t border-black/8 pt-5">
          <label className="text-xs font-medium uppercase tracking-[0.14em] text-black/40">Your public response</label>
          <textarea value={drafts[review.id] ?? ""} onChange={event => setDrafts(current => ({ ...current, [review.id]: event.target.value }))} rows={3} maxLength={2000} placeholder="Respond to this review…" className="mt-3 w-full resize-none rounded-xl border border-black/10 bg-white px-4 py-3 text-sm leading-6" />
          <button type="button" onClick={() => saveResponse(review.id)} disabled={savingId === review.id} className="mt-3 rounded-full border border-black/15 bg-white px-4 py-2 text-sm disabled:opacity-50">{savingId === review.id ? "Saving…" : "Save response →"}</button>
        </div>
      </article>)}</div> : null}
    </section></SignedIn>
  </main>;
}
