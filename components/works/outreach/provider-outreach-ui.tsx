"use client";

import type { RefObject } from "react";

export type Provider = {
  id: string;
  name: string;
  slug: string;
  hasEmail: boolean;
  steps: string[];
  offerings: string[];
  outreach: { status: string; decision: string | null } | null;
};

export type Contact = {
  name: string;
  email: string;
  phone: string;
  preferredContactMethod: string;
};

export type FounderAnswer = { key: string; prompt: string; answer: string };

export type EmailPreview = {
  providerId: string;
  providerName: string;
  recipient: string;
  replyTo: string;
  requesterName: string;
  subject: string;
  bodyText: string;
  questionCount: number;
};

function normalize(value: string) {
  return value.toLowerCase().replace(/[^a-z0-9]+/g, " ").trim();
}

function responsePreviewPayload(preview: EmailPreview) {
  const lines = preview.bodyText.replaceAll("\r\n", "\n").split("\n");
  const productHeading = lines.findIndex(
    (line) => normalize(line) === normalize("Can you help make this?")
  );
  const product =
    productHeading >= 0
      ? lines.slice(productHeading + 1).find((line) => Boolean(line.trim()))?.trim()
      : "";
  const routeHeading = lines.findIndex((line) => {
    const heading = normalize(line);
    return (
      heading === normalize("Your part of the route") ||
      heading === normalize("Your possible part of the route")
    );
  });
  const relevantSteps: string[] = [];

  if (routeHeading >= 0) {
    for (let index = routeHeading + 1; index < lines.length; index += 1) {
      const line = lines[index].trim();
      if (!line) {
        if (relevantSteps.length) break;
        continue;
      }
      if (!line.startsWith("-")) break;
      relevantSteps.push(line.replace(/^-\s*/, ""));
    }
  }

  const questionsHeading = lines.findIndex(
    (line) => normalize(line) === normalize("Questions to confirm")
  );
  const questions: string[] = [];

  if (questionsHeading >= 0) {
    for (let index = questionsHeading + 1; index < lines.length; index += 1) {
      const line = lines[index].trim();
      if (!line) {
        if (questions.length) break;
        continue;
      }
      if (!line.startsWith("-")) break;
      questions.push(line.replace(/^-\s*/, ""));
    }
  }

  return {
    providerName: preview.providerName,
    requesterName: preview.requesterName,
    product:
      product || preview.subject.replace(/^WORKS production enquiry:\s*/i, "").trim() || "Production brief",
    category: null,
    relevantSteps,
    questions,
  };
}

function openProviderResponsePreview(preview: EmailPreview) {
  const key =
    typeof crypto !== "undefined" && "randomUUID" in crypto
      ? crypto.randomUUID()
      : `${Date.now()}-${Math.random().toString(36).slice(2)}`;
  const storageKey = `oremea:works:provider-response-preview:${key}`;

  window.localStorage.setItem(
    storageKey,
    JSON.stringify({
      ...responsePreviewPayload(preview),
      createdAt: Date.now(),
    })
  );

  window.open(
    `/works/respond/preview?key=${encodeURIComponent(key)}`,
    "_blank",
    "noopener,noreferrer"
  );
}

export function ContextSummary({
  founderAnswers: _founderAnswers,
  providerQuestions,
  targetLabel,
  draftReady,
  includedQuestions,
  onQuestionClick,
}: {
  founderAnswers: FounderAnswer[];
  providerQuestions: string[];
  targetLabel: string;
  draftReady: boolean;
  includedQuestions: Set<string>;
  onQuestionClick: (question: string) => void;
}) {
  void _founderAnswers;

  return (
    <>
      {providerQuestions.length ? (
        <div className="mt-6">
          <p className="text-xs font-medium uppercase tracking-[0.14em] text-[#8b6a31]">
            What providers still need to confirm
          </p>
          <p className="mt-2 text-sm leading-6 text-black/55">
            WORKS includes these questions automatically. Open the email to edit or remove them.
          </p>
          <div className="mt-3 grid gap-3">
            {providerQuestions.map((question) => {
              const included = includedQuestions.has(question);
              const action = !draftReady
                ? `Included automatically in ${targetLabel} ✓`
                : included
                  ? `Added to ${targetLabel} ✓`
                  : `Add to ${targetLabel}`;

              return (
                <button
                  key={question}
                  type="button"
                  onClick={() => onQuestionClick(question)}
                  className="group rounded-2xl border border-black/10 bg-white/70 p-5 text-left transition hover:border-[#8b6a31]/40 hover:bg-white focus:outline-none focus:ring-2 focus:ring-[#8b6a31]/30"
                >
                  <span className="text-[11px] uppercase tracking-[0.15em] text-[#8b6a31]">
                    Ask provider
                  </span>
                  <span className="mt-2 block text-sm leading-6 text-[#1f1c17]">
                    {question}
                  </span>
                  <span className="mt-3 block text-xs font-medium text-black/45 group-hover:text-[#8b6a31]">
                    {action}
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      ) : null}
    </>
  );
}

export function ProviderChoices({
  providers,
  selected,
  results,
  onToggle,
}: {
  providers: Provider[];
  selected: string[];
  results: Record<string, string>;
  onToggle: (providerId: string) => void;
}) {
  return (
    <div className="mt-7 border-t border-black/10 pt-7">
      <p className="text-xs font-medium uppercase tracking-[0.14em] text-black/40">
        1 · Select providers
      </p>
      <div className="mt-3 space-y-3">
        {providers.map((provider) => {
          const sent = results[provider.id] === "SENT" || provider.outreach?.status === "SENT";
          return (
            <label key={provider.id} className="flex gap-4 rounded-2xl border border-black/10 bg-white p-4">
              <input
                type="checkbox"
                checked={selected.includes(provider.id)}
                disabled={!provider.hasEmail || sent}
                onChange={() => onToggle(provider.id)}
                className="mt-1 h-4 w-4"
              />
              <span>
                <strong>{provider.name}</strong>
                <span className="mt-1 block text-sm text-black/55">
                  {provider.steps.join(" · ")}
                </span>
                {!provider.hasEmail ? (
                  <span className="mt-1 block text-sm text-black/40">Contact email still needed</span>
                ) : null}
              </span>
            </label>
          );
        })}
      </div>
    </div>
  );
}

export function ContactFields({
  contact,
  error,
  refs,
  onChange,
}: {
  contact: Contact;
  error: string;
  refs: {
    name: RefObject<HTMLInputElement>;
    email: RefObject<HTMLInputElement>;
    phone: RefObject<HTMLInputElement>;
    method: RefObject<HTMLSelectElement>;
  };
  onChange: (contact: Contact) => void;
}) {
  return (
    <div data-validation-scope className="mt-7 border-t border-black/10 pt-7">
      <p className="text-xs font-medium uppercase tracking-[0.14em] text-black/40">
        2 · Confirm your contact details
      </p>
      <div className="mt-3 grid gap-3 rounded-2xl bg-[#f3eee4] p-4 sm:grid-cols-2">
        <label className="text-xs text-black/45">
          Your name
          <input
            ref={refs.name}
            required
            aria-invalid={error && !contact.name.trim() ? true : undefined}
            autoComplete="name"
            value={contact.name}
            onChange={(event) => onChange({ ...contact, name: event.target.value })}
            className="mt-1 w-full rounded-xl border border-black/10 bg-white px-4 py-3 text-base text-[#1f1c17]"
          />
        </label>
        <label className="text-xs text-black/45">
          Your email
          <input
            ref={refs.email}
            required
            aria-invalid={error && !contact.email.trim() ? true : undefined}
            type="email"
            autoComplete="email"
            value={contact.email}
            onChange={(event) => onChange({ ...contact, email: event.target.value })}
            className="mt-1 w-full rounded-xl border border-black/10 bg-white px-4 py-3 text-base text-[#1f1c17]"
          />
        </label>
        <label className="text-xs text-black/45">
          WhatsApp / phone <span className="text-black/30">optional</span>
          <input
            ref={refs.phone}
            autoComplete="tel"
            value={contact.phone}
            onChange={(event) => onChange({ ...contact, phone: event.target.value })}
            className="mt-1 w-full rounded-xl border border-black/10 bg-white px-4 py-3 text-base text-[#1f1c17]"
          />
        </label>
        <label className="text-xs text-black/45">
          Preferred reply
          <select
            ref={refs.method}
            value={contact.preferredContactMethod}
            onChange={(event) => onChange({ ...contact, preferredContactMethod: event.target.value })}
            className="mt-1 w-full rounded-xl border border-black/10 bg-white px-4 py-3 text-base text-[#1f1c17]"
          >
            <option value="EMAIL">Email me</option>
            <option value="WHATSAPP">WhatsApp me</option>
            <option value="PHONE">Phone me</option>
          </select>
        </label>
      </div>
      {error ? (
        <p role="alert" className="mt-3 text-sm text-red-700">
          {error}
        </p>
      ) : null}
    </div>
  );
}

export function DraftEditor({
  preview,
  sent,
  sending,
  restoring,
  pristine,
  restored,
  onChange,
  onRestore,
  onSend,
}: {
  preview: EmailPreview;
  sent: boolean;
  sending: boolean;
  restoring: boolean;
  pristine: boolean;
  restored: boolean;
  onChange: (field: "subject" | "bodyText", value: string) => void;
  onRestore: () => void;
  onSend: () => void;
}) {
  return (
    <article
      id={`works-email-draft-${preview.providerId}`}
      className="rounded-2xl border border-black/10 bg-[#f8f6f0] p-5 md:p-6"
    >
      <h3 className="font-serif text-2xl">Review email to {preview.providerName}</h3>
      <p className="mt-2 text-sm text-black/50">
        To {preview.recipient} · Reply to {preview.replyTo}
      </p>
      <p className="mt-3 text-sm leading-6 text-black/60">
        Edit the subject and email below before sending. Changes apply only to this {preview.providerName} email.
      </p>

      {!pristine ? (
        <div className="mt-4 flex flex-col gap-3 rounded-2xl border border-black/10 bg-white/70 p-4 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-sm leading-6 text-black/55">
            Changed too much? Restore the complete original WORKS draft, including its questions and signature.
          </p>
          <button
            type="button"
            onClick={onRestore}
            disabled={restoring || sending || sent}
            className="shrink-0 rounded-full border border-black/15 bg-white px-4 py-2.5 text-sm font-medium disabled:opacity-55"
          >
            {restoring ? "Restoring…" : "Restore original WORKS draft"}
          </button>
        </div>
      ) : restored ? (
        <p className="mt-4 text-sm font-medium text-[#6b542c]">Original draft restored ✓</p>
      ) : null}

      <label className="mt-5 block text-xs uppercase tracking-[0.12em] text-black/40">
        Subject · editable
        <input
          value={preview.subject}
          onChange={(event) => onChange("subject", event.target.value)}
          className="mt-2 w-full rounded-xl border border-black/10 bg-white px-4 py-3 text-base normal-case tracking-normal text-[#1f1c17]"
        />
      </label>
      <label className="mt-5 block text-xs uppercase tracking-[0.12em] text-black/40">
        Email copy · editable
        <textarea
          rows={22}
          value={preview.bodyText}
          onChange={(event) => onChange("bodyText", event.target.value)}
          className="mt-2 w-full resize-y rounded-2xl border border-black/10 bg-white px-4 py-4 text-base leading-7 normal-case tracking-normal text-[#1f1c17]"
        />
      </label>
      {preview.questionCount ? (
        <p className="mt-3 text-sm text-black/50">
          WORKS inserted {preview.questionCount} provider question{preview.questionCount === 1 ? "" : "s"}. Edit or delete any line above.
        </p>
      ) : null}

      <div className="mt-5 flex flex-col gap-3 rounded-2xl border border-black/10 bg-white px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-col items-start gap-3 sm:flex-row sm:items-center">
          <span className="shrink-0 rounded-full bg-[#1f1c17] px-5 py-2.5 text-sm text-white">
            Respond to this brief
          </span>
          <span className="text-xs text-black/45">
            Provider response button · active only in the sent email
          </span>
        </div>
        <button
          type="button"
          onClick={() => openProviderResponsePreview(preview)}
          className="shrink-0 rounded-full border border-black/15 bg-white px-4 py-2.5 text-sm font-medium"
        >
          Preview provider response →
        </button>
      </div>

      <div className="mt-5 flex justify-end">
        <button
          type="button"
          onClick={onSend}
          disabled={sending || restoring || sent}
          className="rounded-full bg-[#1f1c17] px-6 py-3.5 text-base font-medium text-white disabled:opacity-40"
        >
          {sent ? "Email sent ✓" : sending ? "Sending…" : `Send email to ${preview.providerName} →`}
        </button>
      </div>
      {sent ? (
        <p className="mt-3 text-right text-sm text-black/60">
          Your enquiry was sent to {preview.providerName}.
        </p>
      ) : null}
    </article>
  );
}
