"use client";

import { useEffect, useState } from "react";

import { ProviderResponseView } from "@/components/works/outreach/provider-response-view";

type PreviewPayload = {
  providerName: string;
  requesterName: string;
  product: string;
  category?: string | null;
  relevantSteps: string[];
  createdAt?: number;
};

export default function WorksProviderResponsePreviewPage() {
  const [payload, setPayload] = useState<PreviewPayload | null>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const key = new URLSearchParams(window.location.search).get("key");
    if (!key) {
      setReady(true);
      return;
    }

    const raw = window.localStorage.getItem(
      `oremea:works:provider-response-preview:${key}`
    );

    if (raw) {
      try {
        const parsed = JSON.parse(raw) as PreviewPayload;
        if (
          parsed &&
          typeof parsed.providerName === "string" &&
          typeof parsed.requesterName === "string" &&
          typeof parsed.product === "string" &&
          Array.isArray(parsed.relevantSteps)
        ) {
          setPayload(parsed);
        }
      } catch {
        // Invalid local preview payloads are treated as expired.
      }
    }

    setReady(true);
  }, []);

  if (!ready) {
    return (
      <main className="min-h-screen bg-[#f3eee4] px-5 py-10 text-[#1f1c17] md:px-8">
        <div className="mx-auto max-w-3xl text-sm text-black/50">
          Opening provider response preview…
        </div>
      </main>
    );
  }

  if (!payload) {
    return (
      <main className="min-h-screen bg-[#f3eee4] px-5 py-10 text-[#1f1c17] md:px-8">
        <div className="mx-auto max-w-3xl rounded-3xl border border-black/10 bg-white p-6 text-sm leading-6">
          This provider-response preview is no longer available. Return to the WORKS email draft and open a fresh preview.
        </div>
      </main>
    );
  }

  return (
    <ProviderResponseView
      providerName={payload.providerName}
      requesterName={payload.requesterName}
      product={payload.product}
      category={payload.category ?? null}
      relevantSteps={payload.relevantSteps}
      preview
    />
  );
}
