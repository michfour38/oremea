import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { FounderConversationV2 } from "@/components/works/intake/founder-conversation-v2";
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
      <FounderConversationV2
        market={{
          slug: market.slug,
          name: market.localName,
          geographyLabel: market.geography.level1Name,
          geographyValues: market.geography.values,
        }}
        categories={categories}
      />
    </main>
  );
}
