"use client";

import { SignInButton, SignedIn, SignedOut, UserButton, useAuth } from "@clerk/nextjs";
import { useEffect, useState } from "react";

type Search = {
  id: string;
  status: string;
  currentStep: string | null;
  updatedAt: string;
  market: { slug: string; name: string };
  brief: { id: string; productDescription: string; status: string } | null;
  sourcingStatus: string | null;
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

    // A stale/missing local session should never block the rest of My WORKS.
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
    <main className="mx-auto min-h-screen w-full max-w-5xl px-5 py-8 md:px-8 md:py-12">
      <header className="flex items-center justify-between border-b border-black/10 pb-5">
        <div>
          <a href="/works/za" className="text-xs font-semibold uppercase tracking-[0.32em] text-[#16834f]">WORKS</a>
          <p className="mt-1 text-xs text-black/40">My WORKS</p>
        </div>
        <SignedIn><UserButton afterSignOutUrl="/works/za" /></SignedIn>
      </header>

      <SignedOut>
        <section className="py-16">
          <h1 className="font-serif text-4xl text-[#1f1c17] md:text-5xl">Your production work, when you choose to save it.</h1>
          <p className="mt-5 max-w-xl text-sm leading-7 text-black/55">Searching WORKS stays available without an account. Sign in when you want searches and production briefs to travel with you between visits.</p>
          <SignInButton mode="modal"><button className="mt-7 rounded-full bg-[#1f1c17] px-6 py-3 text-sm text-white">Sign in →</button></SignInButton>
        </section>
      </SignedOut>

      <SignedIn>
        <section className="py-10 md:py-14">
          <div className="flex flex-wrap items-end justify-between gap-5">
            <div>
              <p className="text-xs font-medium uppercase tracking-[0.18em] text-[#16834f]">My WORKS</p>
              <h1 className="mt-2 font-serif text-4xl text-[#1f1c17]">Saved production searches</h1>
            </div>
            <a href="/works/za" className="rounded-full bg-[#1f1c17] px-5 py-2.5 text-sm text-white">Start another product →</a>
          </div>

          {loading ? <p className="mt-10 text-sm text-black/40">Loading your WORKS searches…</p> : null}
          {error ? <p className="mt-8 text-sm text-red-700">{error}</p> : null}

          {!loading && !error && searches.length === 0 ? (
            <div className="mt-10 rounded-3xl border border-black/10 bg-white/65 p-7">
              <p className="font-serif text-2xl">Nothing saved here yet.</p>
              <p className="mt-3 max-w-xl text-sm leading-7 text-black/50">You can search WORKS anonymously. Open My WORKS after signing in and searches from this browser are attached to your WORKS account.</p>
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
                    <a href={`/works/${search.market.slug}`} className="text-sm underline underline-offset-4">Open in WORKS →</a>
                  </div>
                </article>
              ))}
            </div>
          ) : null}
        </section>
      </SignedIn>
    </main>
  );
}