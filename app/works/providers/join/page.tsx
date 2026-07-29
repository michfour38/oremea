"use client";

import { SignInButton, SignUpButton } from "@clerk/nextjs";

const plans = [
  { name: "Free", price: "R0", detail: "Be discoverable when your real capabilities fit a production brief.", features: ["Basic WORKS profile", "Eligible for genuine matches", "Receive suitable brief invitations"] },
  { name: "Verified", price: "R599 / month", detail: "Keep your provider information current and make it easier for founders to trust the fit.", features: ["Claimed + maintained profile", "Capacity and capability controls", "Direct WORKS enquiries", "Provider response workspace"] },
  { name: "Growth", price: "R1,999 / month", detail: "Tell WORKS what capacity you want filled. We actively market those capabilities and route matching demand by genuine fit.", features: ["Everything in Verified", "Active demand generation", "Demand intelligence as volume grows", "Choose categories and work you want more of"] },
] as const;

export default function WorksProviderJoinPage() {
  return <main className="min-h-screen bg-[#fbfaf7] text-[#1f1c17]">
    <div className="mx-auto w-full max-w-6xl px-5 py-8 md:px-8 md:py-12">
      <header className="flex items-center justify-between border-b border-black/10 pb-5">
        <div><p className="text-xs font-semibold uppercase tracking-[0.32em] text-[#16834f]">WORKS</p><p className="mt-1 text-xs text-black/40">For manufacturers & production providers · by Oremea</p></div>
        <SignInButton mode="modal"><button className="rounded-full border border-black/15 bg-white px-4 py-2 text-sm">Provider sign in</button></SignInButton>
      </header>

      <section className="grid gap-10 py-14 lg:grid-cols-[1.15fr_.85fr] lg:items-center lg:py-20">
        <div><p className="text-xs font-medium uppercase tracking-[0.2em] text-[#16834f]">Matching capacity with opportunity</p><h1 className="mt-4 max-w-4xl font-serif text-5xl leading-[1.05] md:text-6xl">Put the capacity you want filled into the market.</h1><p className="mt-6 max-w-2xl text-base leading-8 text-black/60">WORKS introduces your business to founders whose production requirements fit what you genuinely do. Tell us what you make, what capacity is available, and what kind of work would strengthen your operation.</p><div className="mt-8 flex flex-wrap gap-3"><SignUpButton mode="modal"><button className="rounded-full bg-[#1f1c17] px-6 py-3 text-sm font-medium text-white">Create provider account →</button></SignUpButton><a href="/works/provider" className="rounded-full border border-black/15 bg-white px-6 py-3 text-sm">I already have a profile</a></div></div>
        <div className="rounded-[2rem] border border-black/10 bg-white p-7 shadow-[0_24px_80px_rgba(30,30,20,.06)]"><p className="text-xs uppercase tracking-[0.18em] text-black/40">How it works</p><ol className="mt-5 space-y-5">{[["01","Claim your profile","Confirm your business details, services, markets, MOQ and certifications."],["02","Tell WORKS what you want more of","Share current capacity and the categories or production work you want filled."],["03","WORKS creates and routes demand","We market genuine capability. Matching decides where each founder brief belongs."],["04","Respond to qualified briefs","Accept, ask for more information, or pass when a project sits outside your capability."]].map(([number,title,body])=><li key={number} className="grid grid-cols-[36px_1fr] gap-3 border-t border-black/8 pt-5 first:border-0 first:pt-0"><span className="flex h-8 w-8 items-center justify-center rounded-full bg-[#16834f] text-xs text-white">{number}</span><div><p className="font-medium">{title}</p><p className="mt-1 text-sm leading-6 text-black/50">{body}</p></div></li>)}</ol></div>
      </section>

      <section className="border-t border-black/10 py-14"><div className="max-w-2xl"><p className="text-xs font-medium uppercase tracking-[0.2em] text-[#16834f]">Provider plans</p><h2 className="mt-3 font-serif text-4xl">Start visible. Grow into active demand generation.</h2><p className="mt-4 text-sm leading-7 text-black/55">Opportunity volume follows real founder demand. WORKS markets and matches; plan pricing does not purchase artificial ranking or guarantee a lead count.</p></div><div className="mt-8 grid gap-4 lg:grid-cols-3">{plans.map(plan=><article key={plan.name} className="rounded-3xl border border-black/10 bg-white p-6"><p className="text-xs uppercase tracking-[0.18em] text-black/40">{plan.name}</p><p className="mt-3 font-serif text-3xl">{plan.price}</p><p className="mt-4 min-h-[72px] text-sm leading-6 text-black/55">{plan.detail}</p><div className="mt-5 space-y-2 border-t border-black/8 pt-5">{plan.features.map(feature=><p key={feature} className="text-sm text-black/65">✓ {feature}</p>)}</div></article>)}</div></section>

      <footer className="border-t border-black/10 py-8 text-sm text-black/40">WORKS by Oremea · Matching capacity with opportunity.</footer>
    </div>
  </main>;
}