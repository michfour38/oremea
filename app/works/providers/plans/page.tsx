import type { Metadata } from "next";

import { WorksPageHeader } from "@/components/works/works-brand";
import { WORKS_PROVIDER_PLANS } from "@/lib/works/providers/public-plans";

const CANONICAL_URL = "https://works.oremea.com/works/providers/plans";

export const metadata: Metadata = {
  title: "WORKS provider plans | Oremea",
  description:
    "Compare WORKS Free, Active and Growth plans for South African manufacturers, suppliers and business-service providers.",
  alternates: { canonical: CANONICAL_URL },
};

export default function WorksProviderPlansPage() {
  return (
    <main className="min-h-screen bg-[#fbfaf7] text-[#1f1c17]">
      <div className="mx-auto w-full max-w-6xl px-5 py-8 md:px-8 md:py-12">
        <WorksPageHeader context="Provider plans" />

        <section className="py-10 md:py-14">
          <p className="text-xs font-medium uppercase tracking-[0.2em] text-[#16834f]">
            Grow through real demand
          </p>
          <h1 className="mt-3 max-w-4xl font-serif text-4xl leading-tight md:text-6xl">
            Choose how WORKS helps customers find and reach your business
          </h1>
          <p className="mt-5 max-w-3xl text-base leading-8 text-black/55">
            Start with a searchable profile, receive suitable opportunities, or actively build demand around the capability and capacity you want to grow.
          </p>

          <div className="mt-10 grid gap-4 lg:grid-cols-3">
            {WORKS_PROVIDER_PLANS.map((plan) => (
              <article
                key={plan.key}
                className={`relative rounded-3xl border bg-white p-6 ${
                  plan.recommended ? "border-[#16834f]/40 shadow-[0_18px_50px_rgba(22,131,79,0.08)]" : "border-black/10"
                }`}
              >
                {plan.recommended ? (
                  <span className="absolute right-5 top-5 rounded-full bg-[#eef7f1] px-3 py-1 text-[11px] font-medium uppercase tracking-[0.12em] text-[#16834f]">
                    Best place to start
                  </span>
                ) : null}
                <p className="text-xs uppercase tracking-[0.18em] text-black/40">{plan.name}</p>
                <p className="mt-3 font-serif text-3xl">{plan.priceLabel}</p>
                <p className="mt-4 min-h-20 text-sm leading-6 text-black/55">{plan.detail}</p>
                <div className="mt-6 space-y-2 border-t border-black/8 pt-5">
                  {plan.features.map((feature) => (
                    <p key={feature} className="text-sm leading-6 text-black/65">
                      ✓ {feature}
                    </p>
                  ))}
                </div>

                <a
                  href={plan.key === "FREE" ? "/works/providers/join?tab=business&mode=add" : "/works/providers/join"}
                  className={`mt-7 inline-flex rounded-full px-5 py-2.5 text-sm font-medium ${
                    plan.recommended
                      ? "bg-[#1f1c17] text-white"
                      : "border border-black/15 bg-white text-[#1f1c17]"
                  }`}
                >
                  {plan.key === "FREE" ? "List my business →" : `Connect my business for ${plan.name} →`}
                </a>
              </article>
            ))}
          </div>

          <div className="mt-8 grid gap-4 rounded-3xl border border-black/10 bg-[#f3eee4] p-6 md:grid-cols-2 md:p-8">
            <div>
              <p className="text-xs font-medium uppercase tracking-[0.16em] text-black/40">What paid plans buy</p>
              <p className="mt-2 text-sm leading-7 text-black/60">
                Workflow, opportunity routing, demand creation and better control over the work your business wants to receive.
              </p>
            </div>
            <div>
              <p className="text-xs font-medium uppercase tracking-[0.16em] text-black/40">What they never buy</p>
              <p className="mt-2 text-sm leading-7 text-black/60">
                Ranking, credentials, verification status, favourable reviews or a guaranteed number of enquiries, contracts or filled capacity.
              </p>
            </div>
          </div>

          <div className="mt-8 flex flex-wrap gap-3">
            <a href="/works/providers/join" className="rounded-full bg-[#1f1c17] px-6 py-3 text-sm text-white">
              Add or connect my business →
            </a>
            <a href="/works/za" className="rounded-full border border-black/15 bg-white px-6 py-3 text-sm">
              I need something made
            </a>
          </div>
        </section>
      </div>
    </main>
  );
}
