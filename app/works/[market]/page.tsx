import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { FounderConversationV2 } from "@/components/works/intake/founder-conversation-v2";
import { WorksPageHeader } from "@/components/works/works-brand";
import { listMarketCategories } from "@/lib/works/categories/list-market-categories";
import { resolveWorksMarket } from "@/lib/works/markets/resolve-market";
import {
  WORKS_BUYER_DESCRIPTION,
  WORKS_BUYER_TITLE,
  WORKS_ORGANIZATION_ID,
  WORKS_SERVICE_DESCRIPTION,
  WORKS_SERVICE_ID,
  WORKS_WEBSITE_ID,
  worksUrl,
} from "@/lib/works/seo";

export const dynamic = "force-dynamic";

export function generateMetadata({ params }: { params: { market: string } }): Metadata {
  const market = resolveWorksMarket(params.market);
  if (!market?.active) return {};

  const canonical = market.slug === "za" ? worksUrl("/") : worksUrl(`/${market.slug}`);
  return {
    title: market.slug === "za" ? WORKS_BUYER_TITLE : `Find manufacturers in ${market.localName} | WORKS`,
    description: market.slug === "za"
      ? WORKS_BUYER_DESCRIPTION
      : `Describe what you need made. WORKS maps the production route and finds manufacturers, suppliers and specialist providers in ${market.localName} that fit the brief.`,
    alternates: { canonical },
    openGraph: {
      title: `Make it in ${market.localName} with WORKS`,
      description: "Turn a product idea into a production route, provider matches and the questions that still need answering.",
      url: canonical,
      type: "website",
    },
  };
}

export default async function WorksMarketPage({
  params,
}: {
  params: { market: string };
}) {
  const market = resolveWorksMarket(params.market);
  if (!market?.active) notFound();

  const categories = await listMarketCategories(market.slug, market.defaultLocale);
  const canonical = market.slug === "za" ? worksUrl("/") : worksUrl(`/${market.slug}`);
  const structuredData = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "Organization",
        "@id": WORKS_ORGANIZATION_ID,
        name: "Oremea",
        url: "https://www.oremea.com",
      },
      {
        "@type": "WebSite",
        "@id": WORKS_WEBSITE_ID,
        name: "WORKS",
        url: canonical,
        publisher: { "@id": WORKS_ORGANIZATION_ID },
      },
      {
        "@type": "Service",
        "@id": WORKS_SERVICE_ID,
        name: `WORKS ${market.localName}`,
        serviceType: "Production route planning and provider matching",
        description: WORKS_SERVICE_DESCRIPTION,
        audience: {
          "@type": "BusinessAudience",
          audienceType: "Businesses and product founders who need something made",
        },
        areaServed: {
          "@type": "Country",
          name: market.localName,
        },
        provider: { "@id": WORKS_ORGANIZATION_ID },
        url: canonical,
      },
    ],
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

      <div className="mx-auto w-full max-w-3xl px-5 pt-5 md:px-8 md:pt-7">
        <WorksPageHeader
          context={`${market.localName} · Find a provider`}
          action={
            <a href="/works/my" className="rounded-full border border-black/15 bg-white/70 px-4 py-2 text-sm">
              My WORKS →
            </a>
          }
        />

        <section className="mt-5 rounded-3xl border border-black/10 bg-white/55 p-5 md:p-6">
          <h1 className="font-serif text-3xl leading-tight md:text-4xl">Know who can make it—and exactly what still needs confirming.</h1>
          <p className="mt-3 max-w-2xl text-sm leading-6 text-black/55">
            Describe the product once. WORKS maps the production steps, finds South African providers whose current offering fits and keeps unknowns visible instead of pretending they are answers.
          </p>
          <div className="mt-4 grid gap-2 text-sm text-black/60 sm:grid-cols-3">
            <span className="rounded-2xl border border-black/8 bg-white/65 px-4 py-3">1 · Build the brief</span>
            <span className="rounded-2xl border border-black/8 bg-white/65 px-4 py-3">2 · See the route</span>
            <span className="rounded-2xl border border-black/8 bg-white/65 px-4 py-3">3 · Reach suitable providers</span>
          </div>
          <div className="mt-4 border-t border-black/10 pt-4" aria-label="Important information before starting">
            <p className="text-[11px] font-medium uppercase tracking-[0.18em] text-[#16834f]">Before you describe it</p>
            <p className="mt-2 text-sm leading-6 text-black/60">
              Matches use the provider information currently available in WORKS. They are possible fits—not guarantees of capacity, final specifications, price or timing. Confirm those directly before appointing a provider.
            </p>
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
          embedded
        />
      </div>

      <style>{`
        .works-market-conversation [data-works-outreach-panel] + [data-works-sourcing-fallback] {
          display: none;
        }
      `}</style>
    </main>
  );
}
