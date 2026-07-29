import { notFound } from "next/navigation";

import { prisma } from "@/lib/prisma";

export default async function WorksProviderPublicProfile({ params }: { params: { slug: string } }) {
  const provider = await prisma.works_providers.findUnique({
    where: { slug: params.slug },
    include: {
      commercial_profile: true,
      markets: { where: { active: true }, include: { market: true } },
      reviews: { where: { status: "PUBLISHED" }, orderBy: { created_at: "desc" }, take: 30 },
    },
  });

  if (!provider || provider.profile_status === "ARCHIVED") notFound();

  const reviews = provider.reviews;
  const average = reviews.length ? reviews.reduce((sum, review) => sum + review.rating, 0) / reviews.length : null;

  return (
    <main className="mx-auto min-h-screen w-full max-w-5xl px-5 py-10 md:px-8 md:py-14">
      <header className="border-b border-black/10 pb-5">
        <a href="/works/za" className="text-xs font-semibold uppercase tracking-[0.32em] text-[#16834f]">WORKS</a>
        <p className="mt-1 text-xs text-black/40">Provider profile · by Oremea</p>
      </header>

      <section className="py-10 md:py-14">
        <div className="flex flex-wrap items-start justify-between gap-6">
          <div>
            <p className="text-xs uppercase tracking-[0.18em] text-black/40">{provider.profile_status === "ACTIVE" ? "Active provider" : "WORKS provider"}</p>
            <h1 className="mt-2 font-serif text-4xl text-[#1f1c17] md:text-5xl">{provider.name}</h1>
            {provider.legal_name && provider.legal_name !== provider.name ? <p className="mt-2 text-sm text-black/40">{provider.legal_name}</p> : null}
          </div>
          {provider.commercial_profile?.capacity_status ? <span className="rounded-full border border-black/10 bg-white px-4 py-2 text-sm text-black/60">Capacity · {provider.commercial_profile.capacity_status.toLowerCase()}</span> : null}
        </div>

        {provider.description ? <p className="mt-7 max-w-3xl text-base leading-8 text-black/65">{provider.description}</p> : <p className="mt-7 max-w-3xl text-sm leading-6 text-black/40">This provider is still completing its public WORKS profile.</p>}

        <div className="mt-7 flex flex-wrap gap-x-6 gap-y-2 text-sm">
          {provider.website ? <a href={provider.website} target="_blank" rel="noreferrer" className="underline underline-offset-4">Website ↗</a> : null}
          {provider.email ? <a href={`mailto:${provider.email}`} className="underline underline-offset-4">Email</a> : null}
          {provider.phone ? <span className="text-black/55">{provider.phone}</span> : null}
        </div>

        {provider.markets.length ? <div className="mt-8 flex flex-wrap gap-2">{provider.markets.map((entry) => <span key={entry.id} className="rounded-full border border-black/10 bg-white/70 px-4 py-2 text-xs text-black/50">{entry.locality ?? entry.administrative_area ?? entry.market.name}</span>)}</div> : null}
      </section>

      <section className="border-t border-black/10 py-10">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div><p className="text-xs font-medium uppercase tracking-[0.18em] text-[#16834f]">Reviews</p><h2 className="mt-2 font-serif text-3xl text-[#1f1c17]">What founders experienced</h2></div>
          {average ? <p className="text-sm text-black/55"><strong className="text-[#1f1c17]">{average.toFixed(1)}</strong> / 5 · {reviews.length} review{reviews.length === 1 ? "" : "s"}</p> : null}
        </div>

        {reviews.length ? <div className="mt-7 grid gap-4 md:grid-cols-2">{reviews.map((review) => <article key={review.id} className="rounded-3xl border border-black/10 bg-white/70 p-6"><p className="text-sm">{"★".repeat(review.rating)}<span className="text-black/15">{"★".repeat(5 - review.rating)}</span></p><p className="mt-4 text-sm leading-7 text-black/65">{review.body}</p><p className="mt-4 text-xs text-black/40">{review.reviewer_name}{review.reviewer_company ? ` · ${review.reviewer_company}` : ""}{review.verified_brief ? " · Verified WORKS brief" : ""}</p>{review.provider_response ? <div className="mt-5 border-t border-black/8 pt-4"><p className="text-xs font-medium uppercase tracking-[0.14em] text-black/35">Response from {provider.name}</p><p className="mt-2 text-sm leading-6 text-black/55">{review.provider_response}</p></div> : null}</article>)}</div> : <div className="mt-7 rounded-3xl border border-black/10 bg-white/60 p-6 text-sm leading-6 text-black/45">No published reviews yet. Reviews from completed WORKS production relationships will appear here.</div>}
      </section>
    </main>
  );
}