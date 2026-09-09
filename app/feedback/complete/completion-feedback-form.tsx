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

function ScoreRow({
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
    <fieldset>
      <legend className="text-sm leading-6 text-zinc-200">{label}</legend>
      <div className="mt-3 flex flex-wrap items-center gap-2">
        {[1, 2, 3, 4, 5].map((score) => (
          <button
            key={score}
            type="button"
            aria-pressed={value === score}
            onClick={() => onChange(score)}
            className={`flex h-11 w-11 items-center justify-center rounded-full border text-sm transition ${
              value === score
                ? "border-[#c6a96b] bg-[#c6a96b]/20 text-[#f0dcae]"
                : "border-white/10 bg-black/25 text-zinc-400 hover:border-[#c6a96b]/45 hover:text-zinc-200"
            }`}
          >
            {score}
          </button>
        ))}
      </div>
      <div className="mt-2 flex max-w-[310px] justify-between text-[11px] text-zinc-500">
        <span>{lowLabel}</span>
        <span>{highLabel}</span>
      </div>
    </fieldset>
  );
}

function RecommendRow({
  value,
  onChange,
}: {
  value: number | null;
  onChange: (value: number) => void;
}) {
  return (
    <fieldset>
      <legend className="text-sm leading-6 text-zinc-200">
        How likely are you to recommend this experience to someone who needed this
        kind of support?
      </legend>
      <div className="mt-3 flex flex-wrap gap-2">
        {Array.from({ length: 11 }, (_, index) => index).map((score) => (
          <button
            key={score}
            type="button"
            aria-pressed={value === score}
            onClick={() => onChange(score)}
            className={`flex h-10 w-10 items-center justify-center rounded-full border text-xs transition ${
              value === score
                ? "border-[#c6a96b] bg-[#c6a96b]/20 text-[#f0dcae]"
                : "border-white/10 bg-black/25 text-zinc-400 hover:border-[#c6a96b]/45 hover:text-zinc-200"
            }`}
          >
            {score}
          </button>
        ))}
      </div>
      <div className="mt-2 flex max-w-[510px] justify-between text-[11px] text-zinc-500">
        <span>Not likely</span>
        <span>Very likely</span>
      </div>
    </fieldset>
  );
}

const TEXTAREA_CLASS =
  "mt-3 w-full resize-y rounded-2xl border border-white/10 bg-black/35 px-4 py-3 text-sm leading-7 text-zinc-100 outline-none placeholder:text-zinc-600 focus:border-[#c6a96b]/60";

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

  const reviewHref = useMemo(
    () =>
      `https://www.oremea.com/reviews/share?product=${encodeURIComponent(product)}`,
    [product],
  );

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (
      beforeClarity === null ||
      afterClarity === null ||
      fitScore === null ||
      recommendScore === null ||
      sending
    ) {
      return;
    }

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
        throw new Error(data?.error || "Your survey could not be sent yet.");
      }

      setSent(true);
      setNotice(data.message || "Thank you. Your survey has reached Oremea privately.");
    } catch (error) {
      setNotice(
        error instanceof Error
          ? error.message
          : "Your survey could not be sent yet.",
      );
    } finally {
      setSending(false);
    }
  }

  if (sent) {
    return (
      <div className="rounded-[2rem] border border-[#c6a96b]/25 bg-black/45 p-6 shadow-2xl shadow-black/25 backdrop-blur md:p-8">
        <p className="text-sm uppercase tracking-[0.24em] text-[#c6a96b]">
          Survey complete
        </p>
        <h2 className="mt-4 text-3xl font-light text-zinc-100">Thank you.</h2>
        <p className="mt-4 max-w-2xl text-sm leading-7 text-zinc-300">
          {notice} Nothing from this survey is published automatically.
        </p>

        <div className="mt-8 rounded-3xl border border-white/10 bg-white/[0.03] p-5">
          <p className="text-base text-zinc-100">Would you like to leave a public review?</p>
          <p className="mt-2 text-sm leading-7 text-zinc-400">
            That is separate from this survey. Only the reflection you deliberately
            submit on the Reviews page can be considered for publication.
          </p>
          <Link
            href={reviewHref}
            className="mt-5 inline-flex rounded-full border border-[#c6a96b]/45 bg-[#c6a96b]/10 px-5 py-3 text-sm text-[#e5d4a6] transition hover:border-[#c6a96b]/70"
          >
            Leave a public review
          </Link>
        </div>

        <Link
          href="https://www.oremea.com"
          className="mt-6 inline-flex rounded-full border border-white/10 px-5 py-3 text-sm text-zinc-300 transition hover:border-[#c6a96b]/40 hover:text-[#c6a96b]"
        >
          Return to Oremea
        </Link>
      </div>
    );
  }

  return (
    <form
      onSubmit={submit}
      className="rounded-[2rem] border border-white/10 bg-black/45 p-6 shadow-2xl shadow-black/25 backdrop-blur md:p-8"
    >
      <div className="rounded-3xl border border-[#c6a96b]/20 bg-[#c6a96b]/[0.06] p-5">
        <p className="text-xs uppercase tracking-[0.24em] text-[#c6a96b]">
          {product}
        </p>
        <p className="mt-3 text-sm leading-7 text-zinc-300">
          This is the full completion survey. It is private and separate from the
          Feedback button and the public Reviews page.
        </p>
      </div>

      <div className="mt-8 space-y-8">
        <ScoreRow
          label="Before this experience, how clear did this feel?"
          value={beforeClarity}
          onChange={setBeforeClarity}
          lowLabel="Not clear"
          highLabel="Very clear"
        />

        <ScoreRow
          label="How clear does it feel now?"
          value={afterClarity}
          onChange={setAfterClarity}
          lowLabel="Not clear"
          highLabel="Very clear"
        />

        <ScoreRow
          label="How well did this experience do what you came here for?"
          value={fitScore}
          onChange={setFitScore}
          lowLabel="Not at all"
          highLabel="Exactly"
        />

        <RecommendRow value={recommendScore} onChange={setRecommendScore} />
      </div>

      <label className="mt-9 block text-sm leading-6 text-zinc-200">
        What changed, if anything?
        <textarea
          value={whatChanged}
          onChange={(event) => setWhatChanged(event.target.value)}
          maxLength={5000}
          rows={5}
          placeholder="Use your own words."
          className={TEXTAREA_CLASS}
        />
      </label>

      <label className="mt-7 block text-sm leading-6 text-zinc-200">
        What was most useful?
        <textarea
          value={mostUseful}
          onChange={(event) => setMostUseful(event.target.value)}
          maxLength={5000}
          rows={4}
          placeholder="What actually helped?"
          className={TEXTAREA_CLASS}
        />
      </label>

      <label className="mt-7 block text-sm leading-6 text-zinc-200">
        What could work better?
        <textarea
          value={improvement}
          onChange={(event) => setImprovement(event.target.value)}
          maxLength={5000}
          rows={4}
          placeholder="Anything confusing, unnecessary, missing, awkward, or frustrating belongs here."
          className={TEXTAREA_CLASS}
        />
      </label>

      <label className="mt-7 block text-sm leading-6 text-zinc-200">
        Anything else Oremea should know?
        <textarea
          value={anythingElse}
          onChange={(event) => setAnythingElse(event.target.value)}
          maxLength={5000}
          rows={4}
          placeholder="Optional."
          className={TEXTAREA_CLASS}
        />
      </label>

      <label className="sr-only" aria-hidden="true">
        Website
        <input
          tabIndex={-1}
          autoComplete="off"
          value={website}
          onChange={(event) => setWebsite(event.target.value)}
        />
      </label>

      <div className="mt-8 flex flex-col gap-4 sm:flex-row sm:items-center">
        <button
          type="submit"
          disabled={
            sending ||
            beforeClarity === null ||
            afterClarity === null ||
            fitScore === null ||
            recommendScore === null
          }
          className="inline-flex items-center justify-center rounded-full bg-[#c6a96b] px-6 py-3 text-sm font-medium text-[#0f0f0d] transition hover:brightness-110 disabled:cursor-wait disabled:opacity-50"
        >
          {sending ? "Sending…" : "Complete survey"}
        </button>

        <Link
          href="https://www.oremea.com"
          className="inline-flex items-center justify-center rounded-full border border-white/10 px-5 py-3 text-sm text-zinc-400 transition hover:border-[#c6a96b]/40 hover:text-[#c6a96b]"
        >
          Skip survey
        </Link>
      </div>

      {notice ? (
        <p role="status" className="mt-4 text-sm text-zinc-300">
          {notice}
        </p>
      ) : null}
    </form>
  );
}
