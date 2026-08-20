"use client";

import { SignInButton, SignUpButton, SignedIn, SignedOut } from "@clerk/nextjs";
import { useEffect, useMemo, useRef, useState } from "react";

import { MemberWorksNav } from "@/components/works/member-works-nav";
import { WorksAccountButton } from "@/components/works/works-account-button";

type Tab = "start" | "business" | "progress";
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
const JOURNEY_KEY = "works-provider-onboarding-v2";

function isTab(value: string | null): value is Tab {
  return value === "start" || value === "business" || value === "progress";
}

function isMode(value: string | null): value is Exclude<Mode, null> {
  return value === "add" || value === "claim";
}

export function WorksProviderOnboardingV2() {
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
  const claimPanelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    try {
      const params = new URLSearchParams(window.location.search);
      if (params.get("tab") === "plans") {
        window.location.replace("/works/providers/plans");
        return;
      }

      const storedJourney = window.localStorage.getItem(JOURNEY_KEY);
      const journey = storedJourney ? (JSON.parse(storedJourney) as SavedJourney) : {};
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
    setSelected(null);
    setMessage("");
    setError("");
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
      if (response.status === 409 && data?.existingProvider?.id) {
        const existing = data.existingProvider as {
          id: string;
          name: string;
          slug: string;
          alreadyClaimed?: boolean;
          alreadyConnected?: boolean;
        };

        if (existing.alreadyConnected) {
          setCreated({ name: existing.name, slug: existing.slug });
          setMessage(`${existing.name} is already connected to your WORKS account.`);
          setTab("progress");
          return;
        }

        setQuery(existing.name);
        setSelected({
          id: existing.id,
          name: existing.name,
          slug: existing.slug,
          website: null,
          alreadyClaimed: Boolean(existing.alreadyClaimed),
        });
        setBusinessEmail(form.email.trim());
        setMode("claim");
        setMessage(existing.alreadyClaimed
          ? `${existing.name} is already managed on WORKS.`
          : `We found ${existing.name}. Confirm your relationship with the business below.`);
        setError("");
        return;
      }
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

  useEffect(() => {
    if (mode !== "claim" || !selected) return;
    const frame = window.requestAnimationFrame(() => {
      claimPanelRef.current?.scrollIntoView({ behavior: "smooth", block: "center" });
    });
    return () => window.cancelAnimationFrame(frame);
  }, [mode, selected]);

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
        body: JSON.stringify({
          providerId: selected.id,
          businessEmail,
          note,
          marketSlug: "za",
          profileDraft: form,
        }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data?.error ?? "WORKS could not submit this connection request yet.");
      setMessage(data.message ?? "Your connection request has been submitted.");
      setSelected(null);
      setBusinessEmail("");
      setNote("");
      if (data.accessGranted && data.provider) {
        setCreated({ name: data.provider.name, slug: data.provider.slug });
        window.localStorage.removeItem(FORM_KEY);
        setTab("progress");
        return;
      }
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

  return (
    <main className="min-h-screen bg-[#fbfaf7] text-[#1f1c17]">
      <div className="mx-auto w-full max-w-6xl px-5 py-8 md:px-8 md:py-12">
        <MemberWorksNav
          href="/works/za"
          action={
            <>
              <SignedOut>
                <SignInButton mode="modal" forceRedirectUrl={returnUrl}>
                  <button className="rounded-full border border-black/15 bg-white px-4 py-2 text-sm">Sign in</button>
                </SignInButton>
              </SignedOut>
              <SignedIn>
                <a href="/works/provider" className="rounded-full border border-black/15 bg-white px-4 py-2 text-sm">Manage my business →</a>
                <WorksAccountButton afterSignOutUrl="/works/za" />
              </SignedIn>
            </>
          }
        />

        <nav className="mt-7 flex flex-wrap items-center gap-2" aria-label="Business joining progress">
          {(["start", "business", "progress"] as const).map((item) => (
            <button
              key={item}
              type="button"
              disabled={item === "progress" && !progressAvailable}
              onClick={() => setTab(item)}
              className={`rounded-full border px-4 py-2 text-sm ${tab === item ? "border-[#1f1c17] bg-[#1f1c17] text-white" : "border-black/10 bg-white text-black/55"} disabled:cursor-not-allowed disabled:opacity-30`}
            >
              {item === "start" ? "Start" : item === "business" ? "Business" : "Progress"}
            </button>
          ))}
          <a href="/works/providers/plans" className="ml-auto text-sm font-medium underline underline-offset-4">Compare plans →</a>
        </nav>

        {!ready ? <p className="py-16 text-sm text-black/40">Opening your WORKS journey…</p> : null}

        {ready && tab === "start" ? (
          <section className="py-12 md:py-16">
            <p className="text-xs font-medium uppercase tracking-[0.2em] text-[#16834f]">For providers</p>
            <h1 className="mt-4 max-w-4xl font-serif text-5xl leading-[1.05] md:text-6xl">Build the business profile WORKS can match with confidence</h1>
            <p className="mt-6 max-w-2xl text-base leading-8 text-black/60">Add a business or connect an existing WORKS listing. Then describe its actual offerings, capacity and production range. Provider-supplied information can enter matching as a possible fit while WORKS keeps its evidence boundary visible.</p>

            <div className="mt-10 grid gap-4 md:grid-cols-2">
              <button type="button" onClick={() => chooseMode("add")} className="rounded-3xl bg-[#1f1c17] p-7 text-left text-white">
                <span className="block text-xs uppercase tracking-[0.16em] text-white/55">Not listed yet</span>
                <span className="mt-3 block font-serif text-3xl">Add my business</span>
                <span className="mt-3 block max-w-md text-sm leading-6 text-white/65">Create the business record first. You choose later which profile fields become public.</span>
                <span className="mt-6 block text-sm">Continue →</span>
              </button>
              <button type="button" onClick={() => chooseMode("claim")} className="rounded-3xl border border-black/12 bg-white p-7 text-left">
                <span className="block text-xs uppercase tracking-[0.16em] text-black/40">Already on WORKS</span>
                <span className="mt-3 block font-serif text-3xl">Connect my business</span>
                <span className="mt-3 block max-w-md text-sm leading-6 text-black/50">Find the existing listing and request management access after WORKS checks the relationship.</span>
                <span className="mt-6 block text-sm">Continue →</span>
              </button>
            </div>

            <div className="mt-8 flex flex-wrap gap-x-6 gap-y-3 border-t border-black/10 pt-6 text-sm text-black/50">
              <a href="/works/providers/plans" className="underline underline-offset-4">Compare Free, Active and Growth</a>
              <a href="/works/za" className="underline underline-offset-4">I need something made</a>
            </div>
          </section>
        ) : null}

        {ready && tab === "business" ? (
          <section className="py-10 md:py-14">
            <div className="flex flex-wrap items-end justify-between gap-5 border-b border-black/10 pb-6">
              <div>
                <p className="text-xs font-medium uppercase tracking-[0.18em] text-[#16834f]">Business connection</p>
                <h1 className="mt-3 font-serif text-4xl md:text-5xl">Add your business or connect the listing already here</h1>
              </div>
              <div className="flex flex-wrap gap-2">
                <button type="button" onClick={() => chooseMode("add")} className={`rounded-full border px-4 py-2 text-sm ${mode === "add" ? "border-[#1f1c17] bg-[#1f1c17] text-white" : "border-black/15 bg-white"}`}>Add business</button>
                <button type="button" onClick={() => chooseMode("claim")} className={`rounded-full border px-4 py-2 text-sm ${mode === "claim" ? "border-[#1f1c17] bg-[#1f1c17] text-white" : "border-black/15 bg-white"}`}>Connect listing</button>
              </div>
            </div>

            <SignedOut>
              {mode ? (
                <div className="mt-8 rounded-3xl border border-black/10 bg-white p-7 md:p-8">
                  <p className="text-xs font-medium uppercase tracking-[0.18em] text-[#16834f]">Your place is saved</p>
                  <h2 className="mt-3 font-serif text-3xl">Create your provider account to continue</h2>
                  <p className="mt-4 max-w-xl text-sm leading-7 text-black/55">WORKS returns here after signup. Anything already entered in the business form remains on this device.</p>
                  <div className="mt-6 flex flex-wrap items-center gap-3">
                    <SignUpButton mode="modal" forceRedirectUrl={returnUrl}>
                      <button className="rounded-full bg-[#1f1c17] px-6 py-3 text-sm text-white">Create provider account →</button>
                    </SignUpButton>
                    <SignInButton mode="modal" forceRedirectUrl={returnUrl}>
                      <button className="rounded-full border border-black/15 bg-white px-6 py-3 text-sm">I already have an account</button>
                    </SignInButton>
                  </div>
                </div>
              ) : null}
            </SignedOut>

            <SignedIn>
              {mode === "add" ? (
                <div className="mt-8 grid gap-5 rounded-3xl border border-black/10 bg-white p-6 md:p-8">
                  <div>
                    <h2 className="font-serif text-3xl">Create the business record</h2>
                    <p className="mt-3 max-w-2xl text-sm leading-7 text-black/55">These fields are source information supplied by the business. Except for the business name, they stay private until visibility is explicitly enabled from the provider workspace.</p>
                  </div>

                  <div className="grid gap-4 md:grid-cols-2">
                    <label className="text-xs text-black/45">Business name *<input value={form.name} onChange={(event) => setForm((value) => ({ ...value, name: event.target.value }))} placeholder="Business name" className="mt-1 w-full rounded-xl border border-black/10 px-4 py-3 text-base outline-none focus:border-[#16834f]" /></label>
                    <label className="text-xs text-black/45">Legal name<input value={form.legalName} onChange={(event) => setForm((value) => ({ ...value, legalName: event.target.value }))} placeholder="Registered company name (optional)" className="mt-1 w-full rounded-xl border border-black/10 px-4 py-3 text-base outline-none focus:border-[#16834f]" /></label>
                    <label className="text-xs text-black/45">Website<input value={form.website} onChange={(event) => setForm((value) => ({ ...value, website: event.target.value }))} placeholder="https://…" className="mt-1 w-full rounded-xl border border-black/10 px-4 py-3 text-base outline-none focus:border-[#16834f]" /></label>
                    <label className="text-xs text-black/45">Business email<input type="email" value={form.email} onChange={(event) => setForm((value) => ({ ...value, email: event.target.value }))} placeholder="hello@company.co.za" className="mt-1 w-full rounded-xl border border-black/10 px-4 py-3 text-base outline-none focus:border-[#16834f]" /></label>
                    <label className="text-xs text-black/45">Phone<input value={form.phone} onChange={(event) => setForm((value) => ({ ...value, phone: event.target.value }))} placeholder="Business phone" className="mt-1 w-full rounded-xl border border-black/10 px-4 py-3 text-base outline-none focus:border-[#16834f]" /></label>
                    <label className="text-xs text-black/45">Province / region<input value={form.administrativeArea} onChange={(event) => setForm((value) => ({ ...value, administrativeArea: event.target.value }))} placeholder="Gauteng" className="mt-1 w-full rounded-xl border border-black/10 px-4 py-3 text-base outline-none focus:border-[#16834f]" /></label>
                    <label className="text-xs text-black/45 md:col-span-2">City / locality<input value={form.locality} onChange={(event) => setForm((value) => ({ ...value, locality: event.target.value }))} placeholder="Johannesburg" className="mt-1 w-full rounded-xl border border-black/10 px-4 py-3 text-base outline-none focus:border-[#16834f]" /></label>
                  </div>

                  <label className="text-xs text-black/45">Business description<textarea value={form.description} onChange={(event) => setForm((value) => ({ ...value, description: event.target.value }))} rows={5} maxLength={2000} placeholder="What does the business make, supply or provide?" className="mt-1 w-full resize-none rounded-xl border border-black/10 px-4 py-3 text-sm leading-6 outline-none focus:border-[#16834f]" /></label>

                  <div className="grid gap-3 md:grid-cols-2">
                    <label className="flex items-start gap-3 rounded-2xl border border-black/10 p-4"><input type="checkbox" checked={form.servesNationally} onChange={(event) => setForm((value) => ({ ...value, servesNationally: event.target.checked }))} className="mt-1"/><span><span className="block text-sm font-medium">Serve customers nationally</span><span className="mt-1 block text-xs leading-5 text-black/45">Matching signal; private by default.</span></span></label>
                    <label className="flex items-start gap-3 rounded-2xl border border-black/10 p-4"><input type="checkbox" checked={form.acceptsRemoteClients} onChange={(event) => setForm((value) => ({ ...value, acceptsRemoteClients: event.target.checked }))} className="mt-1"/><span><span className="block text-sm font-medium">Accept remote clients</span><span className="mt-1 block text-xs leading-5 text-black/45">Matching signal; private by default.</span></span></label>
                  </div>

                  {error ? <p className="text-sm text-red-700">{error}</p> : null}
                  <div className="flex flex-wrap items-center gap-3">
                    <button type="button" onClick={() => void createProvider()} disabled={saving || form.name.trim().length < 2} className="rounded-full bg-[#1f1c17] px-6 py-3 text-sm text-white disabled:opacity-40">{saving ? "Adding…" : "Add my business →"}</button>
                    <button type="button" onClick={() => chooseMode("claim")} className="text-sm text-black/55 underline underline-offset-4">My business is already listed</button>
                  </div>
                </div>
              ) : null}

              {mode === "claim" ? (
                <div className="mt-8 space-y-6">
                  <div className="rounded-3xl border border-black/10 bg-white p-6 md:p-8">
                    <h2 className="font-serif text-3xl">Find your business</h2>
                    <p className="mt-3 max-w-2xl text-sm leading-7 text-black/55">Search the existing WORKS records by business name. A listing cannot be edited until the business relationship is checked.</p>
                    <div className="mt-6 flex max-w-2xl gap-3">
                      <input value={query} onChange={(event) => setQuery(event.target.value)} onKeyDown={(event) => { if (event.key === "Enter") void search(); }} placeholder="Business name" className="min-w-0 flex-1 rounded-xl border border-black/12 bg-white px-4 py-3 outline-none focus:border-[#16834f]" />
                      <button type="button" onClick={() => void search()} disabled={loading || query.trim().length < 2} className="rounded-full bg-[#1f1c17] px-5 py-3 text-sm text-white disabled:opacity-40">{loading ? "Searching…" : "Search"}</button>
                    </div>
                    {results.length ? <div className="mt-6 space-y-3">{results.map((provider) => <button key={provider.id} type="button" onClick={() => { setSelected(provider); setError(""); setMessage(""); }} className="flex w-full items-center justify-between gap-4 rounded-2xl border border-black/10 bg-white p-5 text-left"><div><p className="font-medium">{provider.name}</p>{provider.website ? <p className="mt-1 text-xs text-black/40">{provider.website}</p> : null}</div><span className="text-sm text-black/45">{provider.alreadyClaimed ? "Request access →" : "Connect →"}</span></button>)}</div> : query.trim().length >= 2 && !loading ? <div className="mt-6 rounded-2xl bg-[#fbfaf7] p-5 text-sm">No matching WORKS profile found. <button type="button" onClick={() => chooseMode("add")} className="underline underline-offset-4">Add it instead →</button></div> : null}
                  </div>

                  {selected ? (
                    <div ref={claimPanelRef} className="rounded-3xl border border-black/10 bg-white p-6 md:p-8">
                      <p className="text-xs font-medium uppercase tracking-[0.18em] text-[#16834f]">Connect to {selected.name}</p>
                      <h2 className="mt-3 font-serif text-3xl">Confirm the business relationship</h2>
                      <p className="mt-3 max-w-2xl text-sm leading-7 text-black/55">
                        {selected.alreadyClaimed
                          ? "This profile already has a manager. A signed-in, verified email on the business's own domain can still request owner access without replacing the existing manager."
                          : "Use an email on the business's own domain. The email and verification note are backend verification evidence; they are never public profile fields."}
                      </p>
                      <div className="mt-6 grid gap-4">
                        <label className="text-xs text-black/45">Business email<input type="email" value={businessEmail} onChange={(event) => setBusinessEmail(event.target.value)} placeholder="you@company.co.za" className="mt-1 w-full rounded-xl border border-black/10 px-4 py-3" /></label>
                        <label className="text-xs text-black/45">Role / verification note<textarea value={note} onChange={(event) => setNote(event.target.value)} rows={3} maxLength={1000} placeholder="Owner, operations manager, company director…" className="mt-1 w-full resize-none rounded-xl border border-black/10 px-4 py-3 text-sm leading-6" /></label>
                      </div>
                      <div className="mt-6 flex flex-wrap gap-3">
                        <button type="button" onClick={() => void submitClaim()} disabled={sending || !businessEmail.trim()} className="rounded-full bg-[#1f1c17] px-6 py-3 text-sm text-white disabled:opacity-40">{sending ? "Submitting…" : "Submit connection request →"}</button>
                        <button type="button" onClick={() => setSelected(null)} className="rounded-full border border-black/15 bg-white px-5 py-3 text-sm">Cancel</button>
                      </div>
                    </div>
                  ) : null}

                  {claims.length ? <div><p className="text-xs font-medium uppercase tracking-[0.18em] text-black/40">Connection requests</p><div className="mt-4 space-y-3">{claims.map((claim) => <div key={claim.id} className="flex flex-wrap items-center justify-between gap-3 rounded-2xl bg-white/70 p-4"><div><p className="text-sm font-medium">{claim.provider.name}</p><p className="mt-1 text-xs text-black/40">Submitted with {claim.business_email}</p></div><span className="rounded-full border border-black/10 px-3 py-1.5 text-xs text-black/55">{claim.status.charAt(0) + claim.status.slice(1).toLowerCase()}</span></div>)}</div></div> : null}
                  {error ? <p className="text-sm text-red-700">{error}</p> : null}
                </div>
              ) : null}
            </SignedIn>
          </section>
        ) : null}

        {ready && tab === "progress" ? (
          <section className="py-10 md:py-14">
            <p className="text-xs font-medium uppercase tracking-[0.2em] text-[#16834f]">Your progress</p>
            {created ? <div className="mt-4 rounded-3xl border border-black/10 bg-white p-7 md:p-9"><h1 className="max-w-3xl font-serif text-4xl leading-tight md:text-5xl">{created.name} is connected to your WORKS account</h1><p className="mt-5 max-w-2xl text-sm leading-7 text-black/55">Add the business&apos;s first offering so WORKS knows which customer briefs it can genuinely consider.</p><div className="mt-8 flex flex-wrap gap-3"><a href="/works/provider/capabilities" className="rounded-full bg-[#1f1c17] px-6 py-3 text-sm text-white">Add capabilities →</a><a href="/works/provider" className="rounded-full border border-black/15 bg-white px-6 py-3 text-sm">Manage profile</a><a href={`/works/providers/${created.slug}`} className="rounded-full border border-black/15 bg-white px-6 py-3 text-sm">View public profile</a><a href="/works/providers/plans" className="rounded-full border border-black/15 bg-white px-6 py-3 text-sm">Compare plans</a><button type="button" onClick={startAnother} className="rounded-full border border-black/15 bg-white px-6 py-3 text-sm">Add another business</button></div></div> : null}
            {!created && message ? <div className="mt-4 rounded-3xl bg-[#eef7f1] p-7 text-sm leading-7">{message}</div> : null}
            {!created && !message && claims.length ? <div className="mt-5 space-y-3">{claims.map((claim) => <div key={claim.id} className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-black/10 bg-white p-5"><p className="text-sm font-medium">{claim.provider.name}</p><span className="rounded-full border border-black/10 px-3 py-1.5 text-xs text-black/55">{claim.status.charAt(0) + claim.status.slice(1).toLowerCase()}</span></div>)}</div> : null}
            {!created && !message && !claims.length ? <div className="mt-4 rounded-3xl border border-black/10 bg-white/70 p-7 text-sm text-black/50">Completed business records and connection requests will remain available here.</div> : null}
          </section>
        ) : null}
      </div>
    </main>
  );
}
