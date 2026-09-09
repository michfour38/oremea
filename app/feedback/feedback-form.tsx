"use client";

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

const CATEGORY_OPTIONS = [
  ["witness_missed", "The witness missed something"],
  ["felt_wrong", "Something felt wrong"],
  ["unclear", "Something was unclear"],
  ["broken", "Something broke"],
  ["suggestion", "I have a suggestion"],
  ["other", "Other"],
] as const;

const INPUT_CLASS =
  "mt-2 w-full rounded-2xl border border-white/10 bg-black/35 px-4 py-3 text-sm text-zinc-100 outline-none transition placeholder:text-zinc-600 focus:border-[#c6a96b]/60";

export default function FeedbackForm() {
  const [product, setProduct] = useState("Oremea generally");
  const [category, setCategory] = useState("witness_missed");
  const [message, setMessage] = useState("");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [replyRequested, setReplyRequested] = useState(false);
  const [website, setWebsite] = useState("");
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);
  const [notice, setNotice] = useState("");

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!message.trim() || sending) return;

    setSending(true);
    setSent(false);
    setNotice("");

    try {
      const response = await fetch("/api/feedback/submit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          product,
          category,
          message,
          name,
          email,
          replyRequested,
          website,
          source: "feedback-page",
        }),
      });
      const data = await response.json().catch(() => null);

      if (!response.ok || !data?.success) {
        throw new Error(data?.error || "Your feedback could not be sent yet.");
      }

      setSent(true);
      setNotice(data.message || "Thank you. This feedback stays private.");
      setMessage("");
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

  return (
    <form
      onSubmit={submit}
      className="rounded-[2rem] border border-white/10 bg-black/45 p-6 shadow-2xl shadow-black/25 backdrop-blur md:p-8"
    >
      <div className="grid gap-5 md:grid-cols-2">
        <label className="text-xs text-zinc-400">
          Which Oremea experience?
          <select
            value={product}
            onChange={(event) => setProduct(event.target.value)}
            className={INPUT_CLASS}
          >
            {PRODUCT_OPTIONS.map((option) => (
              <option key={option} value={option}>
                {option}
              </option>
            ))}
          </select>
        </label>

        <label className="text-xs text-zinc-400">
          What happened?
          <select
            value={category}
            onChange={(event) => setCategory(event.target.value)}
            className={INPUT_CLASS}
          >
            {CATEGORY_OPTIONS.map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </select>
        </label>
      </div>

      <label className="mt-6 block text-xs text-zinc-400">
        Tell Oremea what happened
        <textarea
          required
          minLength={3}
          maxLength={5000}
          rows={8}
          value={message}
          onChange={(event) => setMessage(event.target.value)}
          placeholder={
            category === "witness_missed"
              ? "What did Oremea overlook? What felt most important, alive, or easily misunderstood? Where would your curiosity have gone next?"
              : "Tell us what happened in your own words."
          }
          className={`${INPUT_CLASS} resize-y leading-7`}
        />
      </label>

      {category === "witness_missed" ? (
        <div className="mt-4 rounded-2xl border border-[#c6a96b]/20 bg-[#c6a96b]/[0.06] p-4 text-sm leading-7 text-zinc-300">
          Something emerged that Oremea did not know how to hold well. Teach the
          witness what it missed. This goes to Oremea privately so the product can
          improve.
        </div>
      ) : null}

      <div className="mt-6 grid gap-5 md:grid-cols-2">
        <label className="text-xs text-zinc-400">
          Your name — optional
          <input
            value={name}
            onChange={(event) => setName(event.target.value)}
            autoComplete="name"
            className={INPUT_CLASS}
          />
        </label>

        <label className="text-xs text-zinc-400">
          Your email — optional unless you want a reply
          <input
            type="email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            autoComplete="email"
            className={INPUT_CLASS}
          />
        </label>
      </div>

      <label className="mt-6 flex items-start gap-3 rounded-2xl border border-white/10 bg-black/20 p-4 text-sm leading-6 text-zinc-300">
        <input
          type="checkbox"
          checked={replyRequested}
          onChange={(event) => setReplyRequested(event.target.checked)}
          className="mt-1 h-4 w-4 accent-[#c6a96b]"
        />
        <span>I would like Oremea to reply to me about this.</span>
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

      <div className="mt-7 flex flex-col gap-4 sm:flex-row sm:items-center">
        <button
          type="submit"
          disabled={sending || !message.trim()}
          className="inline-flex items-center justify-center rounded-full bg-[#c6a96b] px-6 py-3 text-sm font-medium text-[#0f0f0d] transition hover:brightness-110 disabled:cursor-wait disabled:opacity-50"
        >
          {sending ? "Sending…" : "Send private feedback"}
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
  );
}
