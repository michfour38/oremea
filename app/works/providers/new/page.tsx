"use client";

import { SignInButton, SignedIn, SignedOut } from "@clerk/nextjs";
import { useEffect, useState } from "react";

import { MemberWorksNav } from "@/components/works/member-works-nav";

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

const DRAFT_KEY = "works-provider-new-draft";

export default function WorksNewProviderPage() {
  const [form, setForm] = useState<FormState>(INITIAL);
  const [draftLoaded, setDraftLoaded] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [created, setCreated] = useState<{ name: string; slug: string } | null>(null);

  useEffect(() => {
    try {
      const saved = window.localStorage.getItem(DRAFT_KEY);
      if (saved) setForm({ ...INITIAL, ...JSON.parse(saved) });
    } catch {
      window.localStorage.removeItem(DRAFT_KEY);
    } finally {
      setDraftLoaded(true);
    }
  }, []);

  useEffect(() => {
    if (!draftLoaded || created) return;
    window.localStorage.setItem(DRAFT_KEY, JSON.stringify(form));
  }, [created, draftLoaded, form]);

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
      if (!response.ok) throw new Error(data?.error ?? "WORKS could not create this provider profile yet.");
      window.localStorage.removeItem(DRAFT_KEY);
      setCreated(data.provider);
    } catch (err) {
      setError(err instanceof Error ? err.message : "WORKS could not create this provider profile yet.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <main className="min-h-screen bg-[#fbfaf7] text-[#1f1c17]">
      <div className="mx-auto w-full max-w-5xl px-5 py-8 md:px-8 md:py-12">
        <MemberWorksNav />

        <SignedOut>
          <section className="py-16">
            <p className="text-xs font-medium uppercase tracking-[0.2em] text-[#16834f]">New to WORKS</p>
            <h1 className="mt-4 max-w-3xl font-serif text-5xl leading-tight">Add your manufacturing or production business</h1>
            <p className="mt-5 max-w-xl text-sm leading-7 text-black/55">Sign in first. The profile belongs to your account from creation, and nothing beyond the business name becomes public until you choose it.</p>
            <SignInButton mode="modal" forceRedirectUrl="/works/providers/new"><button className="mt-7 rounded-full bg-[#1f1c17] px-6 py-3 text-sm text-white">Sign in to continue →</button></SignInButton>
          </section>
        </SignedOut>

        <SignedIn>
          {created ? (
            <section className="py-16">
              <p className="text-xs font-medium uppercase tracking-[0.2em] text-[#16834f]">Profile created</p>
              <h1 className="mt-4 max-w-3xl font-serif text-5xl leading-tight">{created.name} is now connected to your WORKS account</h1>
              <p className="mt-5 max-w-2xl text-sm leading-7 text-black/55">Your operational information stays inside WORKS. Open the provider workspace to choose what customers can see, add capacity, and tell WORKS what work you want more of.</p>
              <div className="mt-8 flex flex-wrap gap-3"><a href="/works/provider" className="rounded-full bg-[#1f1c17] px-6 py-3 text-sm text-white">Open provider workspace →</a><a href={`/works/providers/${created.slug}`} className="rounded-full border border-black/15 bg-white px-6 py-3 text-sm">View public profile</a></div>
            </section>
          ) : (
            <section className="py-12">
              <p className="text-xs font-medium uppercase tracking-[0.2em] text-[#16834f]">New provider</p>
              <h1 className="mt-3 max-w-3xl font-serif text-4xl leading-tight md:text-5xl">Tell WORKS which business you represent</h1>
              <p className="mt-4 max-w-2xl text-sm leading-7 text-black/55">This step creates the account-linked provider record. Contact details, description and location remain private by default until you choose to publish them from your provider workspace.</p>

              <div className="mt-8 grid gap-5 rounded-3xl border border-black/10 bg-white p-6 md:p-8">
                <div className="grid gap-4 md:grid-cols-2">
                  <label className="text-xs text-black/45">Business name *<input value={form.name} onChange={(e)=>setForm(v=>({...v,name:e.target.value}))} placeholder="Business name" className="mt-1 w-full rounded-xl border border-black/10 px-4 py-3 text-base outline-none focus:border-[#16834f]" /></label>
                  <label className="text-xs text-black/45">Legal name (optional)<input value={form.legalName} onChange={(e)=>setForm(v=>({...v,legalName:e.target.value}))} placeholder="Registered company name" className="mt-1 w-full rounded-xl border border-black/10 px-4 py-3 text-base outline-none focus:border-[#16834f]" /></label>
                </div>

                <div className="grid gap-4 md:grid-cols-2">
                  <label className="text-xs text-black/45">Website<input value={form.website} onChange={(e)=>setForm(v=>({...v,website:e.target.value}))} placeholder="https://…" className="mt-1 w-full rounded-xl border border-black/10 px-4 py-3 text-base outline-none focus:border-[#16834f]" /></label>
                  <label className="text-xs text-black/45">Business email<input type="email" value={form.email} onChange={(e)=>setForm(v=>({...v,email:e.target.value}))} placeholder="hello@company.co.za" className="mt-1 w-full rounded-xl border border-black/10 px-4 py-3 text-base outline-none focus:border-[#16834f]" /></label>
                </div>

                <div className="grid gap-4 md:grid-cols-2">
                  <label className="text-xs text-black/45">Phone<input value={form.phone} onChange={(e)=>setForm(v=>({...v,phone:e.target.value}))} placeholder="Business phone" className="mt-1 w-full rounded-xl border border-black/10 px-4 py-3 text-base outline-none focus:border-[#16834f]" /></label>
                  <label className="text-xs text-black/45">Province / region<input value={form.administrativeArea} onChange={(e)=>setForm(v=>({...v,administrativeArea:e.target.value}))} placeholder="Gauteng" className="mt-1 w-full rounded-xl border border-black/10 px-4 py-3 text-base outline-none focus:border-[#16834f]" /></label>
                </div>

                <label className="text-xs text-black/45">City / locality<input value={form.locality} onChange={(e)=>setForm(v=>({...v,locality:e.target.value}))} placeholder="Johannesburg" className="mt-1 w-full rounded-xl border border-black/10 px-4 py-3 text-base outline-none focus:border-[#16834f]" /></label>
                <label className="text-xs text-black/45">Business description<textarea value={form.description} onChange={(e)=>setForm(v=>({...v,description:e.target.value}))} rows={5} placeholder="What do you manufacture, supply or help bring into production?" className="mt-1 w-full resize-none rounded-xl border border-black/10 px-4 py-3 text-sm leading-6 outline-none focus:border-[#16834f]" /></label>

                <div className="grid gap-3 md:grid-cols-2">
                  <label className="flex items-start gap-3 rounded-2xl border border-black/10 p-4"><input type="checkbox" checked={form.servesNationally} onChange={(e)=>setForm(v=>({...v,servesNationally:e.target.checked}))} className="mt-1"/><span><span className="block text-sm font-medium">Serve customers nationally</span><span className="mt-1 block text-xs leading-5 text-black/45">Private matching information until you choose to show location.</span></span></label>
                  <label className="flex items-start gap-3 rounded-2xl border border-black/10 p-4"><input type="checkbox" checked={form.acceptsRemoteClients} onChange={(e)=>setForm(v=>({...v,acceptsRemoteClients:e.target.checked}))} className="mt-1"/><span><span className="block text-sm font-medium">Accept remote clients</span><span className="mt-1 block text-xs leading-5 text-black/45">Used by WORKS when building viable production routes.</span></span></label>
                </div>

                <div className="rounded-2xl bg-[#eef7f1] p-5 text-xs leading-6 text-black/55"><strong className="text-[#1f1c17]">Privacy by default.</strong> Your business name identifies the provider record. Contact details, description, location, capacity, demand targets and internal matching information stay private until their specific visibility settings allow otherwise.</div>

                {error ? <p className="text-sm text-red-700">{error}</p> : null}
                <div className="flex flex-wrap items-center gap-3"><button type="button" onClick={createProvider} disabled={saving || form.name.trim().length < 2} className="rounded-full bg-[#1f1c17] px-6 py-3 text-sm text-white disabled:opacity-40">{saving ? "Creating…" : "Add my business →"}</button><a href="/works/providers/claim" className="text-sm underline underline-offset-4 text-black/55">My business is already on WORKS</a></div>
              </div>
            </section>
          )}
        </SignedIn>
      </div>
    </main>
  );
}
