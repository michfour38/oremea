"use client";

import { SignInButton, SignedIn, SignedOut, UserButton } from "@clerk/nextjs";
import { useEffect, useState } from "react";

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

export default function WorksProviderClaimPage() {
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

  async function load(search = "") {
    try {
      setLoading(true);
      const response = await fetch(`/api/works/provider-claims?q=${encodeURIComponent(search)}`);
      if (response.status === 401) return;
      const data = await response.json();
      if (!response.ok) throw new Error(data?.error ?? "WORKS could not search provider profiles.");
      setResults(data.providers ?? []);
      setClaims(data.claims ?? []);
    } catch (err) {
      setError(err instanceof Error ? err.message : "WORKS could not search provider profiles.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { load(); }, []);

  async function search() {
    setSelected(null);
    setMessage("");
    setError("");
    await load(query.trim());
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
      if (!response.ok) throw new Error(data?.error ?? "WORKS could not submit this claim yet.");
      setMessage(data.message);
      setSelected(null);
      setBusinessEmail("");
      setNote("");
      await load(query.trim());
    } catch (err) {
      setError(err instanceof Error ? err.message : "WORKS could not submit this claim yet.");
    } finally {
      setSending(false);
    }
  }

  return (
    <main className="min-h-screen bg-[#fbfaf7] text-[#1f1c17]">
      <div className="mx-auto w-full max-w-5xl px-5 py-8 md:px-8 md:py-12">
        <header className="flex items-center justify-between border-b border-black/10 pb-5">
          <div><a href="/works/za" className="text-xs font-semibold uppercase tracking-[0.32em] text-[#16834f]">WORKS</a><p className="mt-1 text-xs text-black/40">Connect an existing business · by Oremea</p></div>
          <SignedIn><UserButton afterSignOutUrl="/works/providers/join" /></SignedIn>
        </header>

        <SignedOut>
          <section className="py-16">
            <p className="text-xs font-medium uppercase tracking-[0.2em] text-[#16834f]">Provider access</p>
            <h1 className="mt-4 max-w-3xl font-serif text-5xl leading-tight">Connect your account to the WORKS profile for your business.</h1>
            <p className="mt-5 max-w-xl text-sm leading-7 text-black/55">Sign in first. WORKS verifies the connection before any editing access is granted.</p>
            <SignInButton mode="modal"><button className="mt-7 rounded-full bg-[#1f1c17] px-6 py-3 text-sm text-white">Sign in to continue →</button></SignInButton>
          </section>
        </SignedOut>

        <SignedIn>
          <section className="py-12">
            <p className="text-xs font-medium uppercase tracking-[0.2em] text-[#16834f]">Find your business</p>
            <h1 className="mt-3 max-w-3xl font-serif text-4xl leading-tight md:text-5xl">Already listed on WORKS? Connect it here.</h1>
            <p className="mt-4 max-w-2xl text-sm leading-7 text-black/55">Search by business name. The request stays pending until the relationship is verified. Submitting a request never grants profile access by itself.</p>

            <div className="mt-7 flex max-w-2xl gap-3">
              <input value={query} onChange={(event) => setQuery(event.target.value)} onKeyDown={(event) => { if (event.key === "Enter") search(); }} placeholder="Business name" className="min-w-0 flex-1 rounded-xl border border-black/12 bg-white px-4 py-3 outline-none focus:border-[#16834f]" />
              <button type="button" onClick={search} disabled={loading || query.trim().length < 2} className="rounded-full bg-[#1f1c17] px-5 py-3 text-sm text-white disabled:opacity-40">{loading ? "Searching…" : "Search"}</button>
            </div>

            {results.length ? <div className="mt-6 space-y-3">{results.map((provider) => <button key={provider.id} type="button" disabled={provider.alreadyClaimed} onClick={() => { setSelected(provider); setMessage(""); setError(""); }} className="flex w-full items-center justify-between gap-4 rounded-2xl border border-black/10 bg-white p-5 text-left disabled:opacity-45"><div><p className="font-medium">{provider.name}</p>{provider.website ? <p className="mt-1 text-xs text-black/40">{provider.website}</p> : null}</div><span className="text-sm text-black/45">{provider.alreadyClaimed ? "Already managed" : "Connect →"}</span></button>)}</div> : query.trim().length >= 2 && !loading ? <div className="mt-6 rounded-2xl border border-black/10 bg-white/65 p-5"><p className="text-sm">No matching WORKS profile found.</p><p className="mt-2 text-xs leading-5 text-black/45">New manufacturer or production provider? Add your business from the join page.</p><a href="/works/providers/join" className="mt-3 inline-block text-sm underline underline-offset-4">Add a new provider profile →</a></div> : null}

            {selected ? <section className="mt-8 rounded-3xl border border-black/10 bg-white p-6 md:p-7"><p className="text-xs font-medium uppercase tracking-[0.18em] text-[#16834f]">Connect to {selected.name}</p><h2 className="mt-3 font-serif text-3xl">Confirm your connection to this business.</h2><p className="mt-3 max-w-2xl text-sm leading-6 text-black/50">Use an email address on the business's own domain. Personal email services such as Gmail cannot be used to establish ownership. Where WORKS has the company website, the email domain must match it.</p><div className="mt-6 grid gap-4"><label className="text-xs text-black/45">Business email<input type="email" value={businessEmail} onChange={(event) => setBusinessEmail(event.target.value)} placeholder="you@company.co.za" className="mt-1 w-full rounded-xl border border-black/10 bg-white px-4 py-3 text-base text-[#1f1c17] outline-none focus:border-[#16834f]" /></label><label className="text-xs text-black/45">Your role or anything that helps WORKS verify the connection<textarea value={note} onChange={(event) => setNote(event.target.value)} rows={3} placeholder="Owner, operations manager, company director…" className="mt-1 w-full resize-none rounded-xl border border-black/10 bg-white px-4 py-3 text-sm leading-6 outline-none focus:border-[#16834f]" /></label></div><p className="mt-4 text-xs leading-5 text-black/40">The email and verification note stay inside WORKS. A pending request has zero editing authority.</p><div className="mt-6 flex flex-wrap gap-3"><button type="button" onClick={submitClaim} disabled={sending || !businessEmail.trim()} className="rounded-full bg-[#1f1c17] px-6 py-3 text-sm text-white disabled:opacity-40">{sending ? "Submitting…" : "Submit connection request →"}</button><button type="button" onClick={() => setSelected(null)} className="rounded-full border border-black/15 bg-white px-5 py-3 text-sm">Cancel</button></div></section> : null}

            {claims.length ? <section className="mt-10 border-t border-black/10 pt-8"><p className="text-xs font-medium uppercase tracking-[0.18em] text-black/40">Your connection requests</p><div className="mt-4 space-y-3">{claims.map((claim) => <div key={claim.id} className="flex flex-wrap items-center justify-between gap-3 rounded-2xl bg-white/70 p-4"><div><p className="text-sm font-medium">{claim.provider.name}</p><p className="mt-1 text-xs text-black/40">Submitted with {claim.business_email}</p></div><span className="rounded-full border border-black/10 px-3 py-1.5 text-xs text-black/55">{claim.status.charAt(0) + claim.status.slice(1).toLowerCase()}</span></div>)}</div></section> : null}

            {message ? <p className="mt-6 rounded-2xl bg-[#eef7f1] p-4 text-sm leading-6">{message}</p> : null}
            {error ? <p className="mt-6 text-sm text-red-700">{error}</p> : null}
          </section>
        </SignedIn>
      </div>
    </main>
  );
}
