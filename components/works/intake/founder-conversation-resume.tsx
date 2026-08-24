"use client";

import { useEffect, useState } from "react";

import type { WorksMarketCategory } from "@/lib/works/categories/list-market-categories";
import { FounderConversationV2 } from "@/components/works/intake/founder-conversation-v2";

type MarketView = {
  slug: string;
  name: string;
  geographyLabel: string;
  geographyValues: string[];
};

type ResumeCandidate = {
  sessionId: string;
  productDescription: string | null;
  status: string;
  updatedAt: string;
};

function searchStorageKey(marketSlug: string) {
  return `oremea:works:${marketSlug}:search-session`;
}

function dismissedStorageKey(marketSlug: string) {
  return `oremea:works:${marketSlug}:dismissed-resume-session`;
}

function wait(ms: number) {
  return new Promise((resolve) => window.setTimeout(resolve, ms));
}

export function FounderConversationResumeBoundary({
  market,
  categories,
  embedded = false,
}: {
  market: MarketView;
  categories: WorksMarketCategory[];
  embedded?: boolean;
}) {
  const [mode, setMode] = useState<"CHECKING" | "READY" | "OFFER" | "ERROR">("CHECKING");
  const [candidate, setCandidate] = useState<ResumeCandidate | null>(null);
  const [retryToken, setRetryToken] = useState(0);

  useEffect(() => {
    let cancelled = false;

    async function checkSavedProgress() {
      setMode("CHECKING");
      setCandidate(null);

      const key = searchStorageKey(market.slug);
      const savedSessionId = window.localStorage.getItem(key);

      try {
        if (savedSessionId) {
          let lastStatus = 0;

          for (let attempt = 0; attempt < 3; attempt += 1) {
            try {
              const response = await fetch(
                `/api/works/search-sessions/${encodeURIComponent(savedSessionId)}`,
                { cache: "no-store" }
              );
              lastStatus = response.status;

              if (response.ok) {
                if (!cancelled) setMode("READY");
                return;
              }

              if (response.status === 404) break;
            } catch {
              lastStatus = 0;
            }

            if (attempt < 2) await wait(350 * (attempt + 1));
          }

          if (lastStatus !== 404) {
            throw new Error("temporary restore failure");
          }
        }

        const response = await fetch(
          `/api/works/search-sessions/resume?marketSlug=${encodeURIComponent(market.slug)}`,
          { cache: "no-store" }
        );
        if (!response.ok) throw new Error("resume lookup failed");

        const data = await response.json();
        const nextCandidate = data?.candidate as ResumeCandidate | null | undefined;
        if (cancelled) return;

        if (!nextCandidate?.sessionId) {
          setMode("READY");
          return;
        }

        const dismissed = window.localStorage.getItem(dismissedStorageKey(market.slug));
        if (dismissed === nextCandidate.sessionId) {
          setMode("READY");
          return;
        }

        setCandidate(nextCandidate);
        setMode("OFFER");
      } catch {
        if (!cancelled) setMode("ERROR");
      }
    }

    checkSavedProgress();
    return () => {
      cancelled = true;
    };
  }, [market.slug, retryToken]);

  if (mode === "READY") {
    return (
      <FounderConversationV2
        market={market}
        categories={categories}
        embedded={embedded}
      />
    );
  }

  if (mode === "OFFER" && candidate) {
    return (
      <div className="mx-auto w-full max-w-4xl px-5 py-10 md:px-8 md:py-14">
        <section className="rounded-3xl border border-black/10 bg-white/75 p-6 md:p-8">
          <p className="text-xs font-medium uppercase tracking-[0.18em] text-[#16834f]">
            Saved WORKS progress found
          </p>
          <h2 className="mt-3 font-serif text-3xl leading-tight text-[#1f1c17] md:text-4xl">
            {candidate.productDescription || "Your recent production brief"}
          </h2>
          <p className="mt-4 max-w-2xl text-sm leading-6 text-black/55">
            WORKS still has this search for this browser. Resume it where you left off, or deliberately start a new product.
          </p>
          <div className="mt-6 flex flex-wrap gap-3">
            <button
              type="button"
              onClick={() => {
                window.localStorage.setItem(searchStorageKey(market.slug), candidate.sessionId);
                window.localStorage.removeItem(dismissedStorageKey(market.slug));
                setMode("READY");
              }}
              className="rounded-full bg-[#1f1c17] px-6 py-3 text-sm font-medium text-white"
            >
              Resume saved brief →
            </button>
            <button
              type="button"
              onClick={() => {
                window.localStorage.removeItem(searchStorageKey(market.slug));
                window.localStorage.setItem(dismissedStorageKey(market.slug), candidate.sessionId);
                setCandidate(null);
                setMode("READY");
              }}
              className="rounded-full border border-black/15 bg-white px-6 py-3 text-sm font-medium text-[#1f1c17]"
            >
              Start a new product
            </button>
          </div>
        </section>
      </div>
    );
  }

  if (mode === "ERROR") {
    return (
      <div className="mx-auto w-full max-w-4xl px-5 py-10 md:px-8 md:py-14">
        <section className="rounded-3xl border border-[#8b6a31]/20 bg-[#f8f0df] p-6 md:p-8">
          <p className="font-serif text-2xl text-[#1f1c17]">Your saved WORKS progress has not been cleared.</p>
          <p className="mt-3 max-w-2xl text-sm leading-6 text-black/55">
            WORKS could not reconnect to it just now. This can happen briefly during a deployment. Try again instead of starting over.
          </p>
          <button
            type="button"
            onClick={() => setRetryToken((value) => value + 1)}
            className="mt-5 rounded-full bg-[#1f1c17] px-6 py-3 text-sm font-medium text-white"
          >
            Try restoring again →
          </button>
        </section>
      </div>
    );
  }

  return (
    <div className="mx-auto min-h-[220px] w-full max-w-4xl px-5 py-10 text-sm text-black/45 md:px-8">
      Reconnecting to saved WORKS progress…
    </div>
  );
}
