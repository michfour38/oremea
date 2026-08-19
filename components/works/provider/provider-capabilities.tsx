"use client";

import { SignInButton, SignedIn, SignedOut, UserButton } from "@clerk/nextjs";
import Link from "next/link";
import type { FormEvent } from "react";
import { useEffect, useMemo, useState } from "react";

import { WorksProviderNav } from "@/components/works/provider/provider-nav";
import { WorksPageHeader } from "@/components/works/works-brand";

type EvidenceStatus = "SELF_REPORTED" | "SOURCE_REVIEWED" | "VERIFIED";
type TriState = "" | "true" | "false";

type CatalogItem = {
  key: string;
  name: string;
  description: string | null;
  categoryKeys?: string[];
  marketIds?: string[];
};

type Offering = {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  productionModel: string | null;
  moqValue: number | null;
  moqUnit: string | null;
  maxRunValue: number | null;
  maxRunUnit: string | null;
  leadTimeMinDays: number | null;
  leadTimeMaxDays: number | null;
  leadTimeBasis: string | null;
  sampleAvailable: boolean | null;
  startupFriendly: boolean | null;
  quoteRequired: boolean;
  packagingSupplied: boolean | null;
  clientPackagingAccepted: boolean | null;
  evidenceStatus: EvidenceStatus;
  active: boolean;
  categoryKeys: string[];
  serviceKeys: string[];
  capabilityKeys: string[];
  packagingFormatKeys: string[];
};

type ProviderMarket = {
  id: string;
  marketId: string;
  name: string;
  code: string;
  currencyCode: string;
  offerings: Offering[];
};

type Provider = {
  id: string;
  name: string;
  role: "OWNER" | "MANAGER";
  profileStatus: string;
  markets: ProviderMarket[];
};

type CapabilityData = {
  providers: Provider[];
  catalog: {
    categories: CatalogItem[];
    services: CatalogItem[];
    capabilities: CatalogItem[];
    packagingFormats: CatalogItem[];
  };
};

type OfferingForm = {
  name: string;
  description: string;
  productionModel: string;
  moqValue: string;
  maxRunValue: string;
  quantityUnit: string;
  leadTimeMinDays: string;
  leadTimeMaxDays: string;
  leadTimeBasis: string;
  sampleAvailable: TriState;
  startupFriendly: TriState;
  packagingSupplied: TriState;
  clientPackagingAccepted: TriState;
  quoteRequired: boolean;
  active: boolean;
  categoryKeys: string[];
  serviceKeys: string[];
  capabilityKeys: string[];
  packagingFormatKeys: string[];
};

const PRODUCTION_MODELS = [
  ["CUSTOM_MANUFACTURING", "Custom manufacturing"],
  ["CUSTOM_FORMULATION", "Custom formulation"],
  ["PRIVATE_LABEL", "Private label"],
  ["WHITE_LABEL", "White label"],
  ["CO_PACKING", "Co-packing / contract packing"],
  ["SERVICE_ONLY", "Specialist service"],
  ["SUPPLY_ONLY", "Materials or packaging supply"],
] as const;

const QUANTITY_UNITS = [
  ["UNITS", "individual units"],
  ["MG", "mg"],
  ["G", "g"],
  ["KG", "kg"],
  ["ML", "ml"],
  ["LITRES", "litres"],
  ["OZ", "oz"],
  ["LB", "lb"],
  ["FL_OZ_US", "US fl oz"],
  ["GALLON_US", "US gallons"],
  ["FL_OZ_IMPERIAL", "Imperial fl oz"],
  ["GALLON_IMPERIAL", "Imperial gallons"],
] as const;

function blankForm(): OfferingForm {
  return {
    name: "",
    description: "",
    productionModel: "",
    moqValue: "",
    maxRunValue: "",
    quantityUnit: "UNITS",
    leadTimeMinDays: "",
    leadTimeMaxDays: "",
    leadTimeBasis: "WORKING_DAYS",
    sampleAvailable: "",
    startupFriendly: "",
    packagingSupplied: "",
    clientPackagingAccepted: "",
    quoteRequired: true,
    active: false,
    categoryKeys: [],
    serviceKeys: [],
    capabilityKeys: [],
    packagingFormatKeys: [],
  };
}

function triState(value: boolean | null): TriState {
  return value === null ? "" : value ? "true" : "false";
}

function booleanValue(value: TriState) {
  return value === "" ? null : value === "true";
}

function toForm(offering: Offering): OfferingForm {
  return {
    name: offering.name,
    description: offering.description ?? "",
    productionModel: offering.productionModel ?? "",
    moqValue: offering.moqValue == null ? "" : String(offering.moqValue),
    maxRunValue: offering.maxRunValue == null ? "" : String(offering.maxRunValue),
    quantityUnit: offering.moqUnit ?? offering.maxRunUnit ?? "UNITS",
    leadTimeMinDays: offering.leadTimeMinDays == null ? "" : String(offering.leadTimeMinDays),
    leadTimeMaxDays: offering.leadTimeMaxDays == null ? "" : String(offering.leadTimeMaxDays),
    leadTimeBasis: offering.leadTimeBasis ?? "WORKING_DAYS",
    sampleAvailable: triState(offering.sampleAvailable),
    startupFriendly: triState(offering.startupFriendly),
    packagingSupplied: triState(offering.packagingSupplied),
    clientPackagingAccepted: triState(offering.clientPackagingAccepted),
    quoteRequired: offering.quoteRequired,
    active: offering.active,
    categoryKeys: offering.categoryKeys,
    serviceKeys: offering.serviceKeys,
    capabilityKeys: offering.capabilityKeys,
    packagingFormatKeys: offering.packagingFormatKeys,
  };
}

function toggle(values: string[], key: string) {
  return values.includes(key) ? values.filter((value) => value !== key) : [...values, key];
}

function EvidenceBadge({ offering }: { offering: Offering }) {
  if (!offering.active) {
    return <span className="rounded-full bg-black/5 px-3 py-1 text-[11px] text-black/45">Draft / paused</span>;
  }
  if (offering.evidenceStatus === "VERIFIED") {
    return <span className="rounded-full bg-[#e5f5eb] px-3 py-1 text-[11px] text-[#11683d]">Verified fit</span>;
  }
  if (offering.evidenceStatus === "SOURCE_REVIEWED") {
    return <span className="rounded-full bg-[#eef7f1] px-3 py-1 text-[11px] text-[#16834f]">Source reviewed</span>;
  }
  return <span className="rounded-full bg-[#f8f0df] px-3 py-1 text-[11px] text-[#7a5a22]">Possible fit · review needed</span>;
}

function ChoiceGrid({
  items,
  selected,
  onToggle,
  emptyMessage,
}: {
  items: CatalogItem[];
  selected: string[];
  onToggle: (key: string) => void;
  emptyMessage?: string;
}) {
  if (!items.length) {
    return <p className="rounded-2xl bg-black/[0.025] p-4 text-sm text-black/40">{emptyMessage ?? "No options are available yet."}</p>;
  }

  return (
    <div className="grid gap-2 sm:grid-cols-2">
      {items.map((item) => {
        const checked = selected.includes(item.key);
        return (
          <label
            key={item.key}
            className={`flex cursor-pointer items-start gap-3 rounded-2xl border p-4 transition ${
              checked ? "border-[#16834f]/45 bg-[#eef7f1]" : "border-black/10 bg-white/70 hover:border-black/20"
            }`}
          >
            <input type="checkbox" checked={checked} onChange={() => onToggle(item.key)} className="mt-1 accent-[#16834f]" />
            <span>
              <span className="block text-sm font-medium">{item.name}</span>
              {item.description ? <span className="mt-1 block text-xs leading-5 text-black/45">{item.description}</span> : null}
            </span>
          </label>
        );
      })}
    </div>
  );
}

function TriStateField({
  label,
  value,
  onChange,
}: {
  label: string;
  value: TriState;
  onChange: (value: TriState) => void;
}) {
  return (
    <label className="text-xs text-black/45">
      {label}
      <select
        value={value}
        onChange={(event) => onChange(event.target.value as TriState)}
        className="mt-1 w-full rounded-xl border border-black/10 bg-white px-4 py-3 text-sm text-[#1f1c17]"
      >
        <option value="">Not confirmed yet</option>
        <option value="true">Yes</option>
        <option value="false">No</option>
      </select>
    </label>
  );
}

export function WorksProviderCapabilities() {
  const [data, setData] = useState<CapabilityData | null>(null);
  const [selectedProviderId, setSelectedProviderId] = useState<string | null>(null);
  const [selectedMarketId, setSelectedMarketId] = useState<string | null>(null);
  const [selectedOfferingId, setSelectedOfferingId] = useState<string | null>(null);
  const [form, setForm] = useState<OfferingForm>(blankForm);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    let cancelled = false;
    async function load() {
      try {
        const response = await fetch("/api/works/provider/offerings");
        if (response.status === 401) return;
        const payload = (await response.json()) as CapabilityData & { error?: string };
        if (!response.ok) throw new Error(payload.error ?? "WORKS could not load provider capabilities.");
        if (cancelled) return;

        setData(payload);
        const provider = payload.providers[0] ?? null;
        const market = provider?.markets[0] ?? null;
        const offering = market?.offerings[0] ?? null;
        setSelectedProviderId(provider?.id ?? null);
        setSelectedMarketId(market?.id ?? null);
        setSelectedOfferingId(offering?.id ?? null);
        setForm(offering ? toForm(offering) : blankForm());
      } catch (caught) {
        if (!cancelled) setError(caught instanceof Error ? caught.message : "WORKS could not load provider capabilities.");
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    void load();
    return () => { cancelled = true; };
  }, []);

  const selectedProvider = data?.providers.find((provider) => provider.id === selectedProviderId) ?? null;
  const selectedMarket = selectedProvider?.markets.find((market) => market.id === selectedMarketId) ?? null;

  const selectedCategorySet = useMemo(() => new Set(form.categoryKeys), [form.categoryKeys]);
  const marketCategories = useMemo(
    () => data?.catalog.categories.filter((item) => item.marketIds?.includes(selectedMarket?.marketId ?? "")) ?? [],
    [data, selectedMarket?.marketId],
  );
  const applicableServices = useMemo(
    () => data?.catalog.services.filter((item) => item.categoryKeys?.some((key) => selectedCategorySet.has(key))) ?? [],
    [data, selectedCategorySet],
  );
  const applicableCapabilities = useMemo(
    () => data?.catalog.capabilities.filter((item) => item.categoryKeys?.some((key) => selectedCategorySet.has(key))) ?? [],
    [data, selectedCategorySet],
  );
  const applicablePackaging = useMemo(
    () => data?.catalog.packagingFormats.filter((item) => item.categoryKeys?.some((key) => selectedCategorySet.has(key))) ?? [],
    [data, selectedCategorySet],
  );

  function selectMarket(provider: Provider, market: ProviderMarket) {
    const offering = market.offerings[0] ?? null;
    setSelectedProviderId(provider.id);
    setSelectedMarketId(market.id);
    setSelectedOfferingId(offering?.id ?? null);
    setForm(offering ? toForm(offering) : blankForm());
    setMessage("");
    setError("");
  }

  function chooseProvider(provider: Provider) {
    const market = provider.markets[0];
    if (market) selectMarket(provider, market);
  }

  function chooseOffering(offering: Offering | null) {
    setSelectedOfferingId(offering?.id ?? null);
    setForm(offering ? toForm(offering) : blankForm());
    setMessage("");
    setError("");
  }

  function toggleCategory(key: string) {
    if (!data) return;
    setForm((current) => {
      const categoryKeys = toggle(current.categoryKeys, key);
      const categories = new Set(categoryKeys);
      const compatible = (items: CatalogItem[], selected: string[]) => selected.filter((selectedKey) => {
        const item = items.find((candidate) => candidate.key === selectedKey);
        return item?.categoryKeys?.some((categoryKey) => categories.has(categoryKey));
      });
      return {
        ...current,
        categoryKeys,
        serviceKeys: compatible(data.catalog.services, current.serviceKeys),
        capabilityKeys: compatible(data.catalog.capabilities, current.capabilityKeys),
        packagingFormatKeys: compatible(data.catalog.packagingFormats, current.packagingFormatKeys),
      };
    });
  }

  function updateOfferingInState(offering: Offering) {
    setData((current) => current ? {
      ...current,
      providers: current.providers.map((provider) => provider.id !== selectedProviderId ? provider : {
        ...provider,
        markets: provider.markets.map((market) => market.id !== selectedMarketId ? market : {
          ...market,
          offerings: market.offerings.some((item) => item.id === offering.id)
            ? market.offerings.map((item) => item.id === offering.id ? offering : item)
            : [...market.offerings, offering],
        }),
      }),
    } : current);
  }

  async function save(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!selectedProvider || !selectedMarket) return;

    try {
      setSaving(true);
      setMessage("");
      setError("");
      const response = await fetch("/api/works/provider/offerings", {
        method: selectedOfferingId ? "PATCH" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          providerId: selectedProvider.id,
          providerMarketId: selectedMarket.id,
          offeringId: selectedOfferingId,
          ...form,
          sampleAvailable: booleanValue(form.sampleAvailable),
          startupFriendly: booleanValue(form.startupFriendly),
          packagingSupplied: booleanValue(form.packagingSupplied),
          clientPackagingAccepted: booleanValue(form.clientPackagingAccepted),
        }),
      });
      const payload = await response.json() as { offering?: Offering; message?: string; error?: string };
      if (!response.ok || !payload.offering) throw new Error(payload.error ?? "WORKS could not save this offering.");

      updateOfferingInState(payload.offering);
      setSelectedOfferingId(payload.offering.id);
      setForm(toForm(payload.offering));
      setMessage(payload.message ?? "Offering saved.");
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "WORKS could not save this offering.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <main className="mx-auto min-h-screen w-full max-w-6xl px-5 py-8 md:px-8 md:py-12">
      <WorksPageHeader
        href="/works/provider"
        context="Provider workspace"
        action={<SignedIn><UserButton afterSignOutUrl="/works/za" /></SignedIn>}
      />

      <SignedOut>
        <section className="py-16">
          <h1 className="font-serif text-4xl text-[#1f1c17]">Sign in to manage provider capabilities</h1>
          <p className="mt-4 max-w-xl text-sm leading-7 text-black/55">Capability information belongs to the verified business workspace.</p>
          <SignInButton mode="modal"><button className="mt-7 rounded-full bg-[#1f1c17] px-6 py-3 text-sm text-white">Sign in →</button></SignInButton>
        </section>
      </SignedOut>

      <SignedIn>
        <section className="py-10 md:py-14">
          <WorksProviderNav current="/works/provider/capabilities" />

          <div className="mt-10 max-w-3xl">
            <p className="text-xs font-medium uppercase tracking-[0.18em] text-[#16834f]">Capability setup</p>
            <h1 className="mt-2 font-serif text-4xl leading-tight text-[#1f1c17] md:text-5xl">Describe each offering WORKS can match</h1>
            <p className="mt-4 text-sm leading-7 text-black/55">An offering is one distinct thing the business can supply or do. WORKS uses its category, production services, capabilities, quantity range and lead time against a customer brief.</p>
          </div>

          {loading ? <p className="mt-10 text-sm text-black/40">Loading capability workspace…</p> : null}
          {error && !data ? <p className="mt-8 text-sm text-red-700">{error}</p> : null}

          {!loading && data?.providers.length === 0 ? (
            <div className="mt-10 rounded-3xl border border-black/10 bg-white/70 p-7">
              <h2 className="font-serif text-3xl">Connect a business first</h2>
              <p className="mt-3 text-sm leading-7 text-black/50">Add a business or connect an existing WORKS listing before creating capability offerings.</p>
              <Link href="/works/providers/join" className="mt-6 inline-flex rounded-full bg-[#1f1c17] px-6 py-3 text-sm text-white">Open provider joining →</Link>
            </div>
          ) : null}

          {data && selectedProvider && selectedMarket ? (
            <>
              {data.providers.length > 1 ? (
                <div className="mt-8 flex flex-wrap gap-2">
                  {data.providers.map((provider) => <button key={provider.id} type="button" onClick={() => chooseProvider(provider)} className={`rounded-full border px-4 py-2 text-sm ${selectedProvider.id === provider.id ? "border-[#1f1c17] bg-[#1f1c17] text-white" : "border-black/15 bg-white"}`}>{provider.name}</button>)}
                </div>
              ) : null}

              {selectedProvider.markets.length > 1 ? (
                <div className="mt-4 flex flex-wrap gap-2">
                  {selectedProvider.markets.map((market) => <button key={market.id} type="button" onClick={() => selectMarket(selectedProvider, market)} className={`rounded-full border px-4 py-2 text-sm ${selectedMarket.id === market.id ? "border-[#16834f] bg-[#eef7f1] text-[#11683d]" : "border-black/10 bg-white"}`}>{market.name}</button>)}
                </div>
              ) : null}

              <div className="mt-10 grid gap-8 lg:grid-cols-[260px_minmax(0,1fr)]">
                <aside>
                  <div className="flex items-center justify-between gap-3">
                    <p className="text-xs font-medium uppercase tracking-[0.16em] text-black/40">Offerings</p>
                    <button type="button" onClick={() => chooseOffering(null)} className="text-sm underline underline-offset-4">Add new</button>
                  </div>
                  <div className="mt-4 space-y-2">
                    {selectedMarket.offerings.map((offering) => (
                      <button key={offering.id} type="button" onClick={() => chooseOffering(offering)} className={`w-full rounded-2xl border p-4 text-left ${selectedOfferingId === offering.id ? "border-[#1f1c17] bg-white" : "border-black/8 bg-white/55"}`}>
                        <span className="block text-sm font-medium">{offering.name}</span>
                        <span className="mt-2 block"><EvidenceBadge offering={offering} /></span>
                      </button>
                    ))}
                    {!selectedMarket.offerings.length ? <p className="rounded-2xl bg-black/[0.025] p-4 text-sm leading-6 text-black/40">No offerings yet. Add the first thing this business can genuinely provide.</p> : null}
                  </div>
                </aside>

                <form onSubmit={save} className="space-y-10">
                  <section className="rounded-3xl border border-black/10 bg-white/70 p-6 md:p-8">
                    <p className="text-xs font-medium uppercase tracking-[0.16em] text-[#16834f]">1 · Offering</p>
                    <h2 className="mt-2 font-serif text-3xl">What can this business provide?</h2>
                    <div className="mt-6 grid gap-4">
                      <label className="text-xs text-black/45">Offering name *<input value={form.name} onChange={(event) => setForm((current) => ({ ...current, name: event.target.value }))} placeholder="Small-batch sauce manufacturing" className="mt-1 w-full rounded-xl border border-black/10 bg-white px-4 py-3 text-base" /></label>
                      <label className="text-xs text-black/45">Production model<select value={form.productionModel} onChange={(event) => setForm((current) => ({ ...current, productionModel: event.target.value }))} className="mt-1 w-full rounded-xl border border-black/10 bg-white px-4 py-3 text-sm"><option value="">Not specified yet</option>{PRODUCTION_MODELS.map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select></label>
                      <label className="text-xs text-black/45">Description<textarea value={form.description} onChange={(event) => setForm((current) => ({ ...current, description: event.target.value }))} rows={4} maxLength={2000} placeholder="What is included, what product types fit, and where the boundaries are…" className="mt-1 w-full resize-none rounded-xl border border-black/10 bg-white px-4 py-3 text-sm leading-6" /></label>
                    </div>
                  </section>

                  <section>
                    <p className="text-xs font-medium uppercase tracking-[0.16em] text-[#16834f]">2 · Match scope</p>
                    <h2 className="mt-2 font-serif text-3xl">Product categories</h2>
                    <p className="mt-3 text-sm leading-6 text-black/50">Choose only categories this specific offering can actually support.</p>
                    <div className="mt-5"><ChoiceGrid items={marketCategories} selected={form.categoryKeys} onToggle={toggleCategory} /></div>

                    <h2 className="mt-10 font-serif text-3xl">Production services</h2>
                    <p className="mt-3 text-sm leading-6 text-black/50">These services determine which open steps in a customer&apos;s production route this offering can cover.</p>
                    <div className="mt-5"><ChoiceGrid items={applicableServices} selected={form.serviceKeys} onToggle={(key) => setForm((current) => ({ ...current, serviceKeys: toggle(current.serviceKeys, key) }))} emptyMessage="Choose at least one product category to see the relevant production services." /></div>
                  </section>

                  <section>
                    <p className="text-xs font-medium uppercase tracking-[0.16em] text-[#16834f]">3 · Specific capability</p>
                    <h2 className="mt-2 font-serif text-3xl">Processes and formats</h2>
                    <p className="mt-3 text-sm leading-6 text-black/50">These make requirement matching more precise. Leave anything uncertain unselected rather than guessing.</p>
                    <div className="mt-6"><p className="mb-3 text-sm font-medium">Capabilities</p><ChoiceGrid items={applicableCapabilities} selected={form.capabilityKeys} onToggle={(key) => setForm((current) => ({ ...current, capabilityKeys: toggle(current.capabilityKeys, key) }))} emptyMessage="Choose a product category to see relevant capabilities." /></div>
                    <div className="mt-8"><p className="mb-3 text-sm font-medium">Packaging formats</p><ChoiceGrid items={applicablePackaging} selected={form.packagingFormatKeys} onToggle={(key) => setForm((current) => ({ ...current, packagingFormatKeys: toggle(current.packagingFormatKeys, key) }))} emptyMessage="Choose a product category to see relevant packaging formats." /></div>
                  </section>

                  <section className="rounded-3xl border border-black/10 bg-white/70 p-6 md:p-8">
                    <p className="text-xs font-medium uppercase tracking-[0.16em] text-[#16834f]">4 · Working range</p>
                    <h2 className="mt-2 font-serif text-3xl">Quantity and lead time</h2>
                    <p className="mt-3 text-sm leading-6 text-black/50">Use the range the business can realistically quote today. Unknown values can stay blank.</p>
                    <div className="mt-6 grid gap-4 sm:grid-cols-3">
                      <label className="text-xs text-black/45">Minimum order<input type="number" min="0" step="any" value={form.moqValue} onChange={(event) => setForm((current) => ({ ...current, moqValue: event.target.value }))} className="mt-1 w-full rounded-xl border border-black/10 bg-white px-4 py-3" /></label>
                      <label className="text-xs text-black/45">Maximum run<input type="number" min="0" step="any" value={form.maxRunValue} onChange={(event) => setForm((current) => ({ ...current, maxRunValue: event.target.value }))} className="mt-1 w-full rounded-xl border border-black/10 bg-white px-4 py-3" /></label>
                      <label className="text-xs text-black/45">Quantity unit<select value={form.quantityUnit} onChange={(event) => setForm((current) => ({ ...current, quantityUnit: event.target.value }))} className="mt-1 w-full rounded-xl border border-black/10 bg-white px-4 py-3 text-sm">{QUANTITY_UNITS.map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select></label>
                    </div>
                    <div className="mt-5 grid gap-4 sm:grid-cols-3">
                      <label className="text-xs text-black/45">Lead time from<input type="number" min="0" step="1" value={form.leadTimeMinDays} onChange={(event) => setForm((current) => ({ ...current, leadTimeMinDays: event.target.value }))} placeholder="days" className="mt-1 w-full rounded-xl border border-black/10 bg-white px-4 py-3" /></label>
                      <label className="text-xs text-black/45">Lead time to<input type="number" min="0" step="1" value={form.leadTimeMaxDays} onChange={(event) => setForm((current) => ({ ...current, leadTimeMaxDays: event.target.value }))} placeholder="days" className="mt-1 w-full rounded-xl border border-black/10 bg-white px-4 py-3" /></label>
                      <label className="text-xs text-black/45">Day basis<select value={form.leadTimeBasis} onChange={(event) => setForm((current) => ({ ...current, leadTimeBasis: event.target.value }))} className="mt-1 w-full rounded-xl border border-black/10 bg-white px-4 py-3 text-sm"><option value="WORKING_DAYS">Working days</option><option value="CALENDAR_DAYS">Calendar days</option></select></label>
                    </div>
                  </section>

                  <section>
                    <p className="text-xs font-medium uppercase tracking-[0.16em] text-[#16834f]">5 · Practical fit</p>
                    <h2 className="mt-2 font-serif text-3xl">How the offering works</h2>
                    <div className="mt-6 grid gap-4 sm:grid-cols-2">
                      <TriStateField label="Samples available" value={form.sampleAvailable} onChange={(value) => setForm((current) => ({ ...current, sampleAvailable: value }))} />
                      <TriStateField label="Suitable for early-stage businesses" value={form.startupFriendly} onChange={(value) => setForm((current) => ({ ...current, startupFriendly: value }))} />
                      <TriStateField label="Can supply the packaging" value={form.packagingSupplied} onChange={(value) => setForm((current) => ({ ...current, packagingSupplied: value }))} />
                      <TriStateField label="Accepts customer-supplied packaging" value={form.clientPackagingAccepted} onChange={(value) => setForm((current) => ({ ...current, clientPackagingAccepted: value }))} />
                    </div>
                    <label className="mt-5 flex items-start gap-3 rounded-2xl border border-black/10 bg-white/70 p-5"><input type="checkbox" checked={form.quoteRequired} onChange={(event) => setForm((current) => ({ ...current, quoteRequired: event.target.checked }))} className="mt-1 accent-[#16834f]" /><span><span className="block text-sm font-medium">Price requires a quote</span><span className="mt-1 block text-xs leading-5 text-black/45">Leave enabled unless the offering has a stable public price.</span></span></label>
                  </section>

                  <section className="rounded-3xl border border-[#8b6a31]/20 bg-[#f8f0df] p-6 md:p-8">
                    <label className="flex items-start gap-3"><input type="checkbox" checked={form.active} onChange={(event) => setForm((current) => ({ ...current, active: event.target.checked }))} className="mt-1 accent-[#16834f]" /><span><span className="block font-medium">Include this offering in customer matching</span><span className="mt-2 block text-sm leading-6 text-black/55">Provider-supplied information enters as a possible fit. WORKS does not present it as confirmed until the relevant evidence is reviewed.</span></span></label>
                  </section>

                  {message ? <p className="rounded-2xl bg-[#eef7f1] p-4 text-sm text-[#11683d]">{message}</p> : null}
                  {error && data ? <p className="text-sm text-red-700">{error}</p> : null}
                  <button type="submit" disabled={saving || form.name.trim().length < 2} className="rounded-full bg-[#1f1c17] px-7 py-3 text-sm font-medium text-white disabled:opacity-40">{saving ? "Saving offering…" : selectedOfferingId ? "Save offering →" : "Create offering →"}</button>
                </form>
              </div>
            </>
          ) : null}
        </section>
      </SignedIn>
    </main>
  );
}
