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
  "Harmonize",
  "The Current",
  "Oremea generally",
]);

function ScoreRow({
  label,
  value,
  onChange,
}: {
  label: string;
  value: number | null;
  onChange: (value: number) => void;
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
        <span className="ml-1 text-xs text-zinc-500">1 = not clear · 5 = very clear</span>
      </div>
    </fieldset>
  );
}

export default function CompletionFeedbackForm() {
  const [product, setProduct] = useState("Oremea generally");
  const [source, setSource] = useState("completion");
  const [beforeClarity, setBeforeClarity] = useState<number | null>(null);
  const [afterClarity, setAfterClarity] = useState<number | null>(null);
  const [whatChanged, setWhatChanged] = useState("");
  const [showWitnessFeedback, setShowWitnessFeedback] = useState(false);
  const [witnessMissed, setWitnessMissed] = useState("");
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
    if (beforeClarity === null || afterClarity === null || sending) return;

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
          whatChanged,
          witnessMissed,
          source,
          website,
        }),
      });
      const data = await response.json().catch(() => null);

      if (!response.ok || !data?.success) {
        throw new Error(data?.error || "Your feedback could not be sent yet.");
      }

      setSent(true);
      setNotice(data.message || "Thank you. This feedback stays private.");
    } catch (error) {
      setNotice(
        error instanceof Error
          ? error.message
          : "Your feedback could not be sent yet.",
      );
    } finally {
      setSending(false);
    }
  }

  if (sent) {
    return (
      <div className="rounded-[2rem] border border-[#c6a96b]/25 bg-black/45 p-6 shadow-2xl shadow-black/25 backdrop-blur md:p-8">
        <p className="text-sm uppercase tracking-[0.24em] text-[#c6a96b]">
          Received privately
        </p>
        <h2 className="mt-4 text-3xl font-light text-zinc-100">
          Thank you.
        </h2>
        <p className="mt-4 max-w-2xl text-sm leading-7 text-zinc-300">
          {notice} Nothing from this survey is published automatically.
        </p>

        <div className="mt-8 rounded-3xl border border-white/10 bg-white/[0.03] p-5">
          <p className="text-base text-zinc-100">Want to make a reflection public?</p>
          <p className="mt-2 text-sm leading-7 text-zinc-400">
            That is a separate choice. A public review requires its own explicit
            submission and publication permission.
          </p>
          <Link
            href={reviewHref}
            className="mt-5 inline-flex rounded-full border border-[#c6a96b]/45 bg-[#c6a96b]/10 px-5 py-3 text-sm text-[#e5d4a6] transition hover:border-[#c6a96b]/70"
          >
            Share a public reflection
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
          This completion survey is private. It helps Oremea measure whether the
          experience actually changed anything and find what the product missed.
        </p>
      </div>

      <div className="mt-8 space-y-7">
        <ScoreRow
          label="Before this experience, how clear did this feel?"
          value={beforeClarity}
          onChange={setBeforeClarity}
        />
        <ScoreRow
          label="How clear does it feel now?"
          value={afterClarity}
          onChange={setAfterClarity}
        />
      </div>

      <label className="mt-8 block text-sm leading-6 text-zinc-200">
        What changed, if anything?
        <textarea
          value={whatChanged}
          onChange={(event) => setWhatChanged(event.target.value)}
          maxLength={5000}
          rows={6}
          placeholder="Use your own words."
          className="mt-3 w-full resize-y rounded-2xl border border-white/10 bg-black/35 px-4 py-3 text-sm leading-7 text-zinc-100 outline-none placeholder:text-zinc-600 focus:border-[#c6a96b]/60"
        />
      </label>

      <button
        type="button"
        onClick={() => setShowWitnessFeedback((current) => !current)}
        className="mt-7 text-left text-sm text-[#c6a96b] underline-offset-4 transition hover:underline"
      >
        The witness missed something
      </button>

      {showWitnessFeedback ? (
        <div className="mt-4 rounded-3xl border border-[#c6a96b]/20 bg-black/25 p-5">
          <p className="text-sm leading-7 text-zinc-300">
            Something emerged that Oremea did not know how to hold well. What did
            it overlook? What felt most alive, most important, or most easily
            misunderstood? If you were sitting in the witness seat, where would
            your curiosity have gone next?
          </p>
          <textarea
            value={witnessMissed}
            onChange={(event) => setWitnessMissed(event.target.value)}
            maxLength={5000}
            rows={6}
            placeholder="Teach Oremea what it missed..."
            className="mt-4 w-full resize-y rounded-2xl border border-white/10 bg-black/35 px-4 py-3 text-sm leading-7 text-zinc-100 outline-none placeholder:text-zinc-600 focus:border-[#c6a96b]/60"
          />
        </div>
      ) : null}

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
          disabled={sending || beforeClarity === null || afterClarity === null}
          className="inline-flex items-center justify-center rounded-full bg-[#c6a96b] px-6 py-3 text-sm font-medium text-[#0f0f0d] transition hover:brightness-110 disabled:cursor-wait disabled:opacity-50"
        >
          {sending ? "Sending…" : "Send private completion feedback"}
        </button>

        <Link
          href="https://www.oremea.com"
          className="inline-flex items-center justify-center rounded-full border border-white/10 px-5 py-3 text-sm text-zinc-400 transition hover:border-[#c6a96b]/40 hover:text-[#c6a96b]"
        >
          Skip and return to Oremea
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
