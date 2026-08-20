"use client";

import { SignInButton, SignedIn, SignedOut, useAuth } from "@clerk/nextjs";
import { useEffect, useState } from "react";

import { WorksPageHeader } from "@/components/works/works-brand";
import { WorksAccountButton } from "@/components/works/works-account-button";

type Search = {
  id: string;
  status: string;
  currentStep: string | null;
  updatedAt: string;
  market: { slug: string; name: string };
  brief: { id: string; productDescription: string; status: string } | null;
  sourcingStatus: string | null;
  reviewableProviders: Array<{
    outreachId: string;
    providerName: string;
    providerSlug: string;
    outreachStatus: string;
    decision: string | null;
    review: { id: string; status: string; rating: number } | null;
  }>;
};

function statusLabel(search: Search) {
  if (search.sourcingStatus) return search.sourcingStatus.replaceAll("_", " ").toLowerCase();
  return search.status.replaceAll("_", " ").toLowerCase();
}

async function attachLocalSearches() {
  const sessionSuffix = ":search-session";
  const prefix = "oremea:works:";
  const keys = Array.from({ length: window.localStorage.length }, (_, index) => window.localStorage.key(index))
    .filter((key): key is string => Boolean(key && key.startsWith(prefix) && key.endsWith(sessionSuffix)));

  for (const key of keys) {
    const marketSlug = key.slice(prefix.length, -sessionSuffix.length);
    const sessionId = window.localStorage.getItem(key);
    const browserSessionId = window.localStorage.getItem(`${prefix}${marketSlug}:browser-session`);
    if (!sessionId || !browserSessionId) continue;

    const response = await fetch(`/api/works/search-sessions/${sessionId}/claim`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ browserSessionId }),
    });

    if (response.status === 404) window.localStorage.removeItem(key);
  }
}

export function MyWorksDashboard() {
  const { isLoaded, isSignedIn } = useAuth();
  const [searches, setSearches] = useState<Search[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!isLoaded) return;
    if (!isSignedIn) {
      setLoading(false);
      return;
    }

    let cancelled = false;
    async function load() {
      try {
        await attachLocalSearches();
        const response = await fetch("/api/works/my/searches");
        const data = await response.json();
        if (!response.ok) throw new Error(data?.error ?? "WORKS could not load your saved searches.");
        if (!cancelled) setSearches(data.searches ?? []);
      } catch (err) {
        if (!cancelled) setError(err instanceof Error ? err.message : "WORKS could not load your saved searches.");
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    load();
    return () => { cancelled = true; };
  }, [isLoaded, isSignedIn]);

  return (
    <main className="min-h-screen bg-[#f3eee4] text-[#1f1c17]">
      <div className="mx-auto w-full max-w-5xl px-5 py-6 md:px-8 md:py-8">
        <WorksPageHeader
          context="My WORKS"
          action={<SignedIn><WorksAccountButton /></SignedIn>}
        />

        <SignedOut>
          <section className="py-12 md:py-16">
            <h1 className="font-serif text-4xl text-[#1f1c17] md:text-5xl">Your production work, when you choose to save it.</h1>
            <p className="mt-5 max-w-xl text-sm leading-7 text-black/55">Searching WORKS stays available without an account. Sign in when you want searches and production briefs to travel with you between visits.</p>
            <SignInButton mode="modal"><button className="mt-7 rounded-full bg-[#1f1c17] px-6 py-3 text-sm text-white">Sign in →</button></SignInButton>
          </section>
        </SignedOut>

        <SignedIn>
          <section className="py-8 md:py-10">
            <div className="flex flex-wrap items-end justify-between gap-5">
              <div>
                <p className="text-xs font-medium uppercase tracking-[0.18em] text-[#16834f]">My WORKS</p>
                <h1 className="mt-2 font-serif text-4xl text-[#1f1c17]">My production workspace</h1>
                <p className="mt-3 max-w-2xl text-sm leading-6 text-black/55">Briefs, production routes and provider conversations stay together here.</p>
              </div>
              <a href="/works" className="rounded-full bg-[#1f1c17] px-5 py-2.5 text-sm text-white">{searches.length ? "Start another product →" : "Start a product →"}</a>
            </div>

          {loading ? <p className="mt-10 text-sm text-black/40">Loading your WORKS searches…</p> : null}
          {error ? <p className="mt-8 text-sm text-red-700">{error}</p> : null}

            {!loading && !error && searches.length === 0 ? (
              <div className="mt-8 overflow-hidden rounded-3xl bg-[#1f1c17] p-6 text-white shadow-[0_18px_50px_rgba(44,35,20,0.12)] md:p-8">
                <p className="text-[11px] font-medium uppercase tracking-[0.2em] text-[#78d7a4]">Ready when you are</p>
                <h2 className="mt-3 max-w-2xl font-serif text-3xl leading-tight md:text-4xl">Begin with the product you need made.</h2>
                <p className="mt-4 max-w-xl text-sm leading-7 text-white/65">Describe it once. WORKS will shape the brief, map the production route and keep the result here when you save it.</p>
                <a href="/works" className="mt-6 inline-flex rounded-full bg-[#d7bd82] px-6 py-3 text-sm font-medium text-[#1f1c17]">Describe my product →</a>
                <div className="mt-7 grid gap-2 border-t border-white/10 pt-5 text-xs text-white/55 sm:grid-cols-3">
                  <span>1 · Describe the need</span>
                  <span>2 · See the route</span>
                  <span>3 · Save or contact providers</span>
                </div>
              </div>
            ) : null}

          {searches.length ? (
            <div className="mt-8 space-y-3">
              {searches.map((search) => (
                <article key={search.id} className="rounded-3xl border border-black/10 bg-white/70 p-6">
                  <div className="flex flex-wrap items-start justify-between gap-5">
                    <div>
                      <p className="text-xs uppercase tracking-[0.15em] text-black/35">{search.market.name}</p>
                      <h2 className="mt-2 font-serif text-2xl text-[#1f1c17]">{search.brief?.productDescription ?? "Production search in progress"}</h2>
                      <p className="mt-3 text-sm capitalize text-black/50">{statusLabel(search)}</p>
                    </div>
                    <a href={`/works/my/${search.id}`} className="text-sm underline underline-offset-4">Open in WORKS →</a>
                  </div>

                  {search.reviewableProviders.length ? (
                    <div className="mt-5 border-t border-black/8 pt-5">
                      <p className="text-xs font-medium uppercase tracking-[0.16em] text-[#16834f]">Provider feedback</p>
                      <div className="mt-3 flex flex-wrap gap-2">
                        {search.reviewableProviders.map((provider) => (
                          <a key={provider.outreachId} href={`/works/reviews/new?outreach=${encodeURIComponent(provider.outreachId)}`} className="rounded-full border border-black/10 bg-white px-4 py-2 text-sm text-black/65">
                            {provider.review ? `${provider.providerName} · ${"★".repeat(provider.review.rating)} · ${provider.review.status.toLowerCase()}` : `Review ${provider.providerName} →`}
                          </a>
                        ))}
                      </div>
                    </div>
                  ) : null}
                </article>
              ))}
            </div>
          ) : null}
          </section>
        </SignedIn>
      </div>
    </main>
  );
}
