"use client";

import { useEffect, useState } from "react";

type ReviewContext = {
  reviewable: boolean;
  outreachStatus: string;
  decision: string | null;
  provider: { id: string; name: string; slug: string };
  brief: { id: string; productDescription: string };
  review: {
    id: string;
    rating: number;
    body: string;
    reviewerName: string | null;
    reviewerCompany: string | null;
    publicIdentity: boolean;
    status: string;
    verifiedBrief: boolean;
  } | null;
};

export function WorksCustomerReviewForm({ outreachId }: { outreachId: string }) {
  const [context, setContext] = useState<ReviewContext | null>(null);
  const [rating, setRating] = useState(0);
  const [body, setBody] = useState("");
  const [reviewerName, setReviewerName] = useState("");
  const [reviewerCompany, setReviewerCompany] = useState("");
  const [publicIdentity, setPublicIdentity] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  useEffect(() => {
    let cancelled = false;
    async function load() {
      try {
        const response = await fetch(`/api/works/reviews?outreachId=${encodeURIComponent(outreachId)}`);
        const data = await response.json();
        if (!response.ok) throw new Error(data?.error ?? "WORKS could not load this review.");
        if (cancelled) return;
        const value = data as ReviewContext;
        setContext(value);
        if (value.review) {
          setRating(value.review.rating);
          setBody(value.review.body);
          setReviewerName(value.review.reviewerName ?? "");
          setReviewerCompany(value.review.reviewerCompany ?? "");
          setPublicIdentity(value.review.publicIdentity);
        }
      } catch (err) {
        if (!cancelled) setError(err instanceof Error ? err.message : "WORKS could not load this review.");
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    load();
    return () => { cancelled = true; };
  }, [outreachId]);

  async function submit() {
    try {
      setSaving(true);
      setError("");
      setMessage("");
      const response = await fetch("/api/works/reviews", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ outreachId, rating, body, reviewerName, reviewerCompany, publicIdentity }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data?.error ?? "WORKS could not save your review.");
      setMessage(data.message ?? "Your review is saved.");
      setContext((current) => current ? {
        ...current,
        review: {
          id: data.review.id,
          rating,
          body,
          reviewerName: reviewerName || null,
          reviewerCompany: reviewerCompany || null,
          publicIdentity: publicIdentity && Boolean(reviewerName.trim()),
          status: data.review.status,
          verifiedBrief: true,
        },
      } : current);
    } catch (err) {
      setError(err instanceof Error ? err.message : "WORKS could not save your review.");
    } finally {
      setSaving(false);
    }
  }

  if (loading) return <p className="py-14 text-sm text-black/40">Loading review…</p>;
  if (error && !context) return <p className="py-14 text-sm text-red-700">{error}</p>;
  if (!context) return null;

  return (
    <section className="py-10 md:py-14">
      <p className="text-xs font-medium uppercase tracking-[0.18em] text-[#16834f]">Verified WORKS brief</p>
      <h1 className="mt-3 max-w-3xl font-serif text-4xl leading-tight text-[#1f1c17] md:text-5xl">How was your experience with {context.provider.name}?</h1>
      <p className="mt-4 max-w-2xl text-sm leading-7 text-black/50">Your review is linked to your WORKS brief for <strong className="font-medium text-black/65">{context.brief.productDescription}</strong>. WORKS verifies the relationship to the brief; you decide whether your identity appears publicly.</p>

      {!context.reviewable ? (
        <div className="mt-8 rounded-3xl border border-black/10 bg-white/65 p-6 text-sm leading-7 text-black/50">A review opens after the provider has responded to this WORKS brief.</div>
      ) : (
        <div className="mt-8 max-w-3xl space-y-6">
          <div className="rounded-3xl border border-black/10 bg-white/70 p-6">
            <p className="text-sm font-medium">Your rating</p>
            <div className="mt-3 flex gap-2" aria-label="Rating from one to five stars">
              {[1, 2, 3, 4, 5].map((value) => (
                <button key={value} type="button" onClick={() => setRating(value)} className={`text-3xl transition ${rating >= value ? "text-[#16834f]" : "text-black/15"}`} aria-label={`${value} star${value === 1 ? "" : "s"}`}>★</button>
              ))}
            </div>

            <label className="mt-6 block text-sm font-medium">What was your experience?</label>
            <textarea value={body} onChange={(event) => setBody(event.target.value)} rows={7} maxLength={2000} placeholder="What was useful, clear, difficult or worth knowing for the next founder?" className="mt-2 w-full resize-none rounded-2xl border border-black/10 bg-white px-4 py-4 text-sm leading-7 outline-none focus:border-[#16834f]" />
            <p className="mt-2 text-xs text-black/35">{body.length} / 2,000</p>
          </div>

          <div className="rounded-3xl border border-black/10 bg-white/70 p-6">
            <p className="text-sm font-medium">Your public identity</p>
            <p className="mt-2 text-xs leading-5 text-black/45">Your name and company stay private unless you explicitly choose to publish them. Otherwise the review appears as “WORKS customer”.</p>
            <div className="mt-4 grid gap-3 sm:grid-cols-2">
              <input value={reviewerName} onChange={(event) => setReviewerName(event.target.value)} placeholder="Name (optional)" className="rounded-xl border border-black/10 bg-white px-4 py-3 text-sm outline-none focus:border-[#16834f]" />
              <input value={reviewerCompany} onChange={(event) => setReviewerCompany(event.target.value)} placeholder="Company (optional)" className="rounded-xl border border-black/10 bg-white px-4 py-3 text-sm outline-none focus:border-[#16834f]" />
            </div>
            <label className="mt-4 flex items-start gap-3 text-sm"><input type="checkbox" checked={publicIdentity} onChange={(event) => setPublicIdentity(event.target.checked)} className="mt-1" /><span>Show my name{reviewerCompany.trim() ? " and company" : ""} with this review.</span></label>
          </div>

          {context.review ? <p className="text-xs text-black/40">Current review status: {context.review.status.toLowerCase()}.</p> : null}
          {message ? <p className="rounded-2xl bg-[#eef7f1] p-4 text-sm leading-6">{message}</p> : null}
          {error ? <p className="text-sm text-red-700">{error}</p> : null}
          <button type="button" onClick={submit} disabled={saving || rating < 1 || body.trim().length < 10} className="rounded-full bg-[#1f1c17] px-6 py-3 text-sm font-medium text-white disabled:opacity-40">{saving ? "Saving review…" : context.review ? "Update review →" : "Submit review →"}</button>
        </div>
      )}
    </section>
  );
}