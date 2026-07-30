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
  const [status, setStatus] = useState<"IDLE" | "SAVING" | "SENDING" | "SENT">("IDLE");
  const [message, setMessage] = useState("");
  const [results, setResults] = useState<Record<string, string>>({});

  if (providers.length === 0) return null;

  function toggleProvider(providerId: string) {
    setSelected((current) =>
      current.includes(providerId)
        ? current.filter((id) => id !== providerId)
        : [...current, providerId]
    );
  }

  async function ensureProcurementRequest() {
    if (!searchSessionId) throw new Error("This route is missing its WORKS search record");
    if (!contact.name.trim() || !contact.email.trim()) {
      setShowContact(true);
      throw new Error("Add your name and email so WORKS can contact providers on your behalf");
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

  async function send() {
    try {
      setMessage("");
      if (selected.length === 0) throw new Error("Choose at least one provider");
      await ensureProcurementRequest();
      setStatus("SENDING");

      const response = await fetch("/api/works/provider-outreach", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ briefId, searchSessionId, providerIds: selected }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data?.error ?? "WORKS could not email these providers");

      const next: Record<string, string> = {};
      for (const result of data.results ?? []) next[result.providerId] = result.status;
      setResults(next);
      setStatus("SENT");
      const sentCount = Object.values(next).filter((value) => value === "SENT").length;
      setMessage(sentCount > 0 ? `WORKS emailed your brief to ${sentCount} provider${sentCount === 1 ? "" : "s"}` : "No provider emails were sent yet");
    } catch (error) {
      setStatus("IDLE");
      setMessage(error instanceof Error ? error.message : "WORKS could not email these providers");
    }
  }

  return (
    <section className="mt-10 rounded-3xl border border-black/10 bg-white/80 p-5 md:p-8">
      <p className="text-xs font-medium uppercase tracking-[0.18em] text-[#8b6a31]">Take the route forward</p>
      <h2 className="mt-2 font-serif text-3xl">Email these providers</h2>
      <p className="mt-4 max-w-2xl text-base leading-7 text-black/60">
        Choose the companies WORKS should email on your behalf. Each provider receives only the part of your production brief relevant to its role
      </p>

      <div className="mt-6 space-y-3">
        {providers.map((provider) => {
          const response = provider.outreach;
          const currentStatus = results[provider.id] ?? response?.status;
          return (
            <label key={provider.id} className={`flex gap-4 rounded-2xl border p-4 ${provider.hasEmail ? "border-black/10 bg-white" : "border-black/5 bg-black/[0.025]"}`}>
              <input
                type="checkbox"
                checked={selected.includes(provider.id)}
                disabled={!provider.hasEmail || currentStatus === "SENT" || currentStatus === "RESPONDED"}
                onChange={() => toggleProvider(provider.id)}
                className="mt-1 h-4 w-4 shrink-0"
              />
              <span className="min-w-0 flex-1">
                <span className="flex flex-wrap items-center gap-2">
                  <strong>{provider.name}</strong>
                  {currentStatus ? <span className="rounded-full bg-[#f3eee4] px-2.5 py-1 text-[11px] uppercase tracking-[0.08em]">{currentStatus.toLowerCase()}</span> : null}
                  {response?.decision ? <span className="rounded-full bg-[#f3eee4] px-2.5 py-1 text-[11px]">{response.decision.replaceAll("_", " ").toLowerCase()}</span> : null}
                </span>
                <span className="mt-1 block text-sm leading-6 text-black/55">{provider.steps.join(" · ")}</span>
                {!provider.hasEmail ? <span className="mt-2 block text-sm leading-6 text-black/45">WORKS is still locating a contact email for this provider</span> : null}
                {response?.decision ? (
                  <span className="mt-3 block rounded-xl bg-[#f8f0df] p-3 text-sm leading-6 text-black/60">
                    {response.moqValue != null ? `MOQ: ${response.moqValue} ${response.moqUnit ?? ""} ` : ""}
                    {response.leadTime ? `Lead time: ${response.leadTime} ` : ""}
                    {response.capacityDate ? `Capacity from: ${response.capacityDate} ` : ""}
                    {response.providerNotes ?? ""}
                  </span>
                ) : null}
              </span>
            </label>
          );
        })}
      </div>

      {contactable.length > 0 ? (
        <div className="mt-7">
          {!showContact ? (
            <button type="button" onClick={() => setShowContact(true)} className="text-base underline underline-offset-4">Review my contact details before emailing</button>
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

          <div className="mt-5 flex flex-col items-stretch gap-3 sm:items-start">
            <button type="button" onClick={send} disabled={selected.length === 0 || status === "SAVING" || status === "SENDING"} className="w-full rounded-full bg-[#1f1c17] px-6 py-3.5 text-base font-medium text-white disabled:opacity-40 sm:w-auto">
              {status === "SAVING" ? "Saving your details…" : status === "SENDING" ? "Emailing providers…" : selected.length === contactable.length ? `Email all ${selected.length} providers →` : `Email ${selected.length} provider${selected.length === 1 ? "" : "s"} →`}
            </button>
            <p className="max-w-2xl text-base leading-7 text-black/55">Pressing this sends an email now. WORKS includes the relevant part of your brief and returns each provider response to this route</p>
          </div>
        </div>
      ) : null}

      {message ? <p className={`mt-5 text-base leading-7 ${status === "SENT" ? "text-black/60" : "text-red-700"}`}>{message}</p> : null}
    </section>
  );
}
