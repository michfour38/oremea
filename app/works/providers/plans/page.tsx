import { WorksPageHeader } from "@/components/works/works-brand";

const plans = [
  {
    name: "Free",
    price: "R0",
    detail: "Be discoverable when your genuine capabilities fit a production brief.",
    features: ["Basic WORKS profile", "Eligible for genuine matches", "Receive suitable brief invitations", "Public customer reviews"],
  },
  {
    name: "Verified",
    price: "R599 / month",
    detail: "Keep provider information current and make the fit easier for founders to trust.",
    features: ["Claimed + maintained profile", "Capacity and capability controls", "Direct WORKS enquiries", "Provider response workspace", "Public customer reviews"],
  },
  {
    name: "Growth",
    price: "R1,999 / month",
    detail: "Tell WORKS what capacity you want filled. WORKS actively markets those capabilities and routes matching demand by genuine fit.",
    features: ["Everything in Verified", "Active demand generation", "Demand intelligence as volume grows", "Choose categories and work you want more of", "Public customer reviews"],
  },
] as const;

export default function WorksProviderPlansPage() {
  return (
    <main className="min-h-screen bg-[#fbfaf7] text-[#1f1c17]">
      <div className="mx-auto w-full max-w-6xl px-5 py-8 md:px-8 md:py-12">
        <WorksPageHeader context="Provider plans" href="/works/providers/join" />

        <section className="py-14 md:py-20">
          <p className="text-xs font-medium uppercase tracking-[0.2em] text-[#16834f]">Provider plans</p>
          <h1 className="mt-3 max-w-3xl font-serif text-4xl md:text-5xl">Choose how actively WORKS represents your available capacity.</h1>
          <p className="mt-5 max-w-2xl text-sm leading-7 text-black/55">
            Opportunity follows real founder demand and genuine fit. A paid plan never purchases artificial ranking or a guaranteed lead count.
          </p>

          <div className="mt-10 grid gap-4 lg:grid-cols-3">
            {plans.map((plan) => (
              <article key={plan.name} className="rounded-3xl border border-black/10 bg-white p-6">
                <p className="text-xs uppercase tracking-[0.18em] text-black/40">{plan.name}</p>
                <p className="mt-3 font-serif text-3xl">{plan.price}</p>
                <p className="mt-4 text-sm leading-6 text-black/55">{plan.detail}</p>
                <div className="mt-6 space-y-2 border-t border-black/8 pt-5">
                  {plan.features.map((feature) => <p key={feature} className="text-sm text-black/65">✓ {feature}</p>)}
                </div>
              </article>
            ))}
          </div>

          <div className="mt-10 flex flex-wrap gap-3">
            <a href="/works/providers/join" className="rounded-full bg-[#1f1c17] px-6 py-3 text-sm text-white">Add or connect my business →</a>
            <a href="/works/za" className="rounded-full border border-black/15 bg-white px-6 py-3 text-sm">Back to WORKS</a>
          </div>
        </section>
      </div>
    </main>
  );
}
