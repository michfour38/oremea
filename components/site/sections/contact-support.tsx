"use client";

import { FormEvent, useState } from "react";

type ContactForm = {
  name: string;
  email: string;
  subject: string;
  message: string;
  website: string;
};

const initialForm: ContactForm = {
  name: "",
  email: "",
  subject: "",
  message: "",
  website: "",
};

export function ContactSupport() {
  const [form, setForm] = useState(initialForm);
  const [sending, setSending] = useState(false);
  const [notice, setNotice] = useState("");
  const [sent, setSent] = useState(false);

  function update<K extends keyof ContactForm>(key: K, value: ContactForm[K]) {
    setForm((current) => ({ ...current, [key]: value }));
  }

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSending(true);
    setNotice("");
    setSent(false);

    try {
      const response = await fetch("/api/contact", {
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
            error:
              "Support is temporarily unavailable. Please try again shortly.",
          };

      if (!response.ok || !data.success) {
        throw new Error(data.error || "Your message could not be sent.");
      }

      setSent(true);
      setNotice(data.message || "Your message has been sent to Oremea.");
      setForm(initialForm);
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
    <section id="contact-form" className="scroll-mt-24 border-b border-white/5">
      <div className="mx-auto grid max-w-5xl gap-8 px-5 py-12 lg:grid-cols-[minmax(0,1fr)_17rem]">
        <form
          onSubmit={submit}
          className="rounded-2xl border border-white/10 bg-zinc-950/70 p-6 md:p-8"
        >
          <p className="text-[11px] uppercase tracking-[0.24em] text-[#b79a63]">
            Contact Oremea
          </p>
          <h2 className="mt-3 text-3xl font-light text-zinc-100">
            Send a message
          </h2>

          <div className="mt-7 grid gap-5 sm:grid-cols-2">
            <Field label="Name">
              <input
                required
                autoComplete="name"
                value={form.name}
                onChange={(event) => update("name", event.target.value)}
                className="mt-2 w-full rounded-xl border border-white/10 bg-black/30 px-4 py-3 text-sm text-zinc-100 outline-none transition placeholder:text-zinc-600 focus:border-[#b79a63]/60"
              />
            </Field>
            <Field label="Email">
              <input
                required
                type="email"
                autoComplete="email"
                value={form.email}
                onChange={(event) => update("email", event.target.value)}
                className="mt-2 w-full rounded-xl border border-white/10 bg-black/30 px-4 py-3 text-sm text-zinc-100 outline-none transition placeholder:text-zinc-600 focus:border-[#b79a63]/60"
              />
            </Field>
          </div>

          <Field label="Subject" className="mt-5">
            <input
              required
              value={form.subject}
              onChange={(event) => update("subject", event.target.value)}
              className="mt-2 w-full rounded-xl border border-white/10 bg-black/30 px-4 py-3 text-sm text-zinc-100 outline-none transition placeholder:text-zinc-600 focus:border-[#b79a63]/60"
            />
          </Field>

          <Field label="Message" className="mt-5">
            <textarea
              required
              minLength={10}
              maxLength={5000}
              rows={6}
              value={form.message}
              onChange={(event) => update("message", event.target.value)}
              className="mt-2 w-full resize-y rounded-xl border border-white/10 bg-black/30 px-4 py-3 text-sm leading-6 text-zinc-100 outline-none transition placeholder:text-zinc-600 focus:border-[#b79a63]/60"
            />
          </Field>

          <label className="sr-only" aria-hidden="true">
            Website
            <input
              tabIndex={-1}
              autoComplete="off"
              value={form.website}
              onChange={(event) => update("website", event.target.value)}
            />
          </label>

          <div className="mt-6 flex flex-col gap-4 sm:flex-row sm:items-center">
            <button
              type="submit"
              disabled={sending}
              className="inline-flex items-center justify-center rounded-full bg-[#b79a63] px-5 py-2.5 text-sm font-medium text-zinc-950 transition hover:brightness-110 disabled:cursor-wait disabled:opacity-50"
            >
              {sending ? "Sending…" : "Send to Oremea"}
            </button>

            {notice ? (
              <p
                role="status"
                className={
                  "text-sm " + (sent ? "text-[#b79a63]" : "text-zinc-300")
                }
              >
                {notice}
              </p>
            ) : null}
          </div>
        </form>

        <aside className="rounded-2xl border border-white/10 bg-black/25 p-6">
          <p className="text-[11px] uppercase tracking-[0.22em] text-zinc-500">
            Support scope
          </p>
          <p className="mt-4 text-sm leading-7 text-zinc-400">
            Account access, payments, product navigation and technical platform
            issues.
          </p>
          <p className="mt-5 text-xs leading-6 text-zinc-500">
            Replies are sent to the email address entered in this form.
          </p>
        </aside>
      </div>
    </section>
  );
}

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
    <label className={"block text-xs text-zinc-400 " + className}>
      {label}
      {children}
    </label>
  );
}
