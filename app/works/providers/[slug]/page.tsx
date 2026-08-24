import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { WorksPageHeader } from "@/components/works/works-brand";
import { prisma } from "@/lib/prisma";
import {
  isWorksEvidenceFresh,
  worksEvidencePublicLabel,
} from "@/lib/works/evidence/freshness";
import { worksUrl } from "@/lib/works/seo";

const DEFAULT_VISIBILITY = {
  show_legal_name: false,
  show_website: true,
  show_email: false,
  show_phone: false,
  show_description: true,
  show_location: false,
  show_capacity: false,
};

async function getProvider(slug: string) {
  return prisma.works_providers.findUnique({
    where: { slug },
    include: {
      public_settings: true,
      commercial_profile: true,
      markets: {
        where: { active: true },
        include: {
          market: true,
          offerings: {
            where: { active: true },
            orderBy: { name: "asc" },
            select: {
              id: true,
              name: true,
              description: true,
              production_model: true,
              moq_value: true,
              moq_unit: true,
              max_run_value: true,
              max_run_unit: true,
              lead_time_min_days: true,
              lead_time_max_days: true,
              lead_time_basis: true,
              evidence_status: true,
              updated_at: true,
              categories: {
                select: {
                  category: {
                    select: {
                      key: true,
                      translations: {
                        where: { locale: { code: "en-ZA" } },
                        select: { name: true },
                        take: 1,
                      },
                    },
                  },
                },
              },
              services: {
                select: {
                  service: {
                    select: {
                      key: true,
                      translations: {
                        where: { locale: { code: "en-ZA" } },
                        select: { name: true },
                        take: 1,
                      },
                    },
                  },
                },
              },
              capabilities: {
                select: {
                  capability: {
                    select: {
                      key: true,
                      translations: {
                        where: { locale: { code: "en-ZA" } },
                        select: { name: true },
                        take: 1,
                      },
                    },
                  },
                },
              },
            },
          },
        },
      },
      reviews: { where: { status: "PUBLISHED" }, orderBy: { created_at: "desc" }, take: 30 },
    },
  });
}

export async function generateMetadata({ params }: { params: { slug: string } }): Promise<Metadata> {
  const provider = await getProvider(params.slug);
  if (!provider || provider.profile_status === "ARCHIVED") return {};

  const visibility = provider.public_settings ?? DEFAULT_VISIBILITY;
  const canonical = worksUrl(`/providers/${provider.slug}`);
  const description = visibility.show_description && provider.description
    ? provider.description.slice(0, 155)
    : `${provider.name} is listed on WORKS, where buyers find South African manufacturers, suppliers and specialist production providers.`;

  return {
    title: `${provider.name} | WORKS manufacturer profile`,
    description,
    robots: provider.slug === "works-qa-supplier" ? { index: false, follow: false } : undefined,
    alternates: { canonical },
    openGraph: {
      title: `${provider.name} | WORKS`,
      description,
      url: canonical,
      type: "website",
    },
  };
}

export default async function WorksProviderPublicProfile({ params }: { params: { slug: string } }) {
  const provider = await getProvider(params.slug);
  if (!provider || provider.profile_status === "ARCHIVED") notFound();

  const visibility = provider.public_settings ?? DEFAULT_VISIBILITY;
  const reviews = provider.reviews;
  const average = reviews.length ? reviews.reduce((sum, review) => sum + review.rating, 0) / reviews.length : null;
  const canonical = worksUrl(`/providers/${provider.slug}`);
  const now = new Date();
  const offerings = provider.markets.flatMap((providerMarket) =>
    providerMarket.offerings.map((offering) => ({
      ...offering,
      marketName: providerMarket.market.name,
      categories: offering.categories.map((row) => row.category.translations[0]?.name ?? row.category.key),
      services: offering.services.map((row) => row.service.translations[0]?.name ?? row.service.key),
      capabilities: offering.capabilities.map((row) => row.capability.translations[0]?.name ?? row.capability.key),
    }))
  );

  const structuredData: Record<string, unknown> = {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: provider.name,
    url: canonical,
  };

  if (visibility.show_legal_name && provider.legal_name) structuredData.legalName = provider.legal_name;
  if (visibility.show_description && provider.description) structuredData.description = provider.description;
  if (visibility.show_website && provider.website) structuredData.sameAs = [provider.website];
  if (visibility.show_email && provider.email) structuredData.email = provider.email;
  if (visibility.show_phone && provider.phone) structuredData.telephone = provider.phone;
  const reviewedOffers = offerings.filter(
    (offering) =>
      offering.evidence_status !== "SELF_REPORTED" &&
      isWorksEvidenceFresh(offering.updated_at, now)
  );
  if (reviewedOffers.length) {
    structuredData.makesOffer = reviewedOffers.map((offering) => ({
      "@type": "Offer",
      name: offering.name,
      url: `${canonical}#offering-${offering.id}`,
      itemOffered: {
        "@type": "Service",
        name: offering.name,
        ...(offering.description ? { description: offering.description } : {}),
        ...(offering.services.length ? { serviceType: offering.services } : {}),
        areaServed: { "@type": "Country", name: offering.marketName },
        additionalProperty: [
          {
            "@type": "PropertyValue",
            name: "WORKS evidence status",
            value: worksEvidencePublicLabel(
              offering.evidence_status,
              offering.updated_at,
              now,
            ),
          },
        ],
      },
    }));
  }
  if (average) {
    structuredData.aggregateRating = {
      "@type": "AggregateRating",
      ratingValue: Number(average.toFixed(1)),
      reviewCount: reviews.length,
      bestRating: 5,
      worstRating: 1,
    };
  }

  return (
    <main className="mx-auto min-h-screen w-full max-w-5xl px-5 py-10 md:px-8 md:py-14">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
      />

      <WorksPageHeader
        context="Public business profile"
        action={
          <a href="/works/za" className="rounded-full bg-[#1f1c17] px-5 py-2.5 text-sm text-white">
            Start my brief →
          </a>
        }
      />

      <section className="py-10 md:py-14">
        <div className="flex flex-wrap items-start justify-between gap-6">
          <div>
            <p className="text-xs uppercase tracking-[0.18em] text-black/40">{provider.profile_status === "ACTIVE" ? "Active WORKS business" : "WORKS business"}</p>
            <h1 className="mt-2 font-serif text-4xl text-[#1f1c17] md:text-5xl">{provider.name}</h1>
            {visibility.show_legal_name && provider.legal_name && provider.legal_name !== provider.name ? <p className="mt-2 text-sm text-black/40">{provider.legal_name}</p> : null}
          </div>
          {visibility.show_capacity && provider.commercial_profile?.capacity_status ? <span className="rounded-full border border-black/10 bg-white px-4 py-2 text-sm text-black/60">Capacity · {provider.commercial_profile.capacity_status.toLowerCase()}</span> : null}
        </div>

        {visibility.show_description ? (provider.description ? <p className="mt-7 max-w-3xl text-base leading-8 text-black/65">{provider.description}</p> : <p className="mt-7 max-w-3xl text-sm leading-6 text-black/40">This business is still completing its public WORKS profile.</p>) : null}

        <div className="mt-7 flex flex-wrap gap-x-6 gap-y-2 text-sm">
          {visibility.show_website && provider.website ? <a href={provider.website} target="_blank" rel="noreferrer" className="underline underline-offset-4">Website ↗</a> : null}
          {visibility.show_email && provider.email ? <a href={`mailto:${provider.email}`} className="underline underline-offset-4">Email</a> : null}
          {visibility.show_phone && provider.phone ? <span className="text-black/55">{provider.phone}</span> : null}
        </div>

        {visibility.show_location && provider.markets.length ? <div className="mt-8 flex flex-wrap gap-2">{provider.markets.map((entry) => <span key={entry.id} className="rounded-full border border-black/10 bg-white/70 px-4 py-2 text-xs text-black/50">{entry.locality ?? entry.administrative_area ?? entry.market.name}</span>)}</div> : null}

        {offerings.length ? (
          <section className="mt-10 border-t border-black/10 pt-9" aria-labelledby="provider-offerings">
            <p className="text-xs font-medium uppercase tracking-[0.18em] text-[#16834f]">Current offerings</p>
            <h2 id="provider-offerings" className="mt-2 font-serif text-3xl text-[#1f1c17]">What {provider.name} can help with</h2>
            <p className="mt-3 max-w-3xl text-sm leading-7 text-black/50">Each offering shows where its information came from and whether reviewed evidence is still current enough for WORKS to rely on. Final specifications, capacity, timing and price still need direct confirmation.</p>
            <div className="mt-6 grid gap-4 md:grid-cols-2">
              {offerings.map((offering) => {
                const evidenceLabel = worksEvidencePublicLabel(
                  offering.evidence_status,
                  offering.updated_at,
                  now,
                );
                const minimumOrder = offering.moq_value == null
                  ? null
                  : `${Number(offering.moq_value).toLocaleString("en-ZA")} ${offering.moq_unit?.toLowerCase() ?? "units"}`;
                const maximumRun = offering.max_run_value == null
                  ? null
                  : `${Number(offering.max_run_value).toLocaleString("en-ZA")} ${offering.max_run_unit?.toLowerCase() ?? "units"}`;
                const leadTime = offering.lead_time_min_days == null && offering.lead_time_max_days == null
                  ? null
                  : `${offering.lead_time_min_days ?? "?"}–${offering.lead_time_max_days ?? "?"} days`;

                return (
                  <article id={`offering-${offering.id}`} key={offering.id} className="rounded-3xl border border-black/10 bg-white/70 p-6">
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <h3 className="font-serif text-2xl text-[#1f1c17]">{offering.name}</h3>
                      <span className="rounded-full border border-black/10 bg-[#f3eee4] px-3 py-1 text-[11px] text-black/50">{evidenceLabel}</span>
                    </div>
                    {offering.description ? <p className="mt-3 text-sm leading-7 text-black/55">{offering.description}</p> : null}
                    {offering.services.length ? <p className="mt-4 text-xs leading-6 text-black/50"><strong className="font-medium text-black/70">Services:</strong> {offering.services.join(", ")}</p> : null}
                    {offering.capabilities.length ? <p className="mt-1 text-xs leading-6 text-black/50"><strong className="font-medium text-black/70">Capabilities:</strong> {offering.capabilities.join(", ")}</p> : null}
                    {offering.categories.length ? <p className="mt-1 text-xs leading-6 text-black/50"><strong className="font-medium text-black/70">Categories:</strong> {offering.categories.join(", ")}</p> : null}
                    {minimumOrder || maximumRun || leadTime || offering.production_model ? (
                      <div className="mt-4 flex flex-wrap gap-2 text-[11px] text-black/50">
                        {offering.production_model ? <span className="rounded-full bg-[#f3eee4] px-3 py-1.5">{offering.production_model.replaceAll("_", " ").toLowerCase()}</span> : null}
                        {minimumOrder ? <span className="rounded-full bg-[#f3eee4] px-3 py-1.5">MOQ · {minimumOrder}</span> : null}
                        {maximumRun ? <span className="rounded-full bg-[#f3eee4] px-3 py-1.5">Run up to · {maximumRun}</span> : null}
                        {leadTime ? <span className="rounded-full bg-[#f3eee4] px-3 py-1.5">Lead time · {leadTime}</span> : null}
                      </div>
                    ) : null}
                  </article>
                );
              })}
            </div>
          </section>
        ) : null}

        <div className="mt-8 rounded-2xl border border-black/10 bg-[#f3eee4] p-5 text-sm leading-7 text-black/55">
          WORKS matches businesses against the requirements in a buyer&apos;s brief. Start with what you need made so the route can distinguish confirmed fits, possible fits and details that still need checking.
          <a href="/works/za" className="ml-2 font-medium text-[#1f1c17] underline underline-offset-4">Build my route →</a>
        </div>
      </section>

      <section className="border-t border-black/10 py-10">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div><p className="text-xs font-medium uppercase tracking-[0.18em] text-[#16834f]">Reviews</p><h2 className="mt-2 font-serif text-3xl text-[#1f1c17]">What customers experienced</h2></div>
          {average ? <p className="text-sm text-black/55"><strong className="text-[#1f1c17]">{average.toFixed(1)}</strong> / 5 · {reviews.length} review{reviews.length === 1 ? "" : "s"}</p> : null}
        </div>

        {reviews.length ? <div className="mt-7 grid gap-4 md:grid-cols-2">{reviews.map((review) => {
          const reviewer = review.public_identity ? (review.reviewer_name ?? "WORKS customer") : "WORKS customer";
          const company = review.public_identity && review.reviewer_company ? ` · ${review.reviewer_company}` : "";
          return <article key={review.id} className="rounded-3xl border border-black/10 bg-white/70 p-6"><p className="text-sm">{"★".repeat(review.rating)}<span className="text-black/15">{"★".repeat(5 - review.rating)}</span></p><p className="mt-4 text-sm leading-7 text-black/65">{review.body}</p><p className="mt-4 text-xs text-black/40">{reviewer}{company}{review.verified_brief ? " · Verified WORKS brief" : ""}</p>{review.provider_response ? <div className="mt-5 border-t border-black/8 pt-4"><p className="text-xs font-medium uppercase tracking-[0.14em] text-black/35">Response from {provider.name}</p><p className="mt-2 text-sm leading-6 text-black/55">{review.provider_response}</p></div> : null}</article>;
        })}</div> : <div className="mt-7 rounded-3xl border border-black/10 bg-white/60 p-6 text-sm leading-6 text-black/45">No published reviews yet. Reviews from genuine WORKS interactions will appear here.</div>}
      </section>

      <section className="border-t border-black/10 py-10 text-center">
        <p className="text-xs font-medium uppercase tracking-[0.18em] text-[#16834f]">Ready to source?</p>
        <h2 className="mx-auto mt-3 max-w-2xl font-serif text-3xl leading-tight md:text-4xl">Describe what you need. Let WORKS build the route.</h2>
        <a href="/works/za" className="mt-6 inline-flex rounded-full bg-[#1f1c17] px-6 py-3 text-sm font-medium text-white">Start my brief →</a>
      </section>
    </main>
  );
}
