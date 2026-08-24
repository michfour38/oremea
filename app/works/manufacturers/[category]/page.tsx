import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { FounderConversationV2 } from "@/components/works/intake/founder-conversation-v2";
import { WorksPageHeader } from "@/components/works/works-brand";
import { prisma } from "@/lib/prisma";
import { listMarketCategories } from "@/lib/works/categories/list-market-categories";
import { resolveWorksMarket } from "@/lib/works/markets/resolve-market";
import {
  WORKS_ORGANIZATION_ID,
  WORKS_WEBSITE_ID,
  worksUrl,
} from "@/lib/works/seo";

export const dynamic = "force-dynamic";

async function categoryForSlug(slug: string) {
  const categories = await listMarketCategories("za", "en-ZA");
  return {
    categories,
    category: categories.find((item) => item.slug === slug.toLowerCase()) ?? null,
  };
}

export async function generateMetadata({
  params,
}: {
  params: { category: string };
}): Promise<Metadata> {
  const { category } = await categoryForSlug(params.category);
  if (!category) return { title: "Manufacturers in South Africa | WORKS" };

  const canonical = worksUrl(`/manufacturers/${category.slug}`);
  const title = `${category.name} manufacturers in South Africa | WORKS`;
  const description = `Find South African ${category.name.toLowerCase()} manufacturers and specialist providers. Describe the product, formula, packaging or service you need and WORKS maps the production route.`;
  return {
    title,
    description,
    alternates: { canonical },
    openGraph: {
      title,
      description,
      url: canonical,
      type: "website",
    },
  };
}

function evidenceLabel(status: string) {
  if (status === "VERIFIED") return "Verified offering";
  if (status === "SOURCE_REVIEWED") return "Source reviewed";
  return "Provider supplied · review pending";
}

export default async function WorksCategoryLandingPage({
  params,
}: {
  params: { category: string };
}) {
  const market = resolveWorksMarket("za");
  if (!market?.active) notFound();

  const { categories, category } = await categoryForSlug(params.category);
  if (!category) notFound();

  const categoryRecord = await prisma.works_categories.findUnique({
    where: { slug: category.slug },
    select: { id: true },
  });
  if (!categoryRecord) notFound();

  const providerMarkets = await prisma.works_provider_markets.findMany({
    where: {
      active: true,
      market: { slug: market.slug, active: true },
      provider: {
        profile_status: { not: "ARCHIVED" },
        slug: { not: "works-qa-supplier" },
      },
      offerings: {
        some: {
active: true,
categories: { some: { category_id: categoryRecord.id } },
        },
      },
    },
    select: {
      provider: {
        select: {
name: true,
slug: true,
description: true,
        },
      },
      offerings: {
        where: {
active: true,
categories: { some: { category_id: categoryRecord.id } },
        },
        select: { name: true, evidence_status: true },
        orderBy: { name: "asc" },
        take: 4,
      },
    },
    take: 16,
  });
  const providers = providerMarkets
    .sort((a, b) => a.provider.name.localeCompare(b.provider.name))
    .slice(0, 12);
  const canonical = worksUrl(`/manufacturers/${category.slug}`);
  const structuredData = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "CollectionPage",
        "@id": `${canonical}#page`,
        name: `${category.name} manufacturers in South Africa`,
        description: category.description,
        url: canonical,
        isPartOf: { "@id": WORKS_WEBSITE_ID },
      },
      {
        "@type": "Service",
        "@id": `${canonical}#service`,
        name: `${category.name} production matching in South Africa`,
        serviceType: `${category.name} manufacturing and production provider matching`,
        provider: { "@id": WORKS_ORGANIZATION_ID },
        areaServed: { "@type": "Country", name: "South Africa" },
        url: canonical,
      },
      {
        "@type": "ItemList",
        name: `Current WORKS ${category.name} providers`,
        itemListElement: providers.map((item, index) => ({
"@type": "ListItem",
position: index + 1,
item: {
  "@type": "Organization",
  name: item.provider.name,
  url: worksUrl(`/providers/${item.provider.slug}`),
},
        })),
      },
    ],
  };

  return (
    <main className="min-h-screen bg-[#f3eee4] text-[#1f1c17]">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
      />

      <div className="mx-auto w-full max-w-5xl px-5 pt-6 md:px-8 md:pt-9">
        <WorksPageHeader
context={`${market.localName} · ${category.name}`}
action={
  <a
    href={worksUrl("/")}
    className="rounded-full border border-black/15 bg-white/70 px-4 py-2 text-sm"
  >
    Start any brief →
  </a>
}
        />

        <section className="py-10 md:py-14">
<p className="text-xs font-medium uppercase tracking-[0.18em] text-[#16834f]">
  Find a production partner
</p>
<h1 className="mt-3 max-w-4xl font-serif text-4xl leading-tight md:text-6xl">
  {category.name} manufacturers in South Africa
</h1>
<p className="mt-5 max-w-3xl text-base leading-8 text-black/60">
  {category.description}
</p>
<p className="mt-3 max-w-3xl text-sm leading-7 text-black/50">
  Need formulation, manufacturing, filling, packaging, testing or another specialist production step? Describe the product, component, formula, packaging or service you need. WORKS maps the route and keeps unknowns visible instead of inventing certainty.
</p>
        </section>

        <section className="border-t border-black/10 py-8">
<div className="flex flex-wrap items-end justify-between gap-3">
  <div>
    <p className="text-xs font-medium uppercase tracking-[0.16em] text-black/40">
      Current public profiles
    </p>
    <h2 className="mt-2 font-serif text-3xl">
      {providers.length > 0
        ? `${providers.length} ${category.name.toLowerCase()} provider${providers.length === 1 ? "" : "s"} to explore`
        : `WORKS is still building this ${category.name.toLowerCase()} directory`}
    </h2>
  </div>
</div>

{providers.length > 0 ? (
  <div className="mt-6 grid gap-4 md:grid-cols-2">
    {providers.map((item) => (
      <article key={item.provider.slug} className="rounded-3xl border border-black/10 bg-white/70 p-5">
        <a
href={worksUrl(`/providers/${item.provider.slug}`)}
className="font-serif text-2xl underline-offset-4 hover:underline"
        >
{item.provider.name}
        </a>
        {item.provider.description ? (
<p className="mt-3 line-clamp-3 text-sm leading-6 text-black/55">
  {item.provider.description}
</p>
        ) : null}
        <div className="mt-4 space-y-2 border-t border-black/8 pt-4">
{item.offerings.map((offering) => (
  <div key={offering.name} className="flex items-start justify-between gap-3 text-xs">
    <span className="text-black/65">{offering.name}</span>
    <span className="shrink-0 text-black/40">{evidenceLabel(offering.evidence_status)}</span>
  </div>
))}
        </div>
      </article>
    ))}
  </div>
) : (
  <p className="mt-5 max-w-2xl text-sm leading-7 text-black/55">
    No public provider profile is strong enough to list here yet. The route builder below can still record the brief and let WORKS continue sourcing without pretending a match already exists.
  </p>
)}
<p className="mt-5 text-xs leading-5 text-black/40">
  A public listing is a possible fit, not a guarantee of current capacity, specification, price or timing. Confirm those directly before appointing a provider.
</p>
        </section>
      </div>

      <div className="border-t border-black/10 bg-white/25">
        <div className="mx-auto w-full max-w-3xl px-5 pt-8 md:px-8 md:pt-10">
<p className="text-xs font-medium uppercase tracking-[0.18em] text-[#16834f]">
  Build a {category.name.toLowerCase()} brief
</p>
<h2 className="mt-2 font-serif text-3xl md:text-4xl">
  Start with what you actually need.
</h2>
        </div>
        <FounderConversationV2
market={{
  slug: market.slug,
  name: market.localName,
  geographyLabel: market.geography.level1Name,
  geographyValues: market.geography.values,
}}
categories={categories}
embedded
initialCategoryKey={category.key}
        />
      </div>
    </main>
  );
}
