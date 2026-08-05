"use client";

import { useEffect, useState } from "react";

import { WorksPageHeader } from "@/components/works/works-brand";

export function OpenSavedWorksSearch({ sessionId }: { sessionId: string }) {
  const [message, setMessage] = useState("Opening your WORKS search…");

  useEffect(() => {
    let cancelled = false;

    async function open() {
      try {
        const response = await fetch(`/api/works/my/searches/${sessionId}`);
        const data = await response.json();
        if (!response.ok) throw new Error(data?.error ?? "WORKS could not open this saved search.");
        if (cancelled) return;

        const marketSlug = data.search.market.slug as string;
        window.localStorage.setItem(`oremea:works:${marketSlug}:search-session`, data.search.id);
        window.location.replace(`/works/${marketSlug}`);
      } catch (err) {
        if (!cancelled) setMessage(err instanceof Error ? err.message : "WORKS could not open this saved search.");
      }
    }

    open();
    return () => { cancelled = true; };
  }, [sessionId]);

  return (
    <main className="mx-auto min-h-screen w-full max-w-3xl px-5 py-12 md:px-8">
      <WorksPageHeader context="Saved customer search" />
      <div className="py-16">
        <p className="font-serif text-3xl text-[#1f1c17]">{message}</p>
        <p className="mt-4 text-sm leading-6 text-black/45">Only searches attached to your WORKS account can be opened here.</p>
      </div>
    </main>
  );
}
