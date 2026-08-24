"use client";

import { useMemo, useState } from "react";
import Link from "next/link";

type Product =
  | "all"
  | "resonance"
  | "compass"
  | "harmonize"
  | "current"
  | "recognition";

type Review = {
  id: string;
  product: Exclude<Product, "all">;
  productLabel: string;
  quote: string;
  displayName: string;
  role?: string;
  month: string;
  tags: string[];
  isVisibleOnMainReviews: boolean;
  hasObscuredWords?: boolean;
  status?: "pending" | "approved" | "hidden" | "blurred";
};

const reviews: Review[] = [
  {
    id: "r1",
    product: "resonance",
    productLabel: "Resonance",
    quote: "The pattern did not disappear. My ability to see it changed.",
    displayName: "Anonymous",
    role: "Parent",
    month: "June 2026",
    tags: ["Pattern awareness", "Recognition", "Ownership"],
    isVisibleOnMainReviews: true,
    status: "approved",
  },
  {
    id: "r2",
    product: "compass",
    productLabel: "Compass",
    quote: "It helped me stop circling the same thought and choose one next step.",
    displayName: "M.",
    month: "June 2026",
    tags: ["Clarity", "Direction", "Movement"],
    isVisibleOnMainReviews: true,
    status: "approved",
  },
  {
    id: "r3",
    product: "harmonize",
    productLabel: "Harmonize",
    quote: "I saw the space between us differently. It was not only about who was right.",
    displayName: "Anonymous",
    role: "Partner",
    month: "June 2026",
    tags: ["Relational insight", "Boundaries", "Perspective"],
    isVisibleOnMainReviews: false,
    status: "hidden",
  },
  {
    id: "r4",
    product: "current",
    productLabel: "The Current",
    quote: "It made connection feel less like performance and more like readiness.",
    displayName: "Anonymous",
    month: "June 2026",
    tags: ["Readiness", "Connection", "Stillness"],
    isVisibleOnMainReviews: false,
    status: "hidden",
  },
  {
    id: "r5",
    product: "resonance",
    productLabel: "Resonance",
    quote: "Holy ████. I finally saw what I had been doing for years.",
    displayName: "Anonymous",
    month: "June 2026",
    tags: ["Truth", "Recognition", "Clarity"],
    isVisibleOnMainReviews: true,
    hasObscuredWords: true,
    status: "blurred",
  },
  {
    id: "hidden-recognition-1",
    product: "recognition",
    productLabel: "Recognition",
    quote: "I thought this was a personality quiz. It was not.",
    displayName: "Anonymous",
    month: "June 2026",
    tags: ["Recognition", "Clarity"],
    isVisibleOnMainReviews: false,
    status: "approved",
  },
];

const productFilters: { key: Product; label: string }[] = [
  { key: "all", label: "All" },
  { key: "resonance", label: "Resonance" },
  { key: "compass", label: "Compass" },
];

const experienceFilters = [
  "Clarity",
  "Recognition",
  "Relief",
  "Direction",
  "Ownership",
  "Pattern awareness",
  "Boundaries",
  "Stillness",
];

export default function ReviewsPage() {
  const [productFilter, setProductFilter] = useState<Product>("all");
  const [experienceFilter, setExperienceFilter] = useState<string>("All");

  const visibleReviews = useMemo(() => {
    return reviews
      .filter((review) => review.isVisibleOnMainReviews)
      .filter((review) => review.status === "approved" || review.status === "blurred")
      .filter((review) => productFilter === "all" || review.product === productFilter)
      .filter((review) => experienceFilter === "All" || review.tags.includes(experienceFilter));
  }, [productFilter, experienceFilter]);

  const mostMentioned = ["Clarity", "Recognition", "Direction", "Ownership", "Stillness"];

  return (
    <main className="min-h-screen bg-[#0f0f0d] text-[#eaeaea]">
      <section className="mx-auto flex w-full max-w-6xl flex-col px-6 py-16 md:px-10 md:py-24">
        <Link
          href="/"
          className="mb-12 w-fit text-sm uppercase tracking-[0.28em] text-[#c6a96b]/80 hover:text-[#c6a96b]"
        >
          Oremea
        </Link>

        <div className="max-w-3xl">
          <p className="mb-4 text-sm uppercase tracking-[0.32em] text-[#c6a96b]">
            Not ratings. Reflections.
          </p>

          <h1 className="text-4xl font-light tracking-tight md:text-6xl">
            Oremea Reviews
          </h1>

          <p className="mt-6 text-lg leading-8 text-[#bfbfbf]">
            Private reflections from people who have used Oremea to see
            themselves, their patterns, or their next step more clearly.
          </p>

          <Link
            href="/reviews/share"
            className="mt-7 inline-flex rounded-full border border-[#c6a96b]/40 bg-[#c6a96b]/10 px-5 py-3 text-sm text-[#e5d4a6] transition hover:border-[#c6a96b]/70 hover:bg-[#c6a96b]/15"
          >
            Share your experience
          </Link>
        </div>

        <div className="mt-12 rounded-3xl border border-[#c6a96b]/20 bg-[#181713] p-6 md:p-8">
          <p className="text-xl text-[#eaeaea]">
            Oremea protects real reflections.
          </p>

          <p className="mt-4 max-w-4xl leading-7 text-[#bfbfbf]">
            Every reflection shared here comes from an Oremea experience.
            Some words may be obscured to protect community standards. Reviews
            are otherwise displayed as submitted. New submissions are reviewed
            by a person and are never published automatically.
          </p>
        </div>

        <div className="mt-10 grid gap-4 rounded-3xl border border-white/10 bg-white/[0.03] p-6 md:grid-cols-[1fr_2fr]">
          <div>
            <p className="text-sm uppercase tracking-[0.24em] text-[#c6a96b]">
              Most mentioned
            </p>
          </div>

          <div className="flex flex-wrap gap-2">
            {mostMentioned.map((word) => (
              <span
                key={word}
                className="rounded-full border border-[#c6a96b]/20 bg-[#c6a96b]/10 px-4 py-2 text-sm text-[#eaeaea]"
              >
                {word}
              </span>
            ))}
          </div>
        </div>

        <div className="mt-12">
          <p className="mb-4 text-sm uppercase tracking-[0.24em] text-[#bfbfbf]">
            Filter by product
          </p>

          <div className="flex flex-wrap gap-3">
            {productFilters.map((filter) => (
              <button
                key={filter.key}
                onClick={() => setProductFilter(filter.key)}
                className={`rounded-full border px-5 py-2 text-sm transition ${
                  productFilter === filter.key
                    ? "border-[#c6a96b] bg-[#c6a96b]/15 text-[#eaeaea]"
                    : "border-white/10 bg-white/[0.03] text-[#bfbfbf] hover:border-[#c6a96b]/40"
                }`}
              >
                {filter.label}
              </button>
            ))}
          </div>
        </div>

        <div className="mt-8">
          <p className="mb-4 text-sm uppercase tracking-[0.24em] text-[#bfbfbf]">
            Filter by experience
          </p>

          <div className="flex flex-wrap gap-3">
            {["All", ...experienceFilters].map((word) => (
              <button
                key={word}
                onClick={() => setExperienceFilter(word)}
                className={`rounded-full border px-5 py-2 text-sm transition ${
                  experienceFilter === word
                    ? "border-[#c6a96b] bg-[#c6a96b]/15 text-[#eaeaea]"
                    : "border-white/10 bg-white/[0.03] text-[#bfbfbf] hover:border-[#c6a96b]/40"
                }`}
              >
                {word}
              </button>
            ))}
          </div>
        </div>

        <section className="mt-12 grid gap-5">
          {visibleReviews.map((review) => (
            <article
              key={review.id}
              className="rounded-3xl border border-white/10 bg-[#151512] p-6 md:p-8"
            >
              <blockquote className="text-xl font-light leading-9 text-[#f1f1ef] md:text-2xl md:leading-10">
                “{review.quote}”
              </blockquote>

              {review.hasObscuredWords ? (
                <p className="mt-5 text-sm text-[#bfbfbf]">
                  Some words obscured.
                </p>
              ) : null}

              <div className="mt-7 flex flex-wrap items-center gap-3">
                <span className="rounded-full border border-[#c6a96b]/25 bg-[#c6a96b]/10 px-4 py-2 text-sm text-[#c6a96b]">
                  {review.productLabel}
                </span>

                {review.tags.map((tag) => (
                  <span
                    key={`${review.id}-${tag}`}
                    className="rounded-full border border-white/10 bg-white/[0.03] px-4 py-2 text-sm text-[#bfbfbf]"
                  >
                    {tag}
                  </span>
                ))}
              </div>

              <p className="mt-6 text-sm text-[#8f8f89]">
                — {review.displayName}
                {review.role ? `, ${review.role}` : ""} · {review.month}
              </p>
            </article>
          ))}

          {visibleReviews.length === 0 ? (
            <div className="rounded-3xl border border-white/10 bg-white/[0.03] p-8 text-[#bfbfbf]">
              No reflections found for this filter.
            </div>
          ) : null}
        </section>

        <section className="mt-16 rounded-3xl border border-[#c6a96b]/20 bg-[#181713] p-8 md:p-10">
          <p className="text-sm uppercase tracking-[0.28em] text-[#c6a96b]">
            Your experience belongs to you
          </p>

          <h2 className="mt-4 text-3xl font-light md:text-4xl">
            Share only what you choose to make public.
          </h2>

          <p className="mt-4 max-w-2xl leading-7 text-[#bfbfbf]">
            Oremea never pulls material from private conversations or archives into
            a review. A submitted reflection is reviewed before anything appears here.
          </p>

          <div className="mt-7 flex flex-wrap gap-4">
            <Link
              href="/reviews/share"
              className="inline-flex rounded-full border border-[#c6a96b]/40 bg-[#c6a96b]/10 px-5 py-3 text-sm text-[#e5d4a6] transition hover:border-[#c6a96b]/70"
            >
              Share your experience
            </Link>
            <Link
              href="/explore"
              className="inline-flex rounded-full border border-white/10 px-5 py-3 text-sm text-[#bfbfbf] transition hover:border-[#c6a96b]/40 hover:text-[#c6a96b]"
            >
              Explore Oremea
            </Link>
          </div>
        </section>
      </section>
    </main>
  );
}
