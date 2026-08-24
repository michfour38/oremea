import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { FounderConversationV2 } from "@/components/works/intake/founder-conversation-v2";
import { WorksPageHeader } from "@/components/works/works-brand";
import { listMarketCategories } from "@/lib/works/categories/list-market-categories";
import { resolveWorksMarket } from "@/lib/works/markets/resolve-market";

export const dynamic = "force-dynamic";

const WORKS_ORIGIN = "https://works.oremea.com";

export async function generateMetadata(props: { params: Promise<{ market: string }> }): Promise<Metadata> {
  const params = await props.params;
  const market = resolveWorksMarket(params.market);
  if (!market?.active) return {};

  const canonical = `${WORKS_ORIGIN}/works/${market.slug}`;
  return {
    title: "WORKS | Oremea",
    description: `Describe what you want to make. WORKS builds a production route and finds ${market.localName} manufacturers, suppliers and specialist providers that fit the brief.`,
    alternates: { canonical },
    openGraph: {
      title: `Make it in ${market.localName} with WORKS`,
      description: "Turn a product idea into a production route, provider matches and the questions that still need answering.",
      url: canonical,
      type: "website",
    },
  };
}

export default async function WorksMarketPage(
  props: {
    params: Promise<{ market: string }>;
  }
) {
  const params = await props.params;
  const market = resolveWorksMarket(params.market);
  if (!market?.active) notFound();

  const categories = await listMarketCategories(market.slug, market.defaultLocale);
  const canonical = `${WORKS_ORIGIN}/works/${market.slug}`;
  const structuredData = {
    "@context": "https://schema.org",
    "@type": "Service",
    name: `WORKS ${market.localName}`,
    serviceType: "Production provider discovery and sourcing",
    description: `WORKS helps buyers turn a product brief into a production route and find manufacturers, suppliers and specialist providers in ${market.localName}.`,
    areaServed: {
      "@type": "Country",
      name: market.localName,
    },
    provider: {
      "@type": "Organization",
      name: "Oremea",
    },
    url: canonical,
  };

  return (
    <main className="min-h-screen bg-[#f3eee4] text-[#1f1c17]">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
      />

      <div className="border-b border-black/10 bg-white/45">
        <div className="mx-auto flex w-full max-w-5xl flex-col gap-3 px-5 py-3 text-sm sm:flex-row sm:items-center sm:justify-between md:px-8">
          <span className="text-black/55">Need something made? Start below — no account required.</span>
          <div className="flex flex-wrap gap-x-5 gap-y-2">
            <a href="/works/providers/plans" className="font-medium underline underline-offset-4">For businesses</a>
            <a href="/works/provider" className="font-medium underline underline-offset-4">Manage my business</a>
          </div>
        </div>
      </div>

      <div className="mx-auto w-full max-w-3xl px-5 pt-8 md:px-8 md:pt-12">
        <WorksPageHeader context={`${market.localName} · Find a provider`} />

        <section className="mt-8 rounded-3xl border border-black/10 bg-white/55 p-5 md:p-7">
          <p className="font-serif text-3xl leading-tight md:text-4xl">From “I want to make this” to a route you can act on.</p>
          <p className="mt-4 max-w-2xl text-sm leading-7 text-black/55">
            Tell WORKS what you are making, where you are in the process and what a workable first run looks like. It builds the production steps, finds current provider fits and keeps unanswered questions visible instead of guessing.
          </p>
          <div className="mt-5 grid gap-2 text-sm text-black/60 sm:grid-cols-3">
            <span className="rounded-2xl border border-black/8 bg-white/65 px-4 py-3">1 · Build the brief</span>
            <span className="rounded-2xl border border-black/8 bg-white/65 px-4 py-3">2 · See the route</span>
            <span className="rounded-2xl border border-black/8 bg-white/65 px-4 py-3">3 · Reach suitable providers</span>
          </div>
        </section>
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

        .works-market-conversation [data-works-outreach-panel] + section.mt-8 {
          display: none;
        }
      `}</style>
    </main>
  );
}
