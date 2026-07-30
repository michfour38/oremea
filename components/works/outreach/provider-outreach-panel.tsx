"use client";

import { useMemo, useState } from "react";

type Provider = {
  id: string;
  name: string;
  slug: string;
  hasEmail: boolean;
  steps: string[];
  offerings: string[];
  outreach: {
    status: string;
    decision: string | null;
    leadTime: string | null;
    moqValue: number | null;
    moqUnit: string | null;
    capacityDate: string | null;
    pricingNotes: string | null;
    providerNotes: string | null;
  } | null;
};

type Contact = {
  name: string;
  email: string;
  phone: string;
  preferredContactMethod: string;
};

type EmailPreview = {
  providerId: string;
  providerName: string;
  recipient: string;
  replyTo: string;
  subject: string;
  product: string;
  requesterName: string;
  relevantSteps: string[];
  quantity: string;
  requirements: string[];
};

export function ProviderOutreachPanel({
  briefId,
  searchSessionId,
  providers,
}: {
  briefId: string;
  searchSessionId: string | null;
  providers: Provider[];
}) {
  const contactable = useMemo(() => providers.filter((provider) => provider.hasEmail), [providers]);
  const [selected, setSelected] = useState<string[]>(contactable.map((provider) => provider.id));
  const [contact, setContact] = useState<Contact>({
    name: "",
    email: "",
    phone: "",
    preferredContactMethod: "EMAIL",
  });
  const [showContact, setShowContact] = useState(false);
  const [status, setStatus] = useState<"IDLE" | "SAVING" | "PREVIEWING" | "SENDING" | "SENT">("IDLE");
  const [message, setMessage] = useState("");
  const [results, setResults] = useState<Record<string, string>>({});
  const [previews, setPreviews] = useState<Record<string, EmailPreview>>({});
  const [expanded, setExpanded] = useState<string[]>([]);

  if (providers.length === 0) return null;

  function toggleProvider(providerId: string) {
    setSelected((current) =>
      current.includes(providerId)
        ? current.filter((id) => id !== providerId)
        : [...current, providerId]
    );
  }

  function toggleExpanded(providerId: string) {
    setExpanded((current) =>
      current.includes(providerId)
        ? current.filter((id) => id !== providerId)
        : [...current, providerId]
    );
  }

  async function ensureProcurementRequest() {
    if (!searchSessionId) throw new Error("This route is missing its WORKS search record");
    if (!contact.name.trim() || !contact.email.trim()) {
      setShowContact(true);
      throw new Error("Add your name and email before reviewing provider emails");
    }

    setStatus("SAVING");
    const response = await fetch("/api/works/procurement-requests", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ searchSessionId, briefId, ...contact }),
    });
    const data = await response.json();
    if (!response.ok) throw new Error(data?.error ?? "WORKS could not save your contact details");
  }

  async function review(providerIds: string[]) {
    try {
      setMessage("");
      if (providerIds.length === 0) throw new Error("Choose at least one provider");
      await ensureProcurementRequest();
      setStatus("PREVIEWING");

      const response = await fetch("/api/works/provider-outreach", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ briefId, searchSessionId, providerIds, preview: true }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data?.error ?? "WORKS could not prepare these email previews");

      const next = { ...previews };
      for (const preview of data.previews ?? []) next[preview.providerId] = preview;
      setPreviews(next);
      setExpanded((current) => Array.from(new Set([...current, ...providerIds])));
      setStatus("IDLE");
    } catch (error) {
      setStatus("IDLE");
      setMessage(error instanceof Error ? error.message : "WORKS could not prepare these email previews");
    }
  }

  async function send(providerIds: string[]) {
    try {
      setMessage("");
      const reviewedIds = providerIds.filter((providerId) => previews[providerId]);
      if (reviewedIds.length !== providerIds.length) {
        throw new Error("Review every selected email before sending");
      }

      setStatus("SENDING");
      const response = await fetch("/api/works/provider-outreach", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ briefId, searchSessionId, providerIds }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data?.error ?? "WORKS could not email these providers");

      const next = { ...results };
      for (const result of data.results ?? []) next[result.providerId] = result.status;
      setResults(next);
      setStatus("SENT");
      const sentCount = (data.results ?? []).filter((result: { status: string }) => result.status === "SENT").length;
      setMessage(sentCount > 0 ? `WORKS emailed ${sentCount} provider${sentCount === 1 ? "" : "s"}` : "No provider emails were sent yet");
    } catch (error) {
      setStatus("IDLE");
      setMessage(error instanceof Error ? error.message : "WORKS could not email these providers");
    }
  }

  const selectedContactable = selected.filter((providerId) => contactable.some((provider) => provider.id === providerId));
  const everySelectedReviewed = selectedContactable.length > 0 && selectedContactable.every((providerId) => previews[providerId]);

  return (
    <section className="mt-10 rounded-3xl border border-black/10 bg-white/80 p-5 md:p-8">
      <p className="text-xs font-medium uppercase tracking-[0.18em] text-[#8b6a31]">Take the route forward</p>
      <h2 className="mt-2 font-serif text-3xl">Ask these providers</h2>
      <p className="mt-4 max-w-2xl text-base leading-7 text-black/60">
        Choose the companies WORKS should contact, then open each card to review exactly what that provider will receive
      </p>

      <div className="mt-6 space-y-3">
        {providers.map((provider) => {
          const response = provider.outreach;
          const currentStatus = results[provider.id] ?? response?.status;
          const preview = previews[provider.id];
          const isExpanded = expanded.includes(provider.id);
          const isSent = currentStatus === "SENT" || currentStatus === "RESPONDED";

          return (
            <article key={provider.id} className={`overflow-hidden rounded-2xl border ${provider.hasEmail ? "border-black/10 bg-white" : "border-black/5 bg-black/[0.025]"}`}>
              <div className="flex gap-4 p-4 md:p-5">
                <input
                  type="checkbox"
                  aria-label={`Select ${provider.name}`}
                  checked={selected.includes(provider.id)}
                  disabled={!provider.hasEmail || isSent}
                  onChange={() => toggleProvider(provider.id)}
                  className="mt-1 h-4 w-4 shrink-0"
                />
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <strong>{provider.name}</strong>
                    {currentStatus ? <span className="rounded-full bg-[#f3eee4] px-2.5 py-1 text-[11px] uppercase tracking-[0.08em]">{currentStatus.toLowerCase()}</span> : null}
                    {preview && !isSent ? <span className="rounded-full bg-[#eef7f1] px-2.5 py-1 text-[11px]">reviewed</span> : null}
                  </div>
                  <p className="mt-1 text-sm leading-6 text-black/55">{provider.steps.join(" · ")}</p>
                  {!provider.hasEmail ? <p className="mt-2 text-sm leading-6 text-black/45">WORKS is still locating a contact email for this provider</p> : null}
                  {response?.decision ? (
                    <div className="mt-3 rounded-xl bg-[#f8f0df] p-3 text-sm leading-6 text-black/60">
                      {response.moqValue != null ? `MOQ: ${response.moqValue} ${response.moqUnit ?? ""} ` : ""}
                      {response.leadTime ? `Lead time: ${response.leadTime} ` : ""}
                      {response.capacityDate ? `Capacity from: ${response.capacityDate} ` : ""}
                      {response.providerNotes ?? ""}
                    </div>
                  ) : null}

                  {provider.hasEmail && !isSent ? (
                    <button
                      type="button"
                      onClick={() => preview ? toggleExpanded(provider.id) : review([provider.id])}
                      disabled={status === "SAVING" || status === "PREVIEWING" || status === "SENDING"}
                      className="mt-4 text-sm font-medium underline underline-offset-4 disabled:opacity-40"
                    >
                      {preview ? (isExpanded ? "Hide email ↑" : "Review email ↓") : "Prepare email preview ↓"}
                    </button>
                  ) : null}
                </div>
              </div>

              {preview && isExpanded ? (
                <div className="border-t border-black/10 bg-[#f8f6f0] p-5 md:p-6">
                  <div className="grid gap-3 text-sm leading-6 sm:grid-cols-2">
                    <p><span className="block text-xs uppercase tracking-[0.12em] text-black/40">To</span>{preview.providerName} · {preview.recipient}</p>
                    <p><span className="block text-xs uppercase tracking-[0.12em] text-black/40">Reply to</span>{preview.requesterName} · {preview.replyTo}</p>
                  </div>
                  <p className="mt-5 text-xs uppercase tracking-[0.12em] text-black/40">Subject</p>
                  <p className="mt-1 font-medium">{preview.subject}</p>

                  <div className="mt-5 rounded-2xl border border-black/10 bg-white p-5 text-sm leading-7 text-black/70">
                    <p className="text-xs uppercase tracking-[0.16em] text-black/40">WORKS · by Oremea</p>
                    <h3 className="mt-3 font-serif text-2xl text-[#1f1c17]">Can you help make this?</h3>
                    <p className="mt-4 font-medium">{preview.product}</p>
                    <p className="mt-3">WORKS matched your business to part of a production route for {preview.requesterName}</p>
                    <p className="mt-4 font-medium">Your part of the route</p>
                    <ul className="mt-1 list-disc pl-5">{preview.relevantSteps.map((step) => <li key={step}>{step}</li>)}</ul>
                    <p className="mt-4 font-medium">Current production quantity</p>
                    <p>{preview.quantity}</p>
                    {preview.requirements.length ? <><p className="mt-4 font-medium">Relevant requirements</p><ul className="mt-1 list-disc pl-5">{preview.requirements.map((requirement) => <li key={requirement}>{requirement}</li>)}</ul></> : null}
                    <div className="mt-5 inline-block rounded-full bg-[#1f1c17] px-5 py-2.5 text-white">Respond to this brief</div>
                    <p className="mt-5 text-xs leading-5 text-black/45">The provider receives only this role-specific brief, your name and your reply email. Other captured answers and other providers are excluded</p>
                  </div>

                  <button
                    type="button"
                    onClick={() => send([provider.id])}
                    disabled={status === "SENDING"}
                    className="mt-5 w-full rounded-full bg-[#1f1c17] px-6 py-3.5 text-base font-medium text-white disabled:opacity-40 sm:w-auto"
                  >
                    {status === "SENDING" ? "Sending…" : `Send email to ${provider.name} →`}
                  </button>
                </div>
              ) : null}
            </article>
          );
        })}
      </div>

      {contactable.length > 0 ? (
        <div className="mt-7">
          {!showContact ? (
            <button type="button" onClick={() => setShowContact(true)} className="text-base underline underline-offset-4">Add or review my contact details</button>
          ) : (
            <div className="grid gap-3 rounded-2xl bg-[#f3eee4] p-4 sm:grid-cols-2">
              <input value={contact.name} onChange={(event) => setContact((value) => ({ ...value, name: event.target.value }))} placeholder="Your name" className="min-w-0 rounded-xl border border-black/10 bg-white px-4 py-3" />
              <input type="email" value={contact.email} onChange={(event) => setContact((value) => ({ ...value, email: event.target.value }))} placeholder="Your email" className="min-w-0 rounded-xl border border-black/10 bg-white px-4 py-3" />
              <input value={contact.phone} onChange={(event) => setContact((value) => ({ ...value, phone: event.target.value }))} placeholder="WhatsApp / phone (optional)" className="min-w-0 rounded-xl border border-black/10 bg-white px-4 py-3" />
              <select value={contact.preferredContactMethod} onChange={(event) => setContact((value) => ({ ...value, preferredContactMethod: event.target.value }))} className="min-w-0 rounded-xl border border-black/10 bg-white px-4 py-3">
                <option value="EMAIL">Email me</option>
                <option value="WHATSAPP">WhatsApp me</option>
                <option value="PHONE">Phone me</option>
              </select>
            </div>
          )}

          <div className="mt-5 flex flex-col items-stretch gap-3 sm:flex-row sm:flex-wrap sm:items-center">
            <button
              type="button"
              onClick={() => review(selectedContactable)}
              disabled={selectedContactable.length === 0 || status === "SAVING" || status === "PREVIEWING" || status === "SENDING"}
              className="w-full rounded-full border border-black/15 bg-white px-6 py-3.5 text-base font-medium disabled:opacity-40 sm:w-auto"
            >
              {status === "SAVING" ? "Saving your details…" : status === "PREVIEWING" ? "Preparing emails…" : `Review ${selectedContactable.length} selected email${selectedContactable.length === 1 ? "" : "s"} →`}
            </button>

            {everySelectedReviewed ? (
              <button
                type="button"
                onClick={() => send(selectedContactable)}
                disabled={status === "SENDING"}
                className="w-full rounded-full bg-[#1f1c17] px-6 py-3.5 text-base font-medium text-white disabled:opacity-40 sm:w-auto"
              >
                {status === "SENDING" ? "Sending emails…" : `Send all ${selectedContactable.length} reviewed email${selectedContactable.length === 1 ? "" : "s"} →`}
              </button>
            ) : null}
          </div>
          <p className="mt-4 max-w-2xl text-base leading-7 text-black/55">Nothing sends while reviewing. Email is sent only from a button labelled Send</p>
        </div>
      ) : null}

      {message ? <p className={`mt-5 text-base leading-7 ${status === "SENT" ? "text-black/60" : "text-red-700"}`}>{message}</p> : null}
    </section>
  );
}
