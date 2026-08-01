"use client";

import { SignInButton, SignedIn, SignedOut } from "@clerk/nextjs";

import { WorksPageHeader } from "@/components/works/works-brand";

export default function WorksProviderJoinPage() {
  return (
    <main className="min-h-screen bg-[#fbfaf7] text-[#1f1c17]">
      <div className="mx-auto w-full max-w-5xl px-5 py-8 md:px-8 md:py-12">
        <WorksPageHeader
          context="For manufacturers & production providers"
          action={
            <>
              <SignedOut>
                <SignInButton mode="modal" forceRedirectUrl="/works/provider">
                  <button className="rounded-full border border-black/15 bg-white px-4 py-2 text-sm">
                    Provider sign in
                  </button>
                </SignInButton>
              </SignedOut>
              <SignedIn>
                <a href="/works/provider" className="rounded-full border border-black/15 bg-white px-4 py-2 text-sm">
                  Provider workspace →
                </a>
              </SignedIn>
            </>
          }
        />

        <section className="py-14 md:py-20">
          <p className="text-xs font-medium uppercase tracking-[0.2em] text-[#16834f]">
            Matching capacity with opportunity
          </p>
          <h1 className="mt-4 max-w-4xl font-serif text-5xl leading-[1.05] md:text-6xl">
            Bring the work you want more of into WORKS
          </h1>
          <p className="mt-6 max-w-2xl text-base leading-8 text-black/60">
            WORKS matches real production requirements with real provider capability. Start by telling us whether your business already has a WORKS profile.
          </p>

          <div className="mt-10 grid gap-4 md:grid-cols-2">
            <a href="/works/providers/new" className="rounded-3xl bg-[#1f1c17] p-7 text-white">
              <span className="block text-xs uppercase tracking-[0.16em] text-white/55">New to WORKS</span>
              <span className="mt-3 block font-serif text-3xl">Add my business</span>
              <span className="mt-3 block max-w-md text-sm leading-6 text-white/65">
                Create a provider record connected to your account. Operational information stays private until you choose what becomes public.
              </span>
              <span className="mt-6 block text-sm">Continue →</span>
            </a>

            <a href="/works/providers/claim" className="rounded-3xl border border-black/12 bg-white p-7">
              <span className="block text-xs uppercase tracking-[0.16em] text-black/40">Already listed</span>
              <span className="mt-3 block font-serif text-3xl">Find my business</span>
              <span className="mt-3 block max-w-md text-sm leading-6 text-black/50">
                Connect your account to an existing WORKS profile. Editing access begins only after the business relationship is verified.
              </span>
              <span className="mt-6 block text-sm">Continue →</span>
            </a>
          </div>

          <div className="mt-8 flex flex-wrap gap-x-6 gap-y-3 border-t border-black/10 pt-6 text-sm text-black/50">
            <a href="/works/providers/plans" className="underline underline-offset-4">See provider plans</a>
            <a href="/works/za" className="underline underline-offset-4">Search WORKS as a customer</a>
          </div>
        </section>
      </div>
    </main>
  );
}
