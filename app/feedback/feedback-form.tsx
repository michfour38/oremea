"use client";

import { FormEvent, useState } from "react";

const INPUT_CLASS =
  "mt-2 w-full rounded-2xl border border-white/10 bg-black/35 px-4 py-3 text-sm text-zinc-100 outline-none transition placeholder:text-zinc-600 focus:border-[#c6a96b]/60";

export default function FeedbackForm() {
  const [message, setMessage] = useState("");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
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
          category: "contact",
          message,
          name,
          email,
          replyRequested: Boolean(email.trim()),
          website,
          source:
            typeof document !== "undefined" && document.referrer
              ? document.referrer
              : "feedback-page",
        }),
      });
      const data = await response.json().catch(() => null);

      if (!response.ok || !data?.success) {
        throw new Error(data?.error || "Your message could not be sent yet.");
      }

      setSent(true);
      setNotice(data.message || "Message sent.");
      setMessage("");
    } catch (error) {
      setNotice(
        error instanceof Error
          ? error.message
          : "Your message could not be sent yet.",
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
      <label className="block text-xs text-zinc-400">
        Message
        <textarea
          required
          minLength={3}
          maxLength={5000}
          rows={6}
          value={message}
          onChange={(event) => setMessage(event.target.value)}
          placeholder="What would you like Oremea to know?"
          className={`${INPUT_CLASS} resize-y leading-7`}
        />
      </label>

      <div className="mt-5 grid gap-5 md:grid-cols-2">
        <label className="text-xs text-zinc-400">
          Name — optional
          <input
            value={name}
            onChange={(event) => setName(event.target.value)}
            autoComplete="name"
            className={INPUT_CLASS}
          />
        </label>

        <label className="text-xs text-zinc-400">
          Email — only if you want a reply
          <input
            type="email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            autoComplete="email"
            className={INPUT_CLASS}
          />
        </label>
      </div>

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
          {sending ? "Sending…" : "Send message"}
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
