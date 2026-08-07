"use client";

import { ProviderResponseForm } from "@/components/works/outreach/provider-response-form";
import { WorksPageHeader } from "@/components/works/works-brand";

export function ProviderResponseView({
  providerName,
  requesterName,
  product,
  category,
  relevantSteps,
  token,
  responded = false,
  preview = false,
}: {
  providerName: string;
  requesterName: string;
  product: string;
  category?: string | null;
  relevantSteps: string[];
  token?: string;
  responded?: boolean;
  preview?: boolean;
}) {
  return (
    <main className="min-h-screen bg-[#f3eee4] px-5 py-10 text-[#1f1c17] md:px-8">
      <div className="mx-auto max-w-3xl">
        <WorksPageHeader context="Provider response" />

        <section className="py-10">
          {preview ? (
            <div className="mb-8 rounded-2xl border border-[#8b6a31]/25 bg-[#f8f0df] px-5 py-4 text-sm leading-6 text-black/60">
              <strong className="text-[#1f1c17]">Preview only.</strong> This is the provider response page. You can test the fields below, but nothing entered here can be submitted.
            </div>
          ) : null}

          <p className="text-sm text-black/45">Production enquiry for {providerName}</p>
          <h1 className="mt-2 font-serif text-4xl leading-tight md:text-5xl">{product}</h1>
          {category ? <p className="mt-3 text-sm text-black/50">{category}</p> : null}

          <div className="mt-8 rounded-3xl border border-black/10 bg-white/70 p-6">
            <p className="text-xs uppercase tracking-[0.16em] text-black/40">Your part of the route</p>
            <div className="mt-4 flex flex-wrap gap-2">
              {relevantSteps.map((step) => (
                <span key={step} className="rounded-full border border-black/10 bg-white px-4 py-2 text-sm">{step}</span>
              ))}
            </div>
            <p className="mt-5 text-sm leading-6 text-black/55">
              {preview
                ? `This enquiry will be sent by WORKS on behalf of ${requesterName}. The provider response will apply to this production brief only.`
                : `This enquiry was sent by WORKS on behalf of ${requesterName}. Your response applies to this production brief only.`}
            </p>
          </div>

          {!preview && responded ? (
            <div className="mt-8 rounded-3xl border border-black/10 bg-white p-6 text-sm leading-6">
              A response has already been recorded for this brief. Submitting again will update the same response.
            </div>
          ) : null}

          <ProviderResponseForm token={token} preview={preview} />
        </section>
      </div>
    </main>
  );
}
