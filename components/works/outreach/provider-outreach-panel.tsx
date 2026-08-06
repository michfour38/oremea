"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import {
  ContactFields,
  ContextSummary,
  DraftEditor,
  ProviderChoices,
  type Contact,
  type EmailPreview,
  type FounderAnswer,
  type Provider,
} from "./provider-outreach-ui";

const EMPTY_CONTACT: Contact = { name: "", email: "", phone: "", preferredContactMethod: "EMAIL" };

export function ProviderOutreachPanel({ briefId, searchSessionId, providers }: { briefId: string; searchSessionId: string | null; providers: Provider[] }) {
  const contactable = useMemo(() => providers.filter((provider) => provider.hasEmail), [providers]);
  const [selected, setSelected] = useState<string[]>(contactable.map((provider) => provider.id));
  const [contact, setContact] = useState<Contact>(EMPTY_CONTACT);
  const [contactError, setContactError] = useState("");
  const [providerQuestions, setProviderQuestions] = useState<string[]>([]);
  const [founderAnswers, setFounderAnswers] = useState<FounderAnswer[]>([]);
  const [hasFounderQuestions, setHasFounderQuestions] = useState(false);
  const [loaded, setLoaded] = useState(false);
  const [previews, setPreviews] = useState<Record<string, EmailPreview>>({});
  const [results, setResults] = useState<Record<string, string>>({});
  const [status, setStatus] = useState<"IDLE" | "SAVING" | "PREVIEWING" | "SENDING">("IDLE");
  const [message, setMessage] = useState("");
  const refs = {
    name: useRef<HTMLInputElement>(null),
    email: useRef<HTMLInputElement>(null),
    phone: useRef<HTMLInputElement>(null),
    method: useRef<HTMLSelectElement>(null),
  };

  useEffect(() => {
    let cancelled = false;
    async function restore() {
      if (!searchSessionId) return;
      try {
        const params = new URLSearchParams({ searchSessionId, briefId });
        const [contactResponse, routeResponse] = await Promise.all([
          fetch(`/api/works/procurement-requests?${params.toString()}`),
          fetch(`/api/works/briefs/${briefId}?searchSessionId=${encodeURIComponent(searchSessionId)}`),
        ]);
        if (contactResponse.ok) {
          const data = await contactResponse.json();
          if (!cancelled && data?.contact) setContact({ ...EMPTY_CONTACT, ...data.contact });
        }
        if (routeResponse.ok) {
          const data = await routeResponse.json();
          const route = data?.route;
          const questions = route?.nextQuestions ?? [];
          if (!cancelled) {
            setHasFounderQuestions(questions.some((item: { audience?: string }) => item.audience === "FOUNDER"));
            setProviderQuestions(questions.filter((item: { audience?: string }) => item.audience === "PROVIDER").map((item: { prompt?: string }) => item.prompt).filter((prompt: unknown): prompt is string => typeof prompt === "string" && Boolean(prompt.trim())));
            setFounderAnswers(Array.isArray(route?.founderAnswers) ? route.founderAnswers : []);
          }
        }
      } catch {
        // Context restoration must not break the route page.
      } finally {
        if (!cancelled) setLoaded(true);
      }
    }
    setLoaded(false);
    restore();
    return () => { cancelled = true; };
  }, [briefId, searchSessionId, providers]);

  if (!searchSessionId || !providers.length || !loaded || hasFounderQuestions) return null;

  const selectedContactable = selected.filter((id) => contactable.some((provider) => provider.id === id));
  const reviewed = selectedContactable.filter((id) => previews[id]);

  function toggleProvider(providerId: string) {
    setSelected((current) => current.includes(providerId) ? current.filter((id) => id !== providerId) : [...current, providerId]);
    setMessage("");
  }

  function readContact(): Contact {
    return {
      name: (refs.name.current?.value ?? contact.name).trim(),
      email: (refs.email.current?.value ?? contact.email).trim(),
      phone: (refs.phone.current?.value ?? contact.phone).trim(),
      preferredContactMethod: refs.method.current?.value ?? contact.preferredContactMethod,
    };
  }

  function changeContact(next: Contact) {
    setContact(next);
    if (next.name.trim() && next.email.trim()) setContactError("");
  }

  async function saveContact() {
    const current = readContact();
    setContact(current);
    if (!current.name || !current.email) {
      setContactError("Add your name and email to review this provider email");
      return false;
    }
    setContactError("");
    setStatus("SAVING");
    const response = await fetch("/api/works/procurement-requests", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ searchSessionId, briefId, ...current }) });
    const data = await response.json();
    if (!response.ok) throw new Error(data?.error ?? "WORKS could not save your contact details");
    return true;
  }

  async function review() {
    try {
      setMessage("");
      if (!selectedContactable.length) throw new Error("Choose at least one provider");
      if (!(await saveContact())) return;
      setStatus("PREVIEWING");
      const response = await fetch("/api/works/provider-outreach", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ briefId, searchSessionId, providerIds: selectedContactable, preview: true }) });
      const data = await response.json();
      if (!response.ok) throw new Error(data?.error ?? "WORKS could not prepare these drafts");
      const next: Record<string, EmailPreview> = {};
      for (const preview of data.previews ?? []) next[preview.providerId] = preview;
      setPreviews(next);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "WORKS could not prepare these drafts");
    } finally {
      setStatus("IDLE");
    }
  }

  function updatePreview(providerId: string, field: "subject" | "bodyText", value: string) {
    setPreviews((current) => ({ ...current, [providerId]: { ...current[providerId], [field]: value } }));
  }

  async function send(providerIds: string[]) {
    try {
      setMessage("");
      if (providerIds.some((id) => !previews[id])) throw new Error("Review every selected email before sending");
      setStatus("SENDING");
      const drafts = Object.fromEntries(providerIds.map((id) => [id, { subject: previews[id].subject, bodyText: previews[id].bodyText }]));
      const response = await fetch("/api/works/provider-outreach", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ briefId, searchSessionId, providerIds, drafts }) });
      const data = await response.json();
      if (!response.ok) throw new Error(data?.error ?? "WORKS could not send these emails");
      const next = { ...results };
      for (const result of data.results ?? []) next[result.providerId] = result.status;
      setResults(next);
      const sent = (data.results ?? []).filter((item: { status: string }) => item.status === "SENT").length;
      setMessage(sent ? `WORKS emailed ${sent} provider${sent === 1 ? "" : "s"}` : "No emails were sent");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "WORKS could not send these emails");
    } finally {
      setStatus("IDLE");
    }
  }

  return (
    <section className="mt-10 rounded-3xl border border-black/10 bg-white/80 p-5 md:p-8">
      <p className="text-xs font-medium uppercase tracking-[0.18em] text-[#8b6a31]">Take the route forward</p>
      <h2 className="mt-2 font-serif text-3xl">Contact matched providers</h2>
      <ContextSummary founderAnswers={founderAnswers} providerQuestions={providerQuestions} />
      <ProviderChoices providers={providers} selected={selected} results={results} onToggle={toggleProvider} />
      <ContactFields contact={contact} error={contactError} refs={refs} onChange={changeContact} />
      <div className="mt-7 border-t border-black/10 pt-7">
        <p className="text-xs font-medium uppercase tracking-[0.14em] text-black/40">3 · Review before sending</p>
        <button type="button" onClick={review} disabled={!selectedContactable.length || status !== "IDLE"} className="mt-3 rounded-full border border-black/15 bg-white px-6 py-3.5 text-base font-medium disabled:opacity-40">{status === "SAVING" ? "Saving details…" : status === "PREVIEWING" ? "Preparing drafts…" : `Review ${selectedContactable.length} selected email${selectedContactable.length === 1 ? "" : "s"} →`}</button>
        <p className="mt-3 text-sm text-black/50">Reviewing creates an editable draft. Nothing sends yet.</p>
      </div>
      {reviewed.length ? (
        <div className="mt-7 space-y-5 border-t border-black/10 pt-7">
          {reviewed.map((id) => <DraftEditor key={id} preview={previews[id]} sent={results[id] === "SENT"} sending={status === "SENDING"} onChange={(field, value) => updatePreview(id, field, value)} onSend={() => send([id])} />)}
          {reviewed.length > 1 ? <button type="button" onClick={() => send(reviewed)} disabled={status === "SENDING"} className="rounded-full bg-[#1f1c17] px-6 py-3.5 text-base font-medium text-white disabled:opacity-40">Send all {reviewed.length} reviewed emails →</button> : null}
        </div>
      ) : null}
      {message ? <p className={`mt-5 text-base leading-7 ${message.startsWith("WORKS emailed") ? "text-black/60" : "text-red-700"}`}>{message}</p> : null}
    </section>
  );
}
