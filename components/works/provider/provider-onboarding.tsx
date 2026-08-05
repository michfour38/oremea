"use client";

import { SignInButton, SignedIn, SignedOut } from "@clerk/nextjs";
import { useEffect, useMemo, useState } from "react";

import { MemberWorksNav } from "@/components/works/member-works-nav";

type Tab = "start" | "business" | "plans" | "progress";
type Mode = "add" | "claim" | null;

type FormState = {
  name: string;
  legalName: string;
  website: string;
  email: string;
  phone: string;
  description: string;
  administrativeArea: string;
  locality: string;
  servesNationally: boolean;
  acceptsRemoteClients: boolean;
};

type ProviderResult = {
  id: string;
  name: string;
  slug: string;
  website: string | null;
  alreadyClaimed: boolean;
};

type Claim = {
  id: string;
  status: "PENDING" | "APPROVED" | "DECLINED" | "CANCELLED";
  business_email: string;
  created_at: string;
  provider: { id: string; name: string; slug: string };
};

type CreatedProvider = { name: string; slug: string };

type SavedJourney = {
  tab?: Tab;
  mode?: Mode;
  query?: string;
  businessEmail?: string;
  note?: string;
  created?: CreatedProvider | null;
};

const INITIAL: FormState = {
  name: "",
  legalName: "",
  website: "",
  email: "",
  phone: "",
  description: "",
  administrativeArea: "",
  locality: "",
  servesNationally: false,
  acceptsRemoteClients: false,
};

const FORM_KEY = "works-provider-new-draft";
const JOURNEY_KEY = "works-provider-onboarding";

const plans = [
  {
    name: "Free",
    price: "R0",
    detail: "A searchable public listing for customers who are actively looking for a business like yours.",
    features: [
      "Searchable public business profile",
      "Appear in customer searches where your capability fits",
      "Keep core business information visible",
      "Customer reviews can appear on your public profile",
    ],
  },
  {
    name: "Active",
    price: "R599 / month",
    detail: "Receive suitable WORKS opportunities and keep your capability, capacity and availability information current.",
    features: [
      "Everything in Free",
      "Matched opportunities sent to your WORKS inbox",
      "Capability, capacity and availability controls",
      "Business response workspace",
      "Customer reviews on your public profile",
    ],
  },
  {
    name: "Growth",
    price: "R1,999 / month",
    detail: "Choose the capabilities and capacity you want to grow, and let WORKS actively create demand around them.",
    features: [
      "Everything in Active",
      "Active demand generation around selected capabilities",
      "Choose the categories and work you want more of",
      "Demand insights as WORKS data grows",
      "Customer reviews on your public profile",
    ],
  },
] as const;

function isTab(value: string | null): value is Tab {
  return value === "start" || value === "business" || value === "plans" || value === "progress";
}

function isMode(value: string | null): value is Exclude<Mode, null> {
  return value === "add" || value === "claim";
}

export function WorksProviderOnboarding() {
  const [ready, setReady] = useState(false);
  const [tab, setTab] = useState<Tab>("start");
  const [mode, setMode] = useState<Mode>(null);
  const [form, setForm] = useState<FormState>(INITIAL);
  const [created, setCreated] = useState<CreatedProvider | null>(null);
  const [saving, setSaving] = useState(false);
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<ProviderResult[]>([]);
  const [claims, setClaims] = useState<Claim[]>([]);
  const [selected, setSelected] = useState<ProviderResult | null>(null);
  const [businessEmail, setBusinessEmail] = useState("");
  const [note, setNote] = useState("");
  const [loading, setLoading] = useState(false);
  const [sending, setSending] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    try {
      const params = new URLSearchParams(window.location.search);
      const storedJourney = window.localStorage.getItem(JOURNEY_KEY);
      const journey = storedJourney ? JSON.parse(storedJourney) as SavedJourney : {};
      const storedForm = window.localStorage.getItem(FORM_KEY);
      const requestedTab = params.get("tab");
      const requestedMode = params.get("mode");

      setTab(isTab(requestedTab) ? requestedTab : journey.tab ?? "start");
      setMode(isMode(requestedMode) ? requestedMode : journey.mode ?? null);
      setQuery(journey.query ?? "");
      setBusinessEmail(journey.businessEmail ?? "");
      setNote(journey.note ?? "");
      setCreated(journey.created ?? null);
      if (storedForm) setForm({ ...INITIAL, ...JSON.parse(storedForm) });
    } catch {
      window.localStorage.removeItem(FORM_KEY);
      window.localStorage.removeItem(JOURNEY_KEY);
    } finally {
      setReady(true);
    }
  }, []);

  useEffect(() => {
    if (!ready) return;

    window.localStorage.setItem(FORM_KEY, JSON.stringify(form));
    window.localStorage.setItem(
      JOURNEY_KEY,
      JSON.stringify({ tab, mode, query, businessEmail, note, created } satisfies SavedJourney),
    );

    const params = new URLSearchParams();
    params.set("tab", tab);
    if (mode) params.set("mode", mode);
    window.history.replaceState(null, "", `/works/providers/join?${params.toString()}`);
  }, [businessEmail, created, form, mode, note, query, ready, tab]);

  const progressAvailable = Boolean(created || message || claims.length);
  const returnUrl = useMemo(() => {
    const params = new URLSearchParams({ tab });
    if (mode) params.set("mode", mode);
    return `/works/providers/join?${params.toString()}`;
  }, [mode, tab]);

  function chooseMode(nextMode: Exclude<Mode, null>) {
    setMode(nextMode);
    setTab("business");
    setError("");
    setMessage("");
  }

  async function createProvider() {
    try {
      setSaving(true);
      setError("");
      const response = await fetch("/api/works/providers/new", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ marketSlug: "za", ...form }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data?.error ?? "WORKS could not add this business yet.");
      setCreated(data.provider);
      setMessage(data.message ?? "Your business has been added to WORKS.");
      window.localStorage.removeItem(FORM_KEY);
      setTab("progress");
    } catch (err) {
      setError(err instanceof Error ? err.message : "WORKS could not add this business yet.");
    } finally {
      setSaving(false);
    }
  }

  async function loadClaims(search = "") {
    try {
      setLoading(true);
      setError("");
      const response = await fetch(`/api/works/provider-claims?q=${encodeURIComponent(search)}`);
      if (response.status === 401) return;
      const data = await response.json();
      if (!response.ok) throw new Error(data?.error ?? "WORKS could not search business profiles.");
      setResults(data.providers ?? []);
      setClaims(data.claims ?? []);
    } catch (err) {
      setError(err instanceof Error ? err.message : "WORKS could not search business profiles.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (!ready || mode !== "claim") return;
    void loadClaims(query.trim());
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mode, ready]);

  async function search() {
    setSelected(null);
    setMessage("");
    await loadClaims(query.trim());
  }

  async function submitClaim() {
    if (!selected) return;

    try {
      setSending(true);
      setError("");
      setMessage("");
      const response = await fetch("/api/works/provider-claims", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ providerId: selected.id, businessEmail, note }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data?.error ?? "WORKS could not submit this connection request yet.");
      setMessage(data.message ?? "Your connection request has been submitted.");
      setSelected(null);
      setBusinessEmail("");
      setNote("");
      await loadClaims(query.trim());
      setTab("progress");
    } catch (err) {
      setError(err instanceof Error ? err.message : "WORKS could not submit this connection request yet.");
    } finally {
      setSending(false);
    }
  }

  function startAnother() {
    setCreated(null);
    setMessage("");
    setError("");
    setForm(INITIAL);
    setMode("add");
    setTab("business");
    window.localStorage.removeItem(FORM_KEY);
  }

  const tabs: { id: Tab; label: string; hint: string; disabled?: boolean }[] = [
    { id: "start", label: "Start", hint: "Choose your route" },
    { id: "business", label: "Business", hint: "Add or connect" },
    { id: "plans", label: "Plans", hint: "Compare" },
    { id: "progress", label: "Progress", hint: "Return here", disabled: !progressAvailable },
  ];

  return (
    <main className="min-h-screen bg-[#fbfaf7] text-[#1f1c17]">
      <div className="mx-auto w-full max-w-6xl px-5 py-8 md:px-8 md:py-12">
        <MemberWorksNav
          href="/works"
          action={
            <>
              <SignedOut>
                <SignInButton mode="modal" forceRedirectUrl={returnUrl}>
                  <button className="rounded-full border border-black/15 bg-white px-4 py-2 text-sm">Manage my business</button>
                </SignInButton>
              </SignedOut>
              <SignedIn>
                <a href="/works/provider" className="rounded-full border border-black/15 bg-white px-4 py-2 text-sm">Manage my business →</a>
              </SignedIn>
            </>
          }
        />

        <nav className="mt-7 grid gap-2 sm:grid-cols-4" aria-label="Business joining progress" role="tablist">
          {tabs.map((item) => {
            const active = tab === item.id;
            return (
              <button
                key={item.id}
                type="button"
                role="tab"
                aria-selected={active}
                disabled={item.disabled}
                onClick={() => setTab(item.id)}
                className={`rounded-2xl border px-4 py-3 text-left transition ${active ? "border-[#1f1c17] bg-[#1f1c17] text-white" : "border-black/10 bg-white/70 text-black/60 hover:border-black/25"} disabled:cursor-not-allowed disabled:opacity-35`}
              >
                <span className="block text-sm font-medium">{item.label}</span>
                <span className={`mt-1 block text-xs ${active ? "text-white/55" : "text-black/35"}`}>{item.hint}</span>
              </button>
            );
          })}
        </nav>

        {!ready ? <p className="py-16 text-sm text-black/40">Opening your WORKS journey…</p> : null}

        {ready && tab === "start" ? (
          <section className="py-12 md:py-16" role="tabpanel">
            <p className="text-xs font-medium uppercase tracking-[0.2em] text-[#16834f]">List your business</p>
            <h1 className="mt-4 max-w-4xl font-serif text-5xl leading-[1.05] md:text-6xl">Make your business findable on WORKS</h1>
            <p className="mt-6 max-w-2xl text-base leading-8 text-black/60">Add a new business or connect an existing WORKS listing. Once connected, manage your public profile, capacity, opportunities, demand insights and reviews from one workspace.</p>

            <div className="mt-10 grid gap-4 md:grid-cols-2">
              <button type="button" onClick={() => chooseMode("add")} className="rounded-3xl bg-[#1f1c17] p-7 text-left text-white">
                <span className="block text-xs uppercase tracking-[0.16em] text-white/55">New to WORKS</span>
                <span className="mt-3 block font-serif text-3xl">Add my business</span>
                <span className="mt-3 block max-w-md text-sm leading-6 text-white/65">Add a manufacturer, supplier, production provider or independent business-service provider.</span>
                <span className="mt-6 block text-sm">Continue →</span>
              </button>

              <button type="button" onClick={() => chooseMode("claim")} className="rounded-3xl border border-black/12 bg-white p-7 text-left">
                <span className="block text-xs uppercase tracking-[0.16em] text-black/40">Already listed</span>
                <span className="mt-3 block font-serif text-3xl">Find my business</span>
                <span className="mt-3 block max-w-md text-sm leading-6 text-black/50">Connect your account to an existing public WORKS listing after the business relationship is checked.</span>
                <span className="mt-6 block text-sm">Continue →</span>
              </button>
            </div>

            <div className="mt-8 flex flex-wrap gap-x-6 gap-y-3 border-t border-black/10 pt-6 text-sm text-black/50">
              <button type="button" onClick={() => setTab("plans")} className="underline underline-offset-4">Compare plans</button>
              <a href="/works" className="underline underline-offset-4">I need something made</a>
            </div>
          </section>
        ) : null}

        {ready && tab === "business" ? (
          <section className="py-10 md:py-14" role="tabpanel">
            <div className="flex flex-wrap items-end justify-between gap-5 border-b border-black/10 pb-6">
              <div>
                <p className="text-xs font-medium uppercase tracking-[0.18em] text-[#16834f]">Business connection</p>
                <h1 className="mt-3 font-serif text-4xl md:text-5xl">Add a business or connect one already listed</h1>
              </div>
              <div className="flex flex-wrap gap-2">
                <button type="button" onClick={() => chooseMode("add")} className={`rounded-full border px-4 py-2 text-sm ${mode === "add" ? "border-[#1f1c17] bg-[#1f1c17] text-white" : "border-black/15 bg-white"}`}>Add a business</button>
                <button type="button" onClick={() => chooseMode("claim")} className={`rounded-full border px-4 py-2 text-sm ${mode === "claim" ? "border-[#1f1c17] bg-[#1f1c17] text-white" : "border-black/15 bg-white"}`}>Find an existing business</button>
              </div>
            </div>

            {!mode ? <div className="mt-8 rounded-3xl border border-black/10 bg-white/70 p-7 text-sm text-black/55">Is your business already listed on WORKS? Choose the route that fits.</div> : null}

            <SignedOut>
              {mode ? (
                <div className="mt-8 rounded-3xl border border-black/10 bg-white p-7 md:p-8">
                  <p className="text-xs font-medium uppercase tracking-[0.18em] text-[#16834f]">Your place is saved</p>
                  <h2 className="mt-3 font-serif text-3xl">Sign in to continue</h2>
                  <p className="mt-4 max-w-xl text-sm leading-7 text-black/55">WORKS returns to this business step after sign-in. Anything already entered remains here.</p>
                  <SignInButton mode="modal" forceRedirectUrl={returnUrl}>
                    <button className="mt-6 rounded-full bg-[#1f1c17] px-6 py-3 text-sm text-white">Sign in to continue →</button>
                  </SignInButton>
                </div>
              ) : null}
            </SignedOut>

            <SignedIn>
              {mode === "add" ? (
                <div className="mt-8 grid gap-5 rounded-3xl border border-black/10 bg-white p-6 md:p-8">
                  <div>
                    <h2 className="font-serif text-3xl">Add your business to WORKS</h2>
                    <p className="mt-3 max-w-2xl text-sm leading-7 text-black/55">Add a manufacturer, supplier, production provider or independent business-service provider. Contact details, description and location remain private by default until you choose what becomes public.</p>
                  </div>

                  <div className="grid gap-4 md:grid-cols-2">
                    <label className="text-xs text-black/45">Business name *<input value={form.name} onChange={(event) => setForm((value) => ({ ...value, name: event.target.value }))} placeholder="Business name" className="mt-1 w-full rounded-xl border border-black/10 px-4 py-3 text-base outline-none focus:border-[#16834f]" /></label>
                    <label className="text-xs text-black/45">Legal name (optional)<input value={form.legalName} onChange={(event) => setForm((value) => ({ ...value, legalName: event.target.value }))} placeholder="Registered company name" className="mt-1 w-full rounded-xl border border-black/10 px-4 py-3 text-base outline-none focus:border-[#16834f]" /></label>
                  </div>

                  <div className="grid gap-4 md:grid-cols-2">
                    <label className="text-xs text-black/45">Website<input value={form.website} onChange={(event) => setForm((value) => ({ ...value, website: event.target.value }))} placeholder="https://…" className="mt-1 w-full rounded-xl border border-black/10 px-4 py-3 text-base outline-none focus:border-[#16834f]" /></label>
                    <label className="text-xs text-black/45">Business email<input type="email" value={form.email} onChange={(event) => setForm((value) => ({ ...value, email: event.target.value }))} placeholder="hello@company.co.za" className="mt-1 w-full rounded-xl border border-black/10 px-4 py-3 text-base outline-none focus:border-[#16834f]" /></label>
                  </div>

                  <div className="grid gap-4 md:grid-cols-2">
                    <label className="text-xs text-black/45">Phone<input value={form.phone} onChange={(event) => setForm((value) => ({ ...value, phone: event.target.value }))} placeholder="Business phone" className="mt-1 w-full rounded-xl border border-black/10 px-4 py-3 text-base outline-none focus:border-[#16834f]" /></label>
                    <label className="text-xs text-black/45">Province / region<input value={form.administrativeArea} onChange={(event) => setForm((value) => ({ ...value, administrativeArea: event.target.value }))} placeholder="Gauteng" className="mt-1 w-full rounded-xl border border-black/10 px-4 py-3 text-base outline-none focus:border-[#16834f]" /></label>
                  </div>

                  <label className="text-xs text-black/45">City / locality<input value={form.locality} onChange={(event) => setForm((value) => ({ ...value, locality: event.target.value }))} placeholder="Johannesburg" className="mt-1 w-full rounded-xl border border-black/10 px-4 py-3 text-base outline-none focus:border-[#16834f]" /></label>
                  <label className="text-xs text-black/45">Business description<textarea value={form.description} onChange={(event) => setForm((value) => ({ ...value, description: event.target.value }))} rows={5} placeholder="Describe what the business makes, supplies or provides" className="mt-1 w-full resize-none rounded-xl border border-black/10 px-4 py-3 text-sm leading-6 outline-none focus:border-[#16834f]" /></label>

                  <div className="grid gap-3 md:grid-cols-2">
                    <label className="flex items-start gap-3 rounded-2xl border border-black/10 p-4"><input type="checkbox" checked={form.servesNationally} onChange={(event) => setForm((value) => ({ ...value, servesNationally: event.target.checked }))} className="mt-1"/><span><span className="block text-sm font-medium">Serve customers nationally</span><span className="mt-1 block text-xs leading-5 text-black/45">Private matching information until you choose to show location.</span></span></label>
                    <label className="flex items-start gap-3 rounded-2xl border border-black/10 p-4"><input type="checkbox" checked={form.acceptsRemoteClients} onChange={(event) => setForm((value) => ({ ...value, acceptsRemoteClients: event.target.checked }))} className="mt-1"/><span><span className="block text-sm font-medium">Accept remote clients</span><span className="mt-1 block text-xs leading-5 text-black/45">Used when WORKS builds a suitable route or match.</span></span></label>
                  </div>

                  <div className="rounded-2xl bg-[#eef7f1] p-5 text-xs leading-6 text-black/55"><strong className="text-[#1f1c17]">Privacy by default.</strong> Your business name identifies the WORKS record. Contact details, description, location, capacity, demand targets and internal matching information stay private until their specific visibility settings allow otherwise.</div>

                  {error ? <p className="text-sm text-red-700">{error}</p> : null}
                  <div className="flex flex-wrap items-center gap-3">
                    <button type="button" onClick={() => void createProvider()} disabled={saving || form.name.trim().length < 2} className="rounded-full bg-[#1f1c17] px-6 py-3 text-sm text-white disabled:opacity-40">{saving ? "Adding…" : "Add my business →"}</button>
                    <button type="button" onClick={() => chooseMode("claim")} className="text-sm text-black/55 underline underline-offset-4">My business is already on WORKS</button>
                  </div>
                </div>
              ) : null}

              {mode === "claim" ? (
                <div className="mt-8">
                  <div className="rounded-3xl border border-black/10 bg-white p-6 md:p-8">
                    <h2 className="font-serif text-3xl">Find the WORKS profile for your business</h2>
                    <p className="mt-3 max-w-2xl text-sm leading-7 text-black/55">Search by business name. Editing access begins only after WORKS checks the relationship.</p>
                    <div className="mt-6 flex max-w-2xl gap-3">
                      <input value={query} onChange={(event) => setQuery(event.target.value)} onKeyDown={(event) => { if (event.key === "Enter") void search(); }} placeholder="Business name" className="min-w-0 flex-1 rounded-xl border border-black/12 bg-white px-4 py-3 outline-none focus:border-[#16834f]" />
                      <button type="button" onClick={() => void search()} disabled={loading || query.trim().length < 2} className="rounded-full bg-[#1f1c17] px-5 py-3 text-sm text-white disabled:opacity-40">{loading ? "Searching…" : "Search"}</button>
                    </div>

                    {results.length ? (
                      <div className="mt-6 space-y-3">
                        {results.map((provider) => (
                          <button key={provider.id} type="button" disabled={provider.alreadyClaimed} onClick={() => { setSelected(provider); setMessage(""); setError(""); }} className="flex w-full items-center justify-between gap-4 rounded-2xl border border-black/10 bg-white p-5 text-left disabled:opacity-45">
                            <div><p className="font-medium">{provider.name}</p>{provider.website ? <p className="mt-1 text-xs text-black/40">{provider.website}</p> : null}</div>
                            <span className="text-sm text-black/45">{provider.alreadyClaimed ? "Already managed" : "Connect →"}</span>
                          </button>
                        ))}
                      </div>
                    ) : query.trim().length >= 2 && !loading ? (
                      <div className="mt-6 rounded-2xl border border-black/10 bg-[#fbfaf7] p-5">
                        <p className="text-sm">No matching WORKS profile found</p>
                        <button type="button" onClick={() => chooseMode("add")} className="mt-3 text-sm underline underline-offset-4">Add a new business →</button>
                      </div>
                    ) : null}
                  </div>

                  {selected ? (
                    <section className="mt-6 rounded-3xl border border-black/10 bg-white p-6 md:p-7">
                      <p className="text-xs font-medium uppercase tracking-[0.18em] text-[#16834f]">Connect to {selected.name}</p>
                      <h2 className="mt-3 font-serif text-3xl">Confirm your connection to this business</h2>
                      <p className="mt-3 max-w-2xl text-sm leading-6 text-black/50">Use an email address on the business&apos;s own domain. Personal email services such as Gmail cannot establish ownership. Where WORKS has the company website, the email domain must match it.</p>
                      <div className="mt-6 grid gap-4">
                        <label className="text-xs text-black/45">Business email<input type="email" value={businessEmail} onChange={(event) => setBusinessEmail(event.target.value)} placeholder="you@company.co.za" className="mt-1 w-full rounded-xl border border-black/10 bg-white px-4 py-3 text-base outline-none focus:border-[#16834f]" /></label>
                        <label className="text-xs text-black/45">Your role or anything that helps WORKS verify the connection<textarea value={note} onChange={(event) => setNote(event.target.value)} rows={3} placeholder="Owner, operations manager, company director…" className="mt-1 w-full resize-none rounded-xl border border-black/10 bg-white px-4 py-3 text-sm leading-6 outline-none focus:border-[#16834f]" /></label>
                      </div>
                      <p className="mt-4 text-xs leading-5 text-black/40">The email and verification note stay inside WORKS. A pending request has no editing authority.</p>
                      <div className="mt-6 flex flex-wrap gap-3">
                        <button type="button" onClick={() => void submitClaim()} disabled={sending || !businessEmail.trim()} className="rounded-full bg-[#1f1c17] px-6 py-3 text-sm text-white disabled:opacity-40">{sending ? "Submitting…" : "Submit connection request →"}</button>
                        <button type="button" onClick={() => setSelected(null)} className="rounded-full border border-black/15 bg-white px-5 py-3 text-sm">Cancel</button>
                      </div>
                    </section>
                  ) : null}

                  {claims.length ? (
                    <section className="mt-8 border-t border-black/10 pt-8">
                      <p className="text-xs font-medium uppercase tracking-[0.18em] text-black/40">Your connection requests</p>
                      <div className="mt-4 space-y-3">
                        {claims.map((claim) => (
                          <div key={claim.id} className="flex flex-wrap items-center justify-between gap-3 rounded-2xl bg-white/70 p-4">
                            <div><p className="text-sm font-medium">{claim.provider.name}</p><p className="mt-1 text-xs text-black/40">Submitted with {claim.business_email}</p></div>
                            <span className="rounded-full border border-black/10 px-3 py-1.5 text-xs text-black/55">{claim.status.charAt(0) + claim.status.slice(1).toLowerCase()}</span>
                          </div>
                        ))}
                      </div>
                    </section>
                  ) : null}
                  {error ? <p className="mt-6 text-sm text-red-700">{error}</p> : null}
                </div>
              ) : null}
            </SignedIn>
          </section>
        ) : null}

        {ready && tab === "plans" ? (
          <section className="py-10 md:py-14" role="tabpanel">
            <p className="text-xs font-medium uppercase tracking-[0.2em] text-[#16834f]">Business plans</p>
            <h1 className="mt-3 max-w-3xl font-serif text-4xl md:text-5xl">Choose how your business participates in WORKS</h1>
            <p className="mt-5 max-w-3xl text-sm leading-7 text-black/55">Free keeps your business searchable. Active routes suitable opportunities to your WORKS inbox. Growth adds active demand generation around the capabilities and capacity you choose to grow.</p>

            <div className="mt-10 grid gap-4 lg:grid-cols-3">
              {plans.map((plan) => (
                <article key={plan.name} className="rounded-3xl border border-black/10 bg-white p-6">
                  <p className="text-xs uppercase tracking-[0.18em] text-black/40">{plan.name}</p>
                  <p className="mt-3 font-serif text-3xl">{plan.price}</p>
                  <p className="mt-4 text-sm leading-6 text-black/55">{plan.detail}</p>
                  <div className="mt-6 space-y-2 border-t border-black/8 pt-5">{plan.features.map((feature) => <p key={feature} className="text-sm text-black/65">✓ {feature}</p>)}</div>
                </article>
              ))}
            </div>

            <p className="mt-7 max-w-3xl rounded-2xl bg-[#f3eee4] p-5 text-sm leading-7 text-black/55">WORKS does not guarantee a minimum number of enquiries, contracts, revenue or filled capacity. Paid plans do not buy ranking, credentials, verification status or favourable reviews.</p>

            <div className="mt-10 flex flex-wrap gap-3">
              <button type="button" onClick={() => setTab(mode ? "business" : "start")} className="rounded-full bg-[#1f1c17] px-6 py-3 text-sm text-white">Return to joining →</button>
              <a href="/works" className="rounded-full border border-black/15 bg-white px-6 py-3 text-sm">Back to WORKS</a>
            </div>
          </section>
        ) : null}

        {ready && tab === "progress" ? (
          <section className="py-10 md:py-14" role="tabpanel">
            <p className="text-xs font-medium uppercase tracking-[0.2em] text-[#16834f]">Your progress</p>
            {created ? (
              <div className="mt-4 rounded-3xl border border-black/10 bg-white p-7 md:p-9">
                <h1 className="max-w-3xl font-serif text-4xl leading-tight md:text-5xl">{created.name} is now connected to your WORKS account</h1>
                <p className="mt-5 max-w-2xl text-sm leading-7 text-black/55">Open Manage my business to choose what customers can see, update capacity and tell WORKS what work you want more of.</p>
                <div className="mt-8 flex flex-wrap gap-3">
                  <a href="/works/provider" className="rounded-full bg-[#1f1c17] px-6 py-3 text-sm text-white">Manage my business →</a>
                  <a href={`/works/providers/${created.slug}`} className="rounded-full border border-black/15 bg-white px-6 py-3 text-sm">View public profile</a>
                  <button type="button" onClick={startAnother} className="rounded-full border border-black/15 bg-white px-6 py-3 text-sm">Add another business</button>
                </div>
              </div>
            ) : null}

            {!created && message ? <div className="mt-4 rounded-3xl bg-[#eef7f1] p-7 text-sm leading-7">{message}</div> : null}

            {claims.length ? (
              <section className="mt-8">
                <h2 className="font-serif text-3xl">Connection requests</h2>
                <div className="mt-5 space-y-3">
                  {claims.map((claim) => (
                    <div key={claim.id} className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-black/10 bg-white p-5">
                      <div><p className="text-sm font-medium">{claim.provider.name}</p><p className="mt-1 text-xs text-black/40">Submitted with {claim.business_email}</p></div>
                      <span className="rounded-full border border-black/10 px-3 py-1.5 text-xs text-black/55">{claim.status.charAt(0) + claim.status.slice(1).toLowerCase()}</span>
                    </div>
                  ))}
                </div>
              </section>
            ) : null}

            {!created && !message && !claims.length ? <div className="mt-4 rounded-3xl border border-black/10 bg-white/70 p-7 text-sm text-black/50">Your completed business profile or connection request will remain available here.</div> : null}

            <div className="mt-8 flex flex-wrap gap-3">
              <button type="button" onClick={() => setTab("business")} className="rounded-full border border-black/15 bg-white px-5 py-2.5 text-sm">Return to business details</button>
              <button type="button" onClick={() => setTab("plans")} className="rounded-full border border-black/15 bg-white px-5 py-2.5 text-sm">Review plans</button>
            </div>
          </section>
        ) : null}
      </div>
    </main>
  );
}
