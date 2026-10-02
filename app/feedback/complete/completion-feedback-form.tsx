"use client";

import Link from "next/link";
import { FormEvent, useEffect, useMemo, useState } from "react";

const KNOWN_PRODUCTS = new Set([
  "Recognition",
  "Compass",
  "Resonance · The Hearth",
  "Resonance · Mirror",
  "Resonance · Garden",
  "Resonance · Bearing",
  "Resonance · Pulse",
  "Resonance · Shadow",
  "Resonance · Forge",
  "Resonance · Vision",
  "Resonance · Gathering",
  "Resonance · Becoming",
  "Oremea generally",
]);

const SCORE_BUTTON_BASE =
  "flex min-w-0 items-center justify-center rounded-xl border font-medium transition focus:outline-none focus-visible:ring-2 focus-visible:ring-[#d7bb78]/70 focus-visible:ring-offset-2 focus-visible:ring-offset-[#0b0906]";

function ScoreScale({
  label,
  value,
  onChange,
  lowLabel,
  highLabel,
}: {
  label: string;
  value: number | null;
  onChange: (value: number) => void;
  lowLabel: string;
  highLabel: string;
}) {
  return (
    <fieldset className="min-w-0">
      <legend className="max-w-2xl font-serif text-[17px] leading-7 text-zinc-100 sm:text-lg">
        {label}
      </legend>

      <div className="mt-4 grid grid-cols-5 gap-2" role="radiogroup" aria-label={label}>
        {[1, 2, 3, 4, 5].map((score) => {
          const selected = value === score;
          return (
            <button
              key={score}
              type="button"
              role="radio"
              aria-checked={selected}
              aria-label={`${score} out of 5`}
              onClick={() => onChange(score)}
              className={`${SCORE_BUTTON_BASE} h-12 text-sm sm:h-14 sm:text-base ${
                selected
                  ? "border-[#d7bb78] bg-[#c6a96b]/20 text-[#f4e5ba] shadow-[0_0_28px_rgba(198,169,107,0.13)]"
                  : "border-white/10 bg-black/30 text-zinc-400 hover:border-[#c6a96b]/45 hover:bg-[#c6a96b]/[0.06] hover:text-zinc-100"
              }`}
            >
              {score}
            </button>
          );
        })}
      </div>

      <div className="mt-2 flex items-center justify-between gap-4 text-[11px] leading-5 text-zinc-500 sm:text-xs">
        <span>{lowLabel}</span>
        <span className="text-right">{highLabel}</span>
      </div>
    </fieldset>
  );
}

function RecommendationScale({
  product,
  value,
  onChange,
}: {
  product: string;
  value: number | null;
  onChange: (value: number) => void;
}) {
  const label = `How likely are you to recommend ${product} to someone looking for private reflective support with a situation, question, relationship or pattern?`;

  return (
    <fieldset className="min-w-0">
      <legend className="max-w-2xl font-serif text-[17px] leading-7 text-zinc-100 sm:text-lg">
        {label}
      </legend>

      <div
        className="mt-4 grid grid-cols-6 gap-2 sm:grid-cols-11"
        role="radiogroup"
        aria-label={label}
      >
        {Array.from({ length: 11 }, (_, index) => index).map((score) => {
          const selected = value === score;
          return (
            <button
              key={score}
              type="button"
              role="radio"
              aria-checked={selected}
              aria-label={`${score} out of 10`}
              onClick={() => onChange(score)}
              className={`${SCORE_BUTTON_BASE} h-11 text-xs sm:h-12 sm:text-sm ${
                selected
                  ? "border-[#d7bb78] bg-[#c6a96b]/20 text-[#f4e5ba] shadow-[0_0_28px_rgba(198,169,107,0.13)]"
                  : "border-white/10 bg-black/30 text-zinc-400 hover:border-[#c6a96b]/45 hover:bg-[#c6a96b]/[0.06] hover:text-zinc-100"
              }`}
            >
              {score}
            </button>
          );
        })}
      </div>

      <div className="mt-2 flex items-center justify-between gap-4 text-[11px] leading-5 text-zinc-500 sm:text-xs">
        <span>Not likely</span>
        <span className="text-right">Very likely</span>
      </div>
    </fieldset>
  );
}

function SectionHeader({
  number,
  title,
  description,
}: {
  number: string;
  title: string;
  description: string;
}) {
  return (
    <div className="mb-6 flex min-w-0 items-start gap-4 border-b border-white/[0.07] pb-5">
      <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-[#c6a96b]/30 bg-[#c6a96b]/[0.07] text-[10px] tracking-[0.14em] text-[#d9bf80]">
        {number}
      </span>
      <div className="min-w-0">
        <h2 className="font-serif text-xl text-zinc-100 sm:text-2xl">{title}</h2>
        <p className="mt-1 max-w-2xl text-xs leading-6 text-zinc-500 sm:text-sm">
          {description}
        </p>
      </div>
    </div>
  );
}

const TEXTAREA_CLASS =
  "mt-3 w-full min-w-0 resize-y rounded-2xl border border-white/10 bg-black/30 px-4 py-3.5 text-sm leading-7 text-zinc-100 outline-none transition placeholder:text-zinc-600 hover:border-white/15 focus:border-[#c6a96b]/60 focus:bg-black/40 focus:ring-1 focus:ring-[#c6a96b]/20";

export default function CompletionFeedbackForm() {
  const [product, setProduct] = useState("Oremea generally");
  const [source, setSource] = useState("completion");
  const [beforeClarity, setBeforeClarity] = useState<number | null>(null);
  const [afterClarity, setAfterClarity] = useState<number | null>(null);
  const [fitScore, setFitScore] = useState<number | null>(null);
  const [recommendScore, setRecommendScore] = useState<number | null>(null);
  const [whatChanged, setWhatChanged] = useState("");
  const [mostUseful, setMostUseful] = useState("");
  const [improvement, setImprovement] = useState("");
  const [anythingElse, setAnythingElse] = useState("");
  const [website, setWebsite] = useState("");
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);
  const [notice, setNotice] = useState("");
  const returnHref =
    source === "resonance-complete" ? "/entry" : "https://www.oremea.com";
  const returnLabel =
    source === "resonance-complete" ? "Return to your rooms" : "Return to Oremea";

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const requestedProduct = params.get("product") || "Oremea generally";
    setProduct(
      KNOWN_PRODUCTS.has(requestedProduct)
        ? requestedProduct
        : "Oremea generally",
    );
    setSource((params.get("source") || "completion").slice(0, 180));
  }, []);

  const productLabel = product === "Oremea generally" ? "Oremea" : product;

  const reviewHref = useMemo(
    () =>
      `https://www.oremea.com/reviews/share?product=${encodeURIComponent(product)}`,
    [product],
  );

  const requiredRatingsComplete =
    beforeClarity !== null &&
    afterClarity !== null &&
    fitScore !== null &&
    recommendScore !== null;

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!requiredRatingsComplete || sending) return;

    setSending(true);
    setSent(false);
    setNotice("");

    try {
      const response = await fetch("/api/feedback/submit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          product,
          category: "completion",
          beforeClarity,
          afterClarity,
          fitScore,
          recommendScore,
          whatChanged,
          mostUseful,
          improvement,
          anythingElse,
          source,
          website,
        }),
      });
      const data = await response.json().catch(() => null);

      if (!response.ok || !data?.success) {
        throw new Error(data?.error || "Your survey could not be saved yet.");
      }

      setSent(true);
      setNotice(data.message || "Thank you. Your survey was saved privately.");
    } catch (error) {
      setNotice(
        error instanceof Error
          ? error.message
          : "Your survey could not be saved yet.",
      );
    } finally {
      setSending(false);
    }
  }

  if (sent) {
    return (
      <div className="min-w-0 overflow-hidden rounded-[2rem] border border-[#c6a96b]/25 bg-[#090704]/85 shadow-2xl shadow-black/30 backdrop-blur-xl sm:rounded-[2.35rem]">
        <div className="border-b border-[#c6a96b]/15 bg-[#c6a96b]/[0.055] px-5 py-6 sm:px-8 sm:py-8">
          <p className="text-[10px] uppercase tracking-[0.28em] text-[#c6a96b] sm:text-xs">
            Survey complete
          </p>
          <h2 className="mt-3 font-serif text-3xl text-zinc-100 sm:text-4xl">
            Thank you.
          </h2>
          <p className="mt-3 max-w-2xl text-sm leading-7 text-zinc-400">
            {notice} Nothing from this survey is published automatically.
          </p>
        </div>

        <div className="p-5 sm:p-8">
          <div className="rounded-[1.75rem] border border-white/10 bg-white/[0.025] p-5 sm:p-6">
            <p className="font-serif text-lg text-zinc-100">
              Would you like to leave a public review?
            </p>
            <p className="mt-2 text-sm leading-7 text-zinc-400">
              That is separate from this survey. Only the reflection you deliberately
              submit on the Reviews page can be considered for publication.
            </p>
            <Link
              href={reviewHref}
              className="mt-5 inline-flex rounded-full border border-[#c6a96b]/45 bg-[#c6a96b]/10 px-5 py-3 text-sm text-[#ead9aa] transition hover:border-[#c6a96b]/70 hover:bg-[#c6a96b]/15"
            >
              Leave a public review
            </Link>
          </div>

          <Link
            href={returnHref}
            className="mt-5 inline-flex rounded-full border border-white/10 px-5 py-3 text-sm text-zinc-400 transition hover:border-[#c6a96b]/40 hover:text-[#c6a96b]"
          >
            {returnLabel}
          </Link>
        </div>
      </div>
    );
  }

  return (
    <form
      onSubmit={submit}
      className="min-w-0 overflow-hidden rounded-[2rem] border border-[#c6a96b]/20 bg-[#090704]/85 shadow-2xl shadow-black/30 backdrop-blur-xl sm:rounded-[2.35rem]"
    >
      <div className="min-w-0 border-b border-[#c6a96b]/15 bg-[#c6a96b]/[0.055] px-5 py-5 sm:px-8 sm:py-7">
        <div className="flex min-w-0 flex-col gap-4 sm:flex-row sm:items-start sm:justify-between sm:gap-6">
          <div className="min-w-0">
            <p className="break-words text-[10px] uppercase tracking-[0.28em] text-[#d5b971] sm:text-xs">
              {product}
            </p>
            <p className="mt-2 max-w-2xl break-words font-serif text-[17px] leading-7 text-zinc-200 sm:text-lg">
              A private closing reflection on how {productLabel} worked for you.
            </p>
          </div>
          <div className="flex shrink-0 flex-wrap gap-2 text-[10px] uppercase tracking-[0.14em] text-zinc-500">
            <span className="rounded-full border border-white/10 bg-black/20 px-3 py-1.5">
              Private
            </span>
            <span className="rounded-full border border-white/10 bg-black/20 px-3 py-1.5">
              Not published
            </span>
          </div>
        </div>
        <p className="mt-4 max-w-3xl break-words text-xs leading-6 text-zinc-500 sm:text-sm sm:leading-7">
          This is the full completion survey. It is private and separate from the
          Feedback button and the public Reviews page. The four ratings are required;
          the written reflections are optional.
        </p>
      </div>

      <div className="space-y-4 p-4 sm:space-y-5 sm:p-6 md:p-8">
        <section className="min-w-0 rounded-[1.75rem] border border-white/[0.08] bg-white/[0.022] p-5 sm:p-6">
          <SectionHeader
            number="01"
            title="Clarity shift"
            description="Compare how clearly you could see what brought you in before you began with how clearly you see the same material now."
          />
          <div className="grid min-w-0 gap-7 lg:grid-cols-2 lg:gap-6">
            <ScoreScale
              label={`Before starting ${productLabel}, how clearly could you see the situation, question, relationship or pattern you brought in?`}
              value={beforeClarity}
              onChange={setBeforeClarity}
              lowLabel="Not clear"
              highLabel="Very clear"
            />
            <ScoreScale
              label={`After completing ${productLabel}, how clearly can you see that same situation, question, relationship or pattern now?`}
              value={afterClarity}
              onChange={setAfterClarity}
              lowLabel="Not clear"
              highLabel="Very clear"
            />
          </div>
        </section>

        <section className="min-w-0 rounded-[1.75rem] border border-white/[0.08] bg-white/[0.022] p-5 sm:p-6">
          <SectionHeader
            number="02"
            title={`Did ${productLabel} meet the need?`}
            description={`Rate ${productLabel} against the reason you chose to begin.`}
          />
          <ScoreScale
            label={`How well did ${productLabel} help with the situation, question, relationship or pattern you brought in?`}
            value={fitScore}
            onChange={setFitScore}
            lowLabel="Not at all"
            highLabel="Exactly"
          />
        </section>

        <section className="min-w-0 rounded-[1.75rem] border border-white/[0.08] bg-white/[0.022] p-5 sm:p-6">
          <SectionHeader
            number="03"
            title={`Would you recommend ${productLabel}?`}
            description={`Rate only the experience you actually had with ${productLabel}.`}
          />
          <RecommendationScale
            product={productLabel}
            value={recommendScore}
            onChange={setRecommendScore}
          />
        </section>

        <section className="min-w-0 rounded-[1.75rem] border border-white/[0.08] bg-white/[0.022] p-5 sm:p-6">
          <SectionHeader
            number="04"
            title="In your own words"
            description="Optional. Say as much or as little as is useful; these answers remain part of the private completion survey."
          />

          <div className="grid min-w-0 gap-5 md:grid-cols-2">
            <label className="block min-w-0 text-sm leading-6 text-zinc-200">
              What changed in how you see the situation, question, relationship or pattern you brought in?
              <textarea
                value={whatChanged}
                onChange={(event) => setWhatChanged(event.target.value)}
                maxLength={5000}
                rows={5}
                placeholder="Describe any change in your own words."
                className={TEXTAREA_CLASS}
              />
            </label>

            <label className="block min-w-0 text-sm leading-6 text-zinc-200">
              What part of {productLabel} was most useful?
              <textarea
                value={mostUseful}
                onChange={(event) => setMostUseful(event.target.value)}
                maxLength={5000}
                rows={5}
                placeholder="Name the part that helped most."
                className={TEXTAREA_CLASS}
              />
            </label>

            <label className="block min-w-0 text-sm leading-6 text-zinc-200">
              What part of {productLabel} could work better?
              <textarea
                value={improvement}
                onChange={(event) => setImprovement(event.target.value)}
                maxLength={5000}
                rows={5}
                placeholder="Anything confusing, unnecessary, missing, awkward, or frustrating belongs here."
                className={TEXTAREA_CLASS}
              />
            </label>

            <label className="block min-w-0 text-sm leading-6 text-zinc-200">
              Is there anything else you want Oremea to know about your experience with {productLabel}?
              <textarea
                value={anythingElse}
                onChange={(event) => setAnythingElse(event.target.value)}
                maxLength={5000}
                rows={5}
                placeholder="Optional."
                className={TEXTAREA_CLASS}
              />
            </label>
          </div>
        </section>

        <label className="sr-only" aria-hidden="true">
          Website
          <input
            tabIndex={-1}
            autoComplete="off"
            value={website}
            onChange={(event) => setWebsite(event.target.value)}
          />
        </label>

        <div className="min-w-0 rounded-[1.75rem] border border-[#c6a96b]/15 bg-[#c6a96b]/[0.035] p-5 sm:p-6">
          <div className="flex min-w-0 flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="min-w-0">
              <p className="font-serif text-base text-zinc-200">
                Submit when the four ratings reflect your experience.
              </p>
              <p className="mt-1 text-xs leading-6 text-zinc-500">
                Your ratings are saved privately. Written reflections remain optional.
              </p>
            </div>
            <div className="flex shrink-0 flex-col gap-3 sm:flex-row">
              <button
                type="submit"
                disabled={sending || !requiredRatingsComplete}
                className="inline-flex min-h-11 items-center justify-center rounded-full bg-[#c6a96b] px-6 py-3 text-sm font-medium text-[#0f0f0d] transition hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-40"
              >
                {sending ? "Saving…" : "Complete survey"}
              </button>

              <Link
                href={returnHref}
                className="inline-flex min-h-11 items-center justify-center rounded-full border border-white/10 px-5 py-3 text-sm text-zinc-400 transition hover:border-[#c6a96b]/40 hover:text-[#c6a96b]"
              >
                {source === "resonance-complete"
                  ? "Skip survey · Return to rooms"
                  : "Skip survey"}
              </Link>
            </div>
          </div>

          {notice ? (
            <p role="status" className="mt-4 text-sm leading-6 text-zinc-300">
              {notice}
            </p>
          ) : null}
        </div>
      </div>
    </form>
  );
}
