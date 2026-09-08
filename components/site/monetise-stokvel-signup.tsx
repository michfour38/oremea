"use client";

import { FormEvent, useState } from "react";

type Status = "idle" | "sending" | "success" | "error";

interface MonetiseStokvelSignupProps {
  whatsappGroupUrl: string;
}

const members = 17;
const monthlyContribution = 2_000;
const monthlyPot = members * monthlyContribution;

export function MonetiseStokvelSignup({ whatsappGroupUrl }: MonetiseStokvelSignupProps) {
  const [status, setStatus] = useState<Status>("idle");
  const [message, setMessage] = useState("");

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setStatus("sending");
    setMessage("");

    const form = event.currentTarget;
    const formData = new FormData(form);

    try {
      const response = await fetch("/api/monetise-stokvel", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: formData.get("name"),
          email: formData.get("email"),
          whatsapp: formData.get("whatsapp"),
          invitedBy: formData.get("invitedBy"),
          whyNow: formData.get("whyNow"),
          commitmentAccepted: formData.get("commitmentAccepted") === "on",
          riskAccepted: formData.get("riskAccepted") === "on",
          website: formData.get("website"),
        }),
      });

      const result = (await response.json()) as {
        success?: boolean;
        error?: string;
        message?: string;
      };

      if (!response.ok || !result.success) {
        throw new Error(result.error || "Your signup could not be sent yet.");
      }

      form.reset();
      setStatus("success");
      setMessage(
        result.message ||
          "Your request is in. Join the WhatsApp group to help form the Founding 17.",
      );
    } catch (error) {
      setStatus("error");
      setMessage(
        error instanceof Error
          ? error.message
          : "Your signup could not be sent yet. Please try again.",
      );
    }
  }

  return (
    <div className="mx-auto w-full max-w-6xl px-5 py-12 sm:px-8 sm:py-16 lg:py-20">
      <section className="overflow-hidden rounded-[2rem] border border-emerald-300/20 bg-zinc-950/85 shadow-2xl shadow-black/40 backdrop-blur-xl">
        <div className="grid lg:grid-cols-[1.05fr_0.95fr]">
          <div className="relative overflow-hidden px-6 py-10 sm:px-10 sm:py-14 lg:px-12 lg:py-16">
            <div className="pointer-events-none absolute -left-24 top-4 h-72 w-72 rounded-full bg-emerald-400/10 blur-3xl" />
            <div className="pointer-events-none absolute -bottom-24 right-0 h-72 w-72 rounded-full bg-sky-500/10 blur-3xl" />

            <div className="relative">
              <p className="text-xs font-semibold uppercase tracking-[0.28em] text-emerald-300">
                Founding 17 · Education Stokvel
              </p>
              <h1 className="mt-5 max-w-3xl text-4xl font-black tracking-tight text-white sm:text-5xl lg:text-6xl">
                Local is lekker.
                <span className="block text-emerald-300">Consistent USD is best.</span>
              </h1>

              <p className="mt-6 max-w-2xl text-lg leading-8 text-zinc-300">
                Seventeen committed people. R2,000 each per month. One R34,000 pot.
                The goal is to make a US$1,995 Monetise purchase possible without one person carrying the full rand cost alone.
              </p>

              <div className="mt-8 grid gap-3 sm:grid-cols-3">
                <Stat value="17" label="participants" />
                <Stat value="R2,000" label="each / month" />
                <Stat value={`R${monthlyPot.toLocaleString("en-ZA")}`} label="monthly pot" />
              </div>

              <div className="mt-8 rounded-2xl border border-amber-300/20 bg-amber-300/5 p-5">
                <p className="font-semibold text-amber-200">Why move now?</p>
                <p className="mt-2 leading-7 text-zinc-300">
                  The US$1,995 offer is tied to the current event. The earlier this group forms, the earlier the first participant can buy, implement and begin using what they learn. That can create a snowball effect: people who start sooner may be able to generate income sooner and help bring the next committed participants in sooner.
                </p>
                <p className="mt-3 text-sm leading-6 text-zinc-400">
                  No income or earnings are guaranteed. Results depend on each participant, their implementation and the market.
                </p>
              </div>

              <div className="mt-8 space-y-3 text-sm leading-6 text-zinc-400">
                <p>
                  <strong className="text-zinc-200">This page is an expression of interest, not a payment page.</strong> No contribution is collected here.
                </p>
                <p>
                  Before contributions begin, participants should receive the written stokvel rules, payout order, contribution dates, default process and treatment of any FX/fee buffer.
                </p>
                <p>
                  The programme price is referenced in USD; the rand amount can move with exchange rates and payment fees.
                </p>
              </div>

              {whatsappGroupUrl ? (
                <a
                  href={whatsappGroupUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="mt-8 inline-flex items-center justify-center rounded-full border border-emerald-300/40 bg-emerald-300/10 px-6 py-3 text-sm font-bold text-emerald-100 transition hover:bg-emerald-300/20"
                >
                  Already committed? Join the WhatsApp group →
                </a>
              ) : null}
            </div>
          </div>

          <div className="border-t border-white/10 bg-white/[0.035] px-6 py-10 sm:px-10 sm:py-14 lg:border-l lg:border-t-0 lg:px-12 lg:py-16">
            <p className="text-sm font-semibold uppercase tracking-[0.22em] text-zinc-400">
              Request a place
            </p>
            <h2 className="mt-3 text-3xl font-bold text-white">I want into the Founding 17.</h2>
            <p className="mt-3 leading-7 text-zinc-400">
              Add your details. This confirms interest and your ability to commit R2,000 per month if the group proceeds.
            </p>

            <form className="mt-8 space-y-5" onSubmit={handleSubmit}>
              <Field label="Name" name="name" type="text" autoComplete="name" required />
              <Field label="Email" name="email" type="email" autoComplete="email" required />
              <Field
                label="WhatsApp number"
                name="whatsapp"
                type="tel"
                autoComplete="tel"
                placeholder="e.g. +27 82 123 4567"
                required
              />
              <Field
                label="Who invited you?"
                name="invitedBy"
                type="text"
                placeholder="Optional"
              />

              <label className="block">
                <span className="text-sm font-medium text-zinc-200">Why do you want in?</span>
                <textarea
                  name="whyNow"
                  rows={4}
                  maxLength={1200}
                  placeholder="What would you use the opportunity to build or learn?"
                  className="mt-2 w-full rounded-2xl border border-white/10 bg-black/30 px-4 py-3 text-zinc-100 outline-none transition placeholder:text-zinc-600 focus:border-emerald-300/60"
                />
              </label>

              <label className="flex gap-3 text-sm leading-6 text-zinc-300">
                <input
                  className="mt-1 h-4 w-4 accent-emerald-400"
                  type="checkbox"
                  name="commitmentAccepted"
                  required
                />
                <span>
                  I understand the proposed contribution is R2,000 per month for 17 months if the stokvel launches, including after I have received my own turn.
                </span>
              </label>

              <label className="flex gap-3 text-sm leading-6 text-zinc-300">
                <input
                  className="mt-1 h-4 w-4 accent-emerald-400"
                  type="checkbox"
                  name="riskAccepted"
                  required
                />
                <span>
                  I understand this is not an investment return or income guarantee, and the final rules must be agreed before money is collected.
                </span>
              </label>

              <input
                type="text"
                name="website"
                tabIndex={-1}
                autoComplete="off"
                className="hidden"
                aria-hidden="true"
              />

              <button
                type="submit"
                disabled={status === "sending"}
                className="w-full rounded-full bg-emerald-300 px-6 py-4 font-black text-zinc-950 transition hover:bg-emerald-200 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {status === "sending" ? "Sending…" : "Put my name down"}
              </button>

              {message ? (
                <div
                  className={`rounded-2xl border px-4 py-3 text-sm leading-6 ${
                    status === "success"
                      ? "border-emerald-300/30 bg-emerald-300/10 text-emerald-100"
                      : "border-red-300/30 bg-red-300/10 text-red-100"
                  }`}
                  role="status"
                >
                  <p>{message}</p>
                  {status === "success" && whatsappGroupUrl ? (
                    <a
                      href={whatsappGroupUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="mt-3 inline-flex font-bold underline decoration-emerald-300/60 underline-offset-4"
                    >
                      Join the Founding 17 WhatsApp group →
                    </a>
                  ) : null}
                </div>
              ) : null}
            </form>
          </div>
        </div>
      </section>
    </div>
  );
}

function Stat({ value, label }: { value: string; label: string }) {
  return (
    <div className="rounded-2xl border border-white/10 bg-black/25 p-4">
      <p className="text-2xl font-black text-white">{value}</p>
      <p className="mt-1 text-xs uppercase tracking-[0.18em] text-zinc-500">{label}</p>
    </div>
  );
}

function Field({
  label,
  name,
  type,
  required,
  autoComplete,
  placeholder,
}: {
  label: string;
  name: string;
  type: string;
  required?: boolean;
  autoComplete?: string;
  placeholder?: string;
}) {
  return (
    <label className="block">
      <span className="text-sm font-medium text-zinc-200">{label}</span>
      <input
        className="mt-2 w-full rounded-2xl border border-white/10 bg-black/30 px-4 py-3 text-zinc-100 outline-none transition placeholder:text-zinc-600 focus:border-emerald-300/60"
        name={name}
        type={type}
        required={required}
        autoComplete={autoComplete}
        placeholder={placeholder}
      />
    </label>
  );
}
