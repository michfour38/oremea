"use client";

import { SignInButton, SignedIn, SignedOut } from "@clerk/nextjs";
import { useEffect, useMemo, useState } from "react";

import { WorksProviderNav } from "@/components/works/provider/provider-nav";
import { WorksPageHeader } from "@/components/works/works-brand";
import { WorksAccountButton } from "@/components/works/works-account-button";

const SERVICES = [
  ["PRODUCT_DEVELOPMENT", "Product development"], ["FORMULATION", "Formulation / recipe work"], ["TESTING", "Testing / analysis"],
  ["REGULATORY_SUPPORT", "Compliance support"], ["RAW_MATERIAL_SOURCING", "Ingredients / materials sourcing"], ["MANUFACTURING", "Manufacturing"],
  ["PACKAGING_SUPPLY", "Packaging supply"], ["PACKAGING", "Filling / packing"], ["PRINTING", "Labels / printed packaging"],
  ["WAREHOUSING", "Warehousing"], ["FULFILMENT", "Fulfilment"], ["LOGISTICS", "Logistics"],
] as const;

const CATEGORIES = [["FOOD", "Food"], ["BEVERAGE", "Beverage"], ["SKINCARE", "Skincare"], ["PERSONAL_CARE", "Personal care"], ["SUPPLEMENTS", "Supplements"]] as const;

type Commercial = { plan: "FREE" | "VERIFIED" | "GROWTH" | "ENTERPRISE"; marketing_opt_in: boolean; wants_more_work: boolean; capacity_status: "OPEN" | "LIMITED" | "FULL" | "PAUSED"; capacity_note: string | null; target_service_keys: string[]; target_category_keys: string[]; marketing_note: string | null; };
type Visibility = { show_legal_name: boolean; show_website: boolean; show_email: boolean; show_phone: boolean; show_description: boolean; show_location: boolean; show_capacity: boolean; };
type Provider = { id: string; name: string; slug: string; legalName: string | null; website: string | null; email: string | null; phone: string | null; description: string | null; profileStatus: string; role: "OWNER" | "MANAGER"; commercial: Commercial; visibility: Visibility; };
type EditState = { name: string; legalName: string; website: string; email: string; phone: string; description: string; marketingOptIn: boolean; wantsMoreWork: boolean; capacityStatus: Commercial["capacity_status"]; capacityNote: string; marketingNote: string; targetServiceKeys: string[]; targetCategoryKeys: string[]; visibility: Visibility; };

function toEdit(provider: Provider): EditState {
  return { name: provider.name, legalName: provider.legalName ?? "", website: provider.website ?? "", email: provider.email ?? "", phone: provider.phone ?? "", description: provider.description ?? "", marketingOptIn: provider.commercial.marketing_opt_in, wantsMoreWork: provider.commercial.wants_more_work, capacityStatus: provider.commercial.capacity_status, capacityNote: provider.commercial.capacity_note ?? "", marketingNote: provider.commercial.marketing_note ?? "", targetServiceKeys: provider.commercial.target_service_keys, targetCategoryKeys: provider.commercial.target_category_keys, visibility: provider.visibility };
}

function toggle(list: string[], value: string) {
  return list.includes(value) ? list.filter(item => item !== value) : [...list, value];
}

export function WorksProviderDashboard() {
  const [providers, setProviders] = useState<Provider[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [edit, setEdit] = useState<EditState | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const selected = useMemo(() => providers.find(provider => provider.id === selectedId) ?? null, [providers, selectedId]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const response = await fetch("/api/works/provider/me");
        if (response.status === 401) return;
        const data = await response.json();
        if (!response.ok) throw new Error(data?.error ?? "WORKS could not load this provider profile.");
        if (cancelled) return;
        const rows = (data.providers ?? []) as Provider[];
        setProviders(rows);
        if (rows[0]) { setSelectedId(rows[0].id); setEdit(toEdit(rows[0])); }
      } catch (err) {
        if (!cancelled) setError(err instanceof Error ? err.message : "WORKS could not load this provider profile.");
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, []);

  function chooseProvider(provider: Provider) {
    setSelectedId(provider.id);
    setEdit(toEdit(provider));
    setMessage("");
    setError("");
  }

  async function save() {
    if (!selected || !edit) return;
    try {
      setSaving(true);
      setMessage("");
      setError("");
      const response = await fetch("/api/works/provider/me", { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ providerId: selected.id, ...edit }) });
      const data = await response.json();
      if (!response.ok) throw new Error(data?.error ?? "WORKS could not save these changes.");
      setProviders(current => current.map(provider => provider.id === selected.id ? { ...provider, ...data.provider, commercial: data.commercial, visibility: data.visibility } : provider));
      setMessage("Saved.");
    } catch (err) {
      setError(err instanceof Error ? err.message : "WORKS could not save these changes.");
    } finally {
      setSaving(false);
    }
  }

  return <div className="mx-auto min-h-screen w-full max-w-5xl px-5 py-8 md:px-8 md:py-12">
    <WorksPageHeader
      context="Provider workspace"
      href="/works/provider"
      action={<SignedIn><WorksAccountButton afterSignOutUrl="/works/za" /></SignedIn>}
    />

    <SignedOut><main className="py-16"><h1 className="max-w-2xl font-serif text-4xl leading-tight text-[#1f1c17] md:text-5xl">Put your available capacity to work</h1><p className="mt-5 max-w-xl text-sm leading-6 text-black/55">Sign in to manage your WORKS provider profile.</p><SignInButton mode="modal"><button className="mt-7 rounded-full bg-[#1f1c17] px-6 py-3 text-sm text-white">Sign in →</button></SignInButton></main></SignedOut>

    <SignedIn>{loading ? <p className="py-12 text-sm text-black/40">Loading provider workspace…</p> : providers.length === 0 ? <main className="py-16"><h1 className="font-serif text-4xl text-[#1f1c17]">Connect a business to continue</h1><p className="mt-4 max-w-xl text-sm leading-6 text-black/55">Add a new provider business or connect an existing WORKS listing after verification.</p><div className="mt-6 flex flex-wrap gap-3"><a href="/works/providers/new" className="rounded-full bg-[#1f1c17] px-5 py-2.5 text-sm text-white">Add my business →</a><a href="/works/providers/claim" className="rounded-full border border-black/15 bg-white px-5 py-2.5 text-sm">Find my business →</a></div></main> : selected && edit ? <main className="py-10 md:py-14">
      <WorksProviderNav current="/works/provider" />

      {providers.length > 1 ? <div className="mt-8 flex flex-wrap gap-2">{providers.map(provider => <button key={provider.id} type="button" onClick={() => chooseProvider(provider)} className={`rounded-full border px-4 py-2 text-sm ${selected.id === provider.id ? "border-[#1f1c17] bg-[#1f1c17] text-white" : "border-black/15 bg-white"}`}>{provider.name}</button>)}</div> : null}

      <div className="mt-10 flex flex-wrap items-end justify-between gap-5 border-b border-black/10 pb-6">
        <div><p className="text-xs uppercase tracking-[0.18em] text-black/40">{selected.commercial.plan} plan</p><h1 className="mt-2 font-serif text-4xl text-[#1f1c17]">Profile & capacity</h1><p className="mt-2 text-sm text-black/45">{selected.name}</p></div>
        <a href={`/works/providers/${selected.slug}`} className="text-sm underline underline-offset-4">View public profile →</a>
      </div>

      <div className="mt-10 max-w-3xl space-y-10">
        <section>
          <p className="text-xs font-medium uppercase tracking-[0.18em] text-[#16834f]">1 · Business profile</p>
          <h2 className="mt-2 font-serif text-3xl">Information about your business</h2>
          <p className="mt-3 text-sm leading-6 text-black/50">Edit the source information here. Public visibility is controlled separately below.</p>
          <div className="mt-6 grid gap-3 rounded-3xl border border-black/10 bg-white/70 p-6">
            <input value={edit.name} onChange={event => setEdit(value => value ? { ...value, name: event.target.value } : value)} placeholder="Business name" className="rounded-xl border border-black/10 bg-white px-4 py-3" />
            <input value={edit.legalName} onChange={event => setEdit(value => value ? { ...value, legalName: event.target.value } : value)} placeholder="Legal name (optional)" className="rounded-xl border border-black/10 bg-white px-4 py-3" />
            <input value={edit.website} onChange={event => setEdit(value => value ? { ...value, website: event.target.value } : value)} placeholder="Website" className="rounded-xl border border-black/10 bg-white px-4 py-3" />
            <div className="grid gap-3 sm:grid-cols-2"><input value={edit.email} onChange={event => setEdit(value => value ? { ...value, email: event.target.value } : value)} placeholder="Contact email" className="rounded-xl border border-black/10 bg-white px-4 py-3" /><input value={edit.phone} onChange={event => setEdit(value => value ? { ...value, phone: event.target.value } : value)} placeholder="Phone" className="rounded-xl border border-black/10 bg-white px-4 py-3" /></div>
            <textarea value={edit.description} onChange={event => setEdit(value => value ? { ...value, description: event.target.value } : value)} rows={5} placeholder="Describe what you make and who you serve." className="resize-none rounded-xl border border-black/10 bg-white px-4 py-3 text-sm leading-6" />
          </div>
        </section>

        <section>
          <p className="text-xs font-medium uppercase tracking-[0.18em] text-[#16834f]">2 · Public profile</p>
          <h2 className="mt-2 font-serif text-3xl">Choose what customers can see</h2>
          <p className="mt-3 text-sm leading-6 text-black/50">Unchecked information stays inside WORKS. Business name and published reviews remain visible trust information.</p>
          <div className="mt-6 grid gap-2 rounded-3xl border border-black/10 bg-[#f7f7f3] p-6 sm:grid-cols-2">{[["show_description","Description"],["show_website","Website"],["show_email","Email"],["show_phone","Phone"],["show_legal_name","Legal name"],["show_location","Location"],["show_capacity","Capacity status"]].map(([key,label]) => <label key={key} className="flex items-center gap-3 rounded-xl border border-black/8 bg-white px-4 py-3 text-sm"><input type="checkbox" checked={edit.visibility[key as keyof Visibility]} onChange={event => setEdit(value => value ? { ...value, visibility: { ...value.visibility, [key]: event.target.checked } } : value)} />{label}</label>)}</div>
        </section>

        <section>
          <p className="text-xs font-medium uppercase tracking-[0.18em] text-[#16834f]">3 · Current capacity</p>
          <h2 className="mt-2 font-serif text-3xl">What can you take on now?</h2>
          <p className="mt-3 text-sm leading-6 text-black/50">Capacity notes are private inside WORKS. Only the simple capacity status can become public when you enable it above.</p>
          <div className="mt-6 rounded-3xl border border-black/10 bg-white/70 p-6">
            <div className="flex flex-wrap gap-2">{(["OPEN","LIMITED","FULL","PAUSED"] as const).map(status => <button key={status} type="button" onClick={() => setEdit(value => value ? { ...value, capacityStatus: status } : value)} className={`rounded-full border px-4 py-2 text-sm ${edit.capacityStatus === status ? "border-[#1f1c17] bg-[#1f1c17] text-white" : "border-black/15 bg-white"}`}>{status.charAt(0) + status.slice(1).toLowerCase()}</button>)}</div>
            <textarea value={edit.capacityNote} onChange={event => setEdit(value => value ? { ...value, capacityNote: event.target.value } : value)} rows={3} placeholder="Timing, line availability, constraints…" className="mt-4 w-full resize-none rounded-xl border border-black/10 bg-white px-4 py-3 text-sm" />
          </div>
        </section>

        <section>
          <p className="text-xs font-medium uppercase tracking-[0.18em] text-[#16834f]">4 · Capabilities used for matching</p>
          <h2 className="mt-2 font-serif text-3xl">Describe what this business can actually provide</h2>
          <p className="mt-3 text-sm leading-6 text-black/50">Create separate offerings with their product categories, production services, specific processes, quantity range and lead time. Provider-supplied information appears as a possible fit until WORKS reviews it.</p>
          <a href="/works/provider/capabilities" className="mt-5 inline-flex rounded-full border border-black/15 bg-white px-5 py-2.5 text-sm">Open capabilities & matching →</a>
        </section>

        <section>
          <p className="text-xs font-medium uppercase tracking-[0.18em] text-[#16834f]">5 · Work you want</p>
          <h2 className="mt-2 font-serif text-3xl">Tell WORKS where to direct opportunity</h2>
          <p className="mt-3 text-sm leading-6 text-black/50">These are private demand preferences. They do not add or verify capability; WORKS matches against the business&apos;s structured offering record.</p>

          <div className="mt-6 space-y-5">
            <label className="flex items-start gap-3 rounded-2xl border border-black/10 bg-white/65 p-5"><input type="checkbox" checked={edit.wantsMoreWork} onChange={event => setEdit(value => value ? { ...value, wantsMoreWork: event.target.checked } : value)} className="mt-1"/><span><span className="block text-sm font-medium">We want more work</span><span className="mt-1 block text-xs leading-5 text-black/45">Private signal used by WORKS when opportunity matches your capability.</span></span></label>
            <label className="flex items-start gap-3 rounded-2xl border border-black/10 bg-white/65 p-5"><input type="checkbox" checked={edit.marketingOptIn} onChange={event => setEdit(value => value ? { ...value, marketingOptIn: event.target.checked } : value)} className="mt-1"/><span><span className="block text-sm font-medium">Actively market our capabilities</span><span className="mt-1 block text-xs leading-5 text-black/45">Permission for WORKS to actively create demand around genuine capability.</span></span></label>

            <div className="rounded-3xl border border-black/10 bg-white/70 p-6"><p className="text-sm font-medium">Production work</p><div className="mt-4 flex flex-wrap gap-2">{SERVICES.map(([key,label]) => <button key={key} type="button" onClick={() => setEdit(value => value ? { ...value, targetServiceKeys: toggle(value.targetServiceKeys, key) } : value)} className={`rounded-full border px-4 py-2.5 text-sm ${edit.targetServiceKeys.includes(key) ? "border-[#1f1c17] bg-[#1f1c17] text-white" : "border-black/15 bg-white"}`}>{label}</button>)}</div></div>
            <div className="rounded-3xl border border-black/10 bg-white/70 p-6"><p className="text-sm font-medium">Product categories</p><div className="mt-4 flex flex-wrap gap-2">{CATEGORIES.map(([key,label]) => <button key={key} type="button" onClick={() => setEdit(value => value ? { ...value, targetCategoryKeys: toggle(value.targetCategoryKeys, key) } : value)} className={`rounded-full border px-4 py-2.5 text-sm ${edit.targetCategoryKeys.includes(key) ? "border-[#1f1c17] bg-[#1f1c17] text-white" : "border-black/15 bg-white"}`}>{label}</button>)}</div></div>
            <div className="rounded-3xl border border-black/10 bg-white/70 p-6"><label className="text-sm font-medium">Anything specific WORKS should market?</label><textarea value={edit.marketingNote} onChange={event => setEdit(value => value ? { ...value, marketingNote: event.target.value } : value)} rows={4} placeholder="Private-label sauces, 500–5,000 unit skincare runs…" className="mt-4 w-full resize-none rounded-xl border border-black/10 bg-white px-4 py-3 text-sm leading-6" /></div>
          </div>
        </section>

        {message ? <p className="rounded-2xl bg-[#eef7f1] p-4 text-sm">{message}</p> : null}
        {error ? <p className="text-sm text-red-700">{error}</p> : null}
        <button type="button" onClick={save} disabled={saving} className="rounded-full bg-[#1f1c17] px-6 py-3 text-sm font-medium text-white disabled:opacity-50">{saving ? "Saving…" : "Save profile & capacity →"}</button>
      </div>
    </main> : null}</SignedIn>
  </div>;
}
