"use client";

import { SignedIn, SignedOut, SignInButton } from "@clerk/nextjs";
import { useEffect, useMemo, useState } from "react";

import { WorksProviderNav } from "@/components/works/provider/provider-nav";
import { WorksPageHeader } from "@/components/works/works-brand";
import { WorksAccountButton } from "@/components/works/works-account-button";

type Opportunity = {
  id: string;
  provider: { id: string; name: string; slug: string };
  status: "DRAFT" | "SENT" | "RESPONDED" | "DECLINED" | "FAILED";
  relevantSteps: string[];
  sentAt: string | null;
  respondedAt: string | null;
  decision: "YES" | "POSSIBLE" | "OUTSIDE_CAPABILITY" | null;
  moqValue: string | null;
  moqUnit: string | null;
  leadTimeText: string | null;
  capacityDate: string | null;
  pricingNotes: string | null;
  certificationNotes: string | null;
  providerNotes: string | null;
  procurementStatus: string;
  brief: {
    id: string;
    productDescription: string;
    stage: string | null;
    targetQuantity: string | null;
    quantityUnit: string | null;
    administrativeArea: string | null;
    timelineDate: string | null;
    requestedServices: string[];
  };
  createdAt: string;
};

type Draft = {
  decision: "YES" | "POSSIBLE" | "OUTSIDE_CAPABILITY" | "";
  moqValue: string;
  moqUnit: string;
  leadTimeText: string;
  capacityDate: string;
  pricingNotes: string;
  certificationNotes: string;
  providerNotes: string;
};

function toDraft(item: Opportunity): Draft {
  return {
    decision: item.decision ?? "",
    moqValue: item.moqValue ?? "",
    moqUnit: item.moqUnit ?? "",
    leadTimeText: item.leadTimeText ?? "",
    capacityDate: item.capacityDate ? item.capacityDate.slice(0, 10) : "",
    pricingNotes: item.pricingNotes ?? "",
    certificationNotes: item.certificationNotes ?? "",
    providerNotes: item.providerNotes ?? "",
  };
}

function pretty(value: string) {
  return value.replaceAll("_", " ").toLowerCase().replace(/^./, (letter) => letter.toUpperCase());
}

export function WorksProviderInbox() {
  const [items, setItems] = useState<Opportunity[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [draft, setDraft] = useState<Draft | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  const selected = useMemo(() => items.find((item) => item.id === selectedId) ?? null, [items, selectedId]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const response = await fetch("/api/works/provider/inbox");
        if (response.status === 401) return;
        const data = await response.json();
        if (!response.ok) throw new Error(data?.error ?? "WORKS could not load provider opportunities.");
        if (cancelled) return;
        const opportunities = (data.opportunities ?? []) as Opportunity[];
        setItems(opportunities);
        if (opportunities[0]) {
          setSelectedId(opportunities[0].id);
          setDraft(toDraft(opportunities[0]));
        }
      } catch (err) {
        if (!cancelled) setError(err instanceof Error ? err.message : "WORKS could not load provider opportunities.");
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, []);

  function choose(item: Opportunity) {
    setSelectedId(item.id);
    setDraft(toDraft(item));
    setError("");
    setMessage("");
  }

  async function save() {
    if (!selected || !draft) return;
    if (!draft.decision) {
      setError("Choose whether this looks like a fit.");
      return;
    }
    try {
      setSaving(true);
      setError("");
      setMessage("");
      const response = await fetch(`/api/works/provider/inbox/${selected.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(draft),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data?.error ?? "WORKS could not save this response.");
      setItems((current) => current.map((item) => item.id === selected.id ? { ...item, ...data.opportunity } : item));
      setMessage("Response saved. WORKS can now use it in this customer route.");
    } catch (err) {
      setError(err instanceof Error ? err.message : "WORKS could not save this response.");
    } finally {
      setSaving(false);
    }
  }

  return <main className="mx-auto min-h-screen w-full max-w-6xl px-5 py-8 md:px-8 md:py-12">
    <WorksPageHeader
      href="/works/provider"
      context="Provider workspace"
      action={<SignedIn><WorksAccountButton afterSignOutUrl="/works/za" /></SignedIn>}
    />

    <SignedOut><section className="py-16"><h1 className="font-serif text-4xl md:text-5xl">Production opportunities sent to your business</h1><p className="mt-5 max-w-xl text-sm leading-7 text-black/55">Sign in with the account connected to your WORKS provider profile.</p><SignInButton mode="modal"><button className="mt-7 rounded-full bg-[#1f1c17] px-6 py-3 text-sm text-white">Sign in →</button></SignInButton></section></SignedOut>

    <SignedIn>{loading ? <p className="py-12 text-sm text-black/40">Loading opportunities…</p> : items.length === 0 ? <section className="py-10 md:py-14"><WorksProviderNav current="/works/provider/inbox" /><div className="mt-10"><h1 className="font-serif text-4xl">Inbox</h1><p className="mt-4 max-w-xl text-sm leading-7 text-black/50">No WORKS production briefs have been sent to your provider profile yet.</p></div></section> : <section className="py-10 md:py-14">
      <WorksProviderNav current="/works/provider/inbox" />
      <div className="mt-10 grid gap-6 lg:grid-cols-[.8fr_1.2fr]">
        <div className="space-y-3">
          <div className="mb-5"><p className="text-xs font-medium uppercase tracking-[0.18em] text-[#16834f]">Customer briefs</p><h1 className="mt-2 font-serif text-3xl">Inbox</h1><p className="mt-3 text-sm leading-6 text-black/50">Open one brief at a time. Your response belongs only to that brief.</p></div>
          {items.map((item) => <button key={item.id} type="button" onClick={() => choose(item)} className={`block w-full rounded-2xl border p-5 text-left ${selected?.id === item.id ? "border-[#1f1c17] bg-white" : "border-black/10 bg-white/60"}`}><p className="text-xs uppercase tracking-[0.12em] text-black/35">{pretty(item.status)}</p><p className="mt-2 font-serif text-xl">{item.brief.productDescription}</p><p className="mt-3 text-xs text-black/45">{item.relevantSteps.length ? item.relevantSteps.join(" · ") : "Production opportunity"}</p></button>)}
        </div>

        {selected && draft ? <div className="rounded-3xl border border-black/10 bg-white/75 p-6 md:p-8">
          <p className="text-xs uppercase tracking-[0.18em] text-[#16834f]">Brief for {selected.provider.name}</p><h2 className="mt-2 font-serif text-3xl">{selected.brief.productDescription}</h2>
          <div className="mt-6 grid gap-3 text-sm text-black/55 sm:grid-cols-2">
            {selected.brief.stage ? <p><span className="block text-xs text-black/35">Stage</span>{pretty(selected.brief.stage)}</p> : null}
            {selected.brief.targetQuantity ? <p><span className="block text-xs text-black/35">Target quantity</span>{selected.brief.targetQuantity} {selected.brief.quantityUnit?.toLowerCase() ?? ""}</p> : null}
            {selected.brief.administrativeArea ? <p><span className="block text-xs text-black/35">Area</span>{selected.brief.administrativeArea}</p> : null}
            {selected.relevantSteps.length ? <p><span className="block text-xs text-black/35">WORKS is asking about</span>{selected.relevantSteps.join(", ")}</p> : null}
          </div>

          <div className="mt-8 border-t border-black/8 pt-6"><p className="text-sm font-medium">Can your business take this part of the route?</p><div className="mt-3 flex flex-wrap gap-2">{[["YES","Yes"],["POSSIBLE","Possibly · need more information"],["OUTSIDE_CAPABILITY","Outside our capability"]].map(([value,label]) => <button key={value} type="button" onClick={() => setDraft((current) => current ? { ...current, decision: value as Draft["decision"] } : current)} className={`rounded-full border px-4 py-2.5 text-sm ${draft.decision === value ? "border-[#1f1c17] bg-[#1f1c17] text-white" : "border-black/15 bg-white"}`}>{label}</button>)}</div></div>

          {draft.decision && draft.decision !== "OUTSIDE_CAPABILITY" ? <div className="mt-7 grid gap-4 sm:grid-cols-2">
            <input value={draft.moqValue} onChange={(e)=>setDraft(v=>v?{...v,moqValue:e.target.value}:v)} type="number" min="0" placeholder="MOQ" className="rounded-xl border border-black/10 px-4 py-3" />
            <input value={draft.moqUnit} onChange={(e)=>setDraft(v=>v?{...v,moqUnit:e.target.value}:v)} placeholder="MOQ unit" className="rounded-xl border border-black/10 px-4 py-3" />
            <input value={draft.leadTimeText} onChange={(e)=>setDraft(v=>v?{...v,leadTimeText:e.target.value}:v)} placeholder="Lead time, e.g. 4–6 weeks" className="rounded-xl border border-black/10 px-4 py-3" />
            <label className="text-xs text-black/40">Earliest capacity date<input value={draft.capacityDate} onChange={(e)=>setDraft(v=>v?{...v,capacityDate:e.target.value}:v)} type="date" className="mt-1 block w-full rounded-xl border border-black/10 px-4 py-3 text-sm text-black" /></label>
            <textarea value={draft.pricingNotes} onChange={(e)=>setDraft(v=>v?{...v,pricingNotes:e.target.value}:v)} rows={3} placeholder="Pricing or quote basis" className="sm:col-span-2 resize-none rounded-xl border border-black/10 px-4 py-3 text-sm" />
            <textarea value={draft.certificationNotes} onChange={(e)=>setDraft(v=>v?{...v,certificationNotes:e.target.value}:v)} rows={3} placeholder="Certifications relevant to this brief" className="sm:col-span-2 resize-none rounded-xl border border-black/10 px-4 py-3 text-sm" />
          </div> : null}

          <textarea value={draft.providerNotes} onChange={(e)=>setDraft(v=>v?{...v,providerNotes:e.target.value}:v)} rows={4} placeholder={draft.decision === "OUTSIDE_CAPABILITY" ? "Optional note about why this sits outside your capability" : "Questions or anything WORKS/the customer should know"} className="mt-5 w-full resize-none rounded-xl border border-black/10 px-4 py-3 text-sm leading-6" />
          {message ? <p className="mt-5 rounded-2xl bg-[#eef7f1] p-4 text-sm">{message}</p> : null}{error ? <p className="mt-5 text-sm text-red-700">{error}</p> : null}
          <button type="button" onClick={save} disabled={saving || !draft.decision} className="mt-6 rounded-full bg-[#1f1c17] px-6 py-3 text-sm font-medium text-white disabled:opacity-40">{saving ? "Saving response…" : "Send response to WORKS →"}</button>
          <p className="mt-3 text-xs leading-5 text-black/35">This response belongs to this production brief. Provider-wide capability, private notes and public profile information remain separate.</p>
        </div> : null}
      </div>
    </section>}</SignedIn>
  </main>;
}
