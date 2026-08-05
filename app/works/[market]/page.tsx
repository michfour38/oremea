import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { FounderConversationV2 } from "@/components/works/intake/founder-conversation-v2";
import { WorksPageHeader } from "@/components/works/works-brand";
import { listMarketCategories } from "@/lib/works/categories/list-market-categories";
import { resolveWorksMarket } from "@/lib/works/markets/resolve-market";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "WORKS by Oremea",
  description:
    "From idea to production, find the South African people and businesses that can make your product happen.",
};

export default async function WorksMarketPage({
  params,
}: {
  params: { market: string };
}) {
  const market = resolveWorksMarket(params.market);
  if (!market?.active) notFound();

  const categories = await listMarketCategories(
    market.slug,
    market.defaultLocale
  );

  return (
    <main className="min-h-screen bg-[#f3eee4] text-[#1f1c17]">
      <div className="border-b border-black/10 bg-white/45">
        <div className="mx-auto flex w-full max-w-5xl flex-col gap-3 px-5 py-3 text-sm sm:flex-row sm:items-center sm:justify-between md:px-8">
          <span className="text-black/55">Need something made? Start your brief below.</span>
          <div className="flex flex-wrap gap-x-5 gap-y-2">
            <a href="/works/providers/join" className="font-medium underline underline-offset-4">List my business</a>
            <a href="/works/provider" className="font-medium underline underline-offset-4">Manage my business</a>
          </div>
        </div>
      </div>

      <div className="mx-auto w-full max-w-3xl px-5 pt-8 md:px-8 md:pt-12">
        <WorksPageHeader context={`${market.localName} · Find a provider`} />
      </div>

      <div className="works-market-conversation">
        <FounderConversationV2
          market={{
            slug: market.slug,
            name: market.localName,
            geographyLabel: market.geography.level1Name,
            geographyValues: market.geography.values,
          }}
          categories={categories}
        />
      </div>

      <style>{`
        .works-market-conversation > div > header:first-child {
          display: none;
        }

        .works-market-conversation > div {
          padding-top: 0;
        }
      `}</style>
    </main>
  );
}
