import type { Metadata } from "next";

import { WorksProviderBilling } from "@/components/works/provider/provider-billing";
import { WorksProviderNav } from "@/components/works/provider/provider-nav";
import { WorksPageHeader } from "@/components/works/works-brand";

export const metadata: Metadata = {
  title: "WORKS billing | Oremea",
  robots: { index: false, follow: false },
};

export default function WorksProviderBillingPage() {
  return (
    <main className="mx-auto min-h-screen w-full max-w-6xl px-5 py-8 md:px-8 md:py-12">
      <WorksPageHeader context="Provider billing" href="/works/provider" />
      <div className="mt-8">
        <WorksProviderNav current="/works/provider/billing" />
      </div>
      <div className="mt-8">
        <p className="text-xs font-medium uppercase tracking-[0.2em] text-[#16834f]">Plans & billing</p>
        <h1 className="mt-3 max-w-4xl font-serif text-4xl leading-tight text-[#1f1c17] md:text-5xl">Choose how WORKS participates in growing your business</h1>
        <p className="mt-4 max-w-3xl text-sm leading-7 text-black/55">Free keeps the business searchable. Active opens matched opportunity workflow. Growth adds active demand creation and deeper demand intelligence.</p>
      </div>
      <WorksProviderBilling />
    </main>
  );
}
