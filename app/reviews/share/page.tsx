"use client";

import Link from "next/link";
import { FormEvent, useState } from "react";

const PRODUCT_OPTIONS = [
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
] as const;

type ReviewForm = {
  name: string;
  email: string;
  product: string;
  reflection: string;
  displayPreference: "first_name" | "initial" | "anonymous";
  publicationConsent: boolean;
  website: string;
};

const INITIAL_FORM: ReviewForm = {
  name: "",
  email: "",
  product: "",
  reflection: "",
  displayPreference: "anonymous",
  publicationConsent: false,
  website: "",
};

export default function ShareReviewPage() {
  const [form, setForm] = useState(INITIAL_FORM);
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);
  const [notice, setNotice] = useState("");

  function update<K extends keyof ReviewForm>(key: K, value: ReviewForm[K]) {
    setForm((current) => ({ ...current, [key]: value }));
  }

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSending(true);
    setSent(false);
    setNotice("");

    try {
      const response = await fetch("/api/reviews/submit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const isJson = response.headers
        .get("content-type")
        ?.includes("application/json");
      const data = isJson
        ? await response.json()
        : {
            success: false,
            error: "Review submission is temporarily unavailable. Please try again shortly.",
          };

      if (!response.ok || !data.success) {
        throw new Error(data.error || "Your reflection could not be sent.");
      }

      setSent(true);
      setNotice(data.message || "Your reflection has reached Oremea for review.");
      setForm(INITIAL_FORM);
    } catch (error) {
      setNotice(
        error instanceof Error
          ? error.message
          : "Your reflection could not be sent yet.",
      );
    } finally {
      setSending(false);
    }
  }

  return (
    <main className="min-h-screen bg-[#0f0f0d] text-[#eaeaea]">
      <section className="mx-auto w-full max-w-4xl px-6 py-16 md:px-10 md:py-24">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <Link
            href="/reviews"
            className="text-sm uppercase tracking-[0.28em] text-[#c6a96b]/80 hover:text-[#c6a96b]"
          >
            ← Reviews
          </Link>
          <Link
            href="/"
            className="text-sm uppercase tracking-[0.28em] text-[#8f8f89] hover:text-[#c6a96b]"
          >
            Oremea
          </Link>
        </div>

        <header className="mt-14 max-w-3xl">
          <p className="text-sm uppercase tracking-[0.32em] text-[#c6a96b]">
            Not ratings. Reflections.
          </p>
          <h1 className="mt-4 text-4xl font-light tracking-tight md:text-6xl">
            Share your experience
          </h1>
          <p className="mt-6 text-lg leading-8 text-[#bfbfbf]">
            Write only what you want Oremea to consider for the public Reviews page.
            Nothing from a private Oremea conversation, reflection, Map or Archive is
            pulled into this form automatically.
          </p>
        </header>

        <div className="mt-10 rounded-3xl border border-[#c6a96b]/20 bg-[#181713] p-6 text-sm leading-7 text-[#bfbfbf] md:p-8">
          <p className="text-base text-[#eaeaea]">You remain in control of what is shared.</p>
          <p className="mt-3">
            Your name and email are used privately to receive and verify the submission.
            You choose how any approved reflection is attributed. Submissions are reviewed
            by a person before publication and are never published automatically.
          </p>
        </div>

        <form
          onSubmit={submit}
          className="mt-10 rounded-3xl border border-white/10 bg-[#151512] p-6 md:p-8"
        >
          <div className="grid gap-5 md:grid-cols-2">
            <Field label="Your name (private)">
              <input
                required
                autoComplete="name"
                value={form.name}
                onChange={(event) => update("name", event.target.value)}
                className={INPUT_CLASS}
              />
            </Field>
            <Field label="Your email (private)">
              <input
                required
                type="email"
                autoComplete="email"
                value={form.email}
                onChange={(event) => update("email", event.target.value)}
                className={INPUT_CLASS}
              />
            </Field>
          </div>

          <Field label="Which Oremea experience?" className="mt-5">
            <select
              required
              value={form.product}
              onChange={(event) => update("product", event.target.value)}
              className={INPUT_CLASS}
            >
              <option value="" disabled>
                Choose one
              </option>
              {PRODUCT_OPTIONS.map((product) => (
                <option key={product} value={product}>
                  {product}
                </option>
              ))}
            </select>
          </Field>

          <Field label="Your reflection" className="mt-5">
            <textarea
              required
              minLength={20}
              maxLength={3000}
              rows={8}
              value={form.reflection}
              onChange={(event) => update("reflection", event.target.value)}
              placeholder="What would you want another person to know about your experience?"
              className={`${INPUT_CLASS} resize-y leading-7`}
            />
          </Field>

          <fieldset className="mt-6">
            <legend className="text-xs text-zinc-400">If published, display my reflection as</legend>
            <div className="mt-3 flex flex-wrap gap-3">
              {[
                ["anonymous", "Anonymous"],
                ["first_name", "First name"],
                ["initial", "Initial"],
              ].map(([value, label]) => (
                <label
                  key={value}
                  className={`cursor-pointer rounded-full border px-4 py-2 text-sm transition ${
                    form.displayPreference === value
                      ? "border-[#c6a96b] bg-[#c6a96b]/15 text-[#eaeaea]"
                      : "border-white/10 text-[#bfbfbf] hover:border-[#c6a96b]/40"
                  }`}
                >
                  <input
                    type="radio"
                    name="displayPreference"
                    value={value}
                    checked={form.displayPreference === value}
                    onChange={() =>
                      update(
                        "displayPreference",
                        value as ReviewForm["displayPreference"],
                      )
                    }
                    className="sr-only"
                  />
                  {label}
                </label>
              ))}
            </div>
          </fieldset>

          <label className="mt-7 flex items-start gap-3 rounded-2xl border border-white/10 bg-black/20 p-4 text-sm leading-6 text-[#bfbfbf]">
            <input
              required
              type="checkbox"
              checked={form.publicationConsent}
              onChange={(event) => update("publicationConsent", event.target.checked)}
              className="mt-1 h-4 w-4 accent-[#c6a96b]"
            />
            <span>
              I give Oremea permission to publish this submitted reflection using the
              display preference above. I understand that Oremea may obscure profanity
              or identifying details where needed, but will not rewrite my meaning.
            </span>
          </label>

          <label className="sr-only" aria-hidden="true">
            Website
            <input
              tabIndex={-1}
              autoComplete="off"
              value={form.website}
              onChange={(event) => update("website", event.target.value)}
            />
          </label>

          <div className="mt-7 flex flex-col gap-4 sm:flex-row sm:items-center">
            <button
              type="submit"
              disabled={sending}
              className="inline-flex items-center justify-center rounded-full bg-[#c6a96b] px-5 py-3 text-sm font-medium text-[#0f0f0d] transition hover:brightness-110 disabled:cursor-wait disabled:opacity-50"
            >
              {sending ? "Sending…" : "Send reflection for review"}
            </button>
            {notice ? (
              <p
                role="status"
                className={sent ? "text-sm text-[#c6a96b]" : "text-sm text-zinc-300"}
              >
                {notice}
              </p>
            ) : null}
          </div>
        </form>
      </section>
    </main>
  );
}

const INPUT_CLASS =
  "mt-2 w-full rounded-xl border border-white/10 bg-black/30 px-4 py-3 text-sm text-zinc-100 outline-none transition placeholder:text-zinc-600 focus:border-[#c6a96b]/60";

function Field({
  label,
  className = "",
  children,
}: {
  label: string;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <label className={`block text-xs text-zinc-400 ${className}`}>
      {label}
      {children}
    </label>
  );
}
