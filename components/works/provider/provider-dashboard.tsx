"use client";

import { SignInButton, SignedIn, SignedOut, UserButton } from "@clerk/nextjs";
import { useEffect, useMemo, useState } from "react";

const SERVICES = [
  ["PRODUCT_DEVELOPMENT", "Product development"],
  ["FORMULATION", "Formulation / recipe work"],
  ["TESTING", "Testing / analysis"],
  ["REGULATORY_SUPPORT", "Compliance support"],
  ["RAW_MATERIAL_SOURCING", "Ingredients / materials sourcing"],
  ["MANUFACTURING", "Manufacturing"],
  ["PACKAGING_SUPPLY", "Packaging supply"],
  ["PACKAGING", "Filling / packing"],
  ["PRINTING", "Labels / printed packaging"],
  ["WAREHOUSING", "Warehousing"],
  ["FULFILMENT", "Fulfilment"],
  ["LOGISTICS", "Logistics"],
] as const;

const CATEGORIES = [
  ["FOOD", "Food"],
  ["BEVERAGE", "Beverage"],
  ["SKINCARE", "Skincare"],
  ["PERSONAL_CARE", "Personal care"],
  ["SUPPLEMENTS", "Supplements"],
] as const;

type Commercial = {
  plan: "FREE" | "VERIFIED" | "GROWTH" | "ENTERPRISE";
  marketing_opt_in: boolean;
  wants_more_work: boolean;
  capacity_status: "OPEN" | "LIMITED" | "FULL" | "PAUSED";
  capacity_note: string | null;
  target_service_keys: string[];
  target_category_keys: string[];
  marketing_note: string | null;
};

type Provider = {
  id: string;
  name: string;
  slug: string;
  website: string | null;
  email: string | null;
  phone: string | null;
  profileStatus: string;
  role: "OWNER" | "MANAGER";
  commercial: Commercial;
};

type EditState = {
  marketingOptIn: boolean;
  wantsMoreWork: boolean;
  capacityStatus: Commercial["capacity_status"];
  capacityNote: string;
  marketingNote: string;
  targetServiceKeys: string[];
  targetCategoryKeys: string[];
};

function toEdit(provider: Provider): EditState {
  return {
    marketingOptIn: provider.commercial.marketing_opt_in,
    wantsMoreWork: provider.commercial.wants_more_work,
    capacityStatus: provider.commercial.capacity_status,
    capacityNote: provider.commercial.capacity_note ?? "",
    marketingNote: provider.commercial.marketing_note ?? "",
    targetServiceKeys: provider.commercial.target_service_keys,
    targetCategoryKeys: provider.commercial.target_category_keys,
  };
}

function toggle(list: string[], value: string) {
  return list.includes(value) ? list.filter((item) => item !== value) : [...list, value];
}

export function WorksProviderDashboard() {
  const [providers, setProviders] = useState<Provider[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [edit, setEdit] = useState<EditState | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const selected = useMemo(() => providers.find((provider) => provider.id === selectedId) ?? null, [providers, selectedId]);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      try {
        const response = await fetch("/api/works/provider/me");
        if (response.status === 401) return;
        const data = await response.json();
        if (!response.ok) throw new Error(data?.error ?? "WORKS could not load this provider profile.");
        if (cancelled) return;
        const rows = (data.providers ?? []) as Provider[];
        setProviders(rows);
        if (rows[0]) {
          setSelectedId(rows[0].id);
          setEdit(toEdit(rows[0]));
        }
      } catch (err) {
        if (!cancelled) setError(err instanceof Error ? err.message : "WORKS could not load this provider profile.");
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    load();
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
      const response = await fetch("/api/works/provider/me", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ providerId: selected.id, ...edit }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data?.error ?? "WORKS could not save these changes.");
      setProviders((current) => current.map((provider) => provider.id === selected.id ? { ...provider, commercial: data.commercial } : provider));
      setMessage("Updated. WORKS now has your current capacity and the work you want more of.");
    } catch (err) {
      setError(err instanceof Error ? err.message : "WORKS could not save these changes.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="mx-auto min-h-screen w-full max-w-6xl px-5 py-8 md:px-8 md:py-12">
      <header className="flex items-center justify-between border-b border-black/10 pb-5">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.32em] text-[#8b6a31]">WORKS</p>
          <p className="mt-1 text-xs text-black/40">Provider workspace · by Oremea</p>
        </div>
        <SignedIn><UserButton afterSignOutUrl="/works/za" /></SignedIn>
      </header>

      <SignedOut>
        <main className="py-16">
          <h1 className="max-w-2xl font-serif text-4xl leading-tight text-[#1f1c17] md:text-5xl">Manage the capacity you want WORKS to put into the market.</h1>
          <p className="mt-5 max-w-xl text-sm leading-6 text-black/55">Sign in with the account connected to your provider profile.</p>
          <SignInButton mode="modal"><button className="mt-7 rounded-full bg-[#1f1c17] px-6 py-3 text-sm text-white">Sign in →</button></SignInButton>
        </main>
      </SignedOut>

      <SignedIn>
        {loading ? <p className="py-12 text-sm text-black/40">Loading provider workspace…</p> : providers.length === 0 ? (
          <main className="py-16">
            <h1 className="font-serif text-4xl text-[#1f1c17]">Your WORKS account is ready.</h1>
            <p className="mt-4 max-w-xl text-sm leading-6 text-black/55">A provider profile still needs to be connected to this account before capacity can be managed here.</p>
          </main>
        ) : selected && edit ? (
          <main className="py-10 md:py-14">
            {providers.length > 1 ? <div className="mb-8 flex flex-wrap gap-2">{providers.map((provider) => <button key={provider.id} type="button" onClick={() => chooseProvider(provider)} className={`rounded-full border px-4 py-2 text-sm ${selected.id === provider.id ? "border-[#1f1c17] bg-[#1f1c17] text-white" : "border-black/15 bg-white"}`}>{provider.name}</button>)}</div> : null}

            <div className="grid gap-8 lg:grid-cols-[1fr_1.35fr]">
              <section>
                <p className="text-xs uppercase tracking-[0.18em] text-black/40">{selected.commercial.plan} plan</p>
                <h1 className="mt-2 font-serif text-4xl text-[#1f1c17]">{selected.name}</h1>
                <p className="mt-4 max-w-md text-sm leading-6 text-black/55">Tell WORKS what capacity is available and which work would strengthen your operation. Matching still follows genuine production fit.</p>

                <div className="mt-7 rounded-2xl border border-black/10 bg-white/65 p-5">
                  <p className="text-sm font-medium">Current capacity</p>
                  <div className="mt-3 flex flex-wrap gap-2">{(["OPEN", "LIMITED", "FULL", "PAUSED"] as const).map((status) => <button key={status} type="button" onClick={() => setEdit((value) => value ? { ...value, capacityStatus: status } : value)} className={`rounded-full border px-4 py-2 text-sm ${edit.capacityStatus === status ? "border-[#1f1c17] bg-[#1f1c17] text-white" : "border-black/15 bg-white"}`}>{status.charAt(0) + status.slice(1).toLowerCase()}</button>)}</div>
                  <textarea value={edit.capacityNote} onChange={(event) => setEdit((value) => value ? { ...value, capacityNote: event.target.value } : value)} rows={3} placeholder="Anything WORKS should know about current capacity, timing or constraints…" className="mt-4 w-full resize-none rounded-xl border border-black/10 bg-white px-4 py-3 text-sm outline-none focus:border-[#8b6a31]" />
                </div>

                <label className="mt-5 flex items-start gap-3 rounded-2xl border border-black/10 bg-white/65 p-5"><input type="checkbox" checked={edit.wantsMoreWork} onChange={(event) => setEdit((value) => value ? { ...value, wantsMoreWork: event.target.checked } : value)} className="mt-1" /><span><span className="block text-sm font-medium">We want more work</span><span className="mt-1 block text-xs leading-5 text-black/45">Lets WORKS treat your available capacity as an active demand-generation target.</span></span></label>
                <label className="mt-3 flex items-start gap-3 rounded-2xl border border-black/10 bg-white/65 p-5"><input type="checkbox" checked={edit.marketingOptIn} onChange={(event) => setEdit((value) => value ? { ...value, marketingOptIn: event.target.checked } : value)} className="mt-1" /><span><span className="block text-sm font-medium">Actively market our capabilities</span><span className="mt-1 block text-xs leading-5 text-black/45">WORKS can create demand around the capabilities and categories selected here.</span></span></label>
              </section>

              <section className="space-y-7">
                <div className="rounded-3xl border border-black/10 bg-white/70 p-6">
                  <p className="text-xs font-medium uppercase tracking-[0.18em] text-[#8b6a31]">What work do you want more of?</p>
                  <div className="mt-4 flex flex-wrap gap-2">{SERVICES.map(([key, label]) => <button key={key} type="button" onClick={() => setEdit((value) => value ? { ...value, targetServiceKeys: toggle(value.targetServiceKeys, key) } : value)} className={`rounded-full border px-4 py-2.5 text-sm ${edit.targetServiceKeys.includes(key) ? "border-[#1f1c17] bg-[#1f1c17] text-white" : "border-black/15 bg-white"}`}>{label}</button>)}</div>
                </div>

                <div className="rounded-3xl border border-black/10 bg-white/70 p-6">
                  <p className="text-xs font-medium uppercase tracking-[0.18em] text-[#8b6a31]">Which product categories?</p>
                  <div className="mt-4 flex flex-wrap gap-2">{CATEGORIES.map(([key, label]) => <button key={key} type="button" onClick={() => setEdit((value) => value ? { ...value, targetCategoryKeys: toggle(value.targetCategoryKeys, key) } : value)} className={`rounded-full border px-4 py-2.5 text-sm ${edit.targetCategoryKeys.includes(key) ? "border-[#1f1c17] bg-[#1f1c17] text-white" : "border-black/15 bg-white"}`}>{label}</button>)}</div>
                </div>

                <div className="rounded-3xl border border-black/10 bg-white/70 p-6">
                  <label className="text-xs font-medium uppercase tracking-[0.18em] text-[#8b6a31]">Anything specific WORKS should market?</label>
                  <textarea value={edit.marketingNote} onChange={(event) => setEdit((value) => value ? { ...value, marketingNote: event.target.value } : value)} rows={4} placeholder="For example: private-label sauces, 500–5,000 unit skincare runs, available September–November…" className="mt-4 w-full resize-none rounded-xl border border-black/10 bg-white px-4 py-3 text-sm leading-6 outline-none focus:border-[#8b6a31]" />
                </div>

                {message ? <p className="rounded-2xl bg-[#f3eee4] p-4 text-sm leading-6">{message}</p> : null}
                {error ? <p className="text-sm text-red-700">{error}</p> : null}
                <button type="button" onClick={save} disabled={saving} className="rounded-full bg-[#1f1c17] px-6 py-3 text-sm font-medium text-white disabled:opacity-50">{saving ? "Saving…" : "Update what WORKS markets →"}</button>
              </section>
            </div>
          </main>
        ) : null}
      </SignedIn>
    </div>
  );
}