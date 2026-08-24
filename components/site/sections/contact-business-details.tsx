import { OREMEA_OPERATOR } from "@/src/lib/legal/legal-links";

export function ContactBusinessDetails() {
  return (
    <section>
      <div className="mx-auto max-w-5xl px-5 py-12">
        <div className="grid gap-8 md:grid-cols-2">
          <div className="rounded-2xl border border-white/10 bg-white/[0.02] p-6">
            <p className="text-sm uppercase tracking-[0.18em] text-zinc-500">Business Information</p>

            <div className="mt-8 space-y-6 text-base leading-8 text-zinc-400">
              <div>
                <p className="text-sm uppercase tracking-[0.18em] text-zinc-500">Operator</p>
                <p className="mt-2 text-zinc-200">{OREMEA_OPERATOR.name}, {OREMEA_OPERATOR.legalForm} trading as {OREMEA_OPERATOR.tradingName}</p>
              </div>
              <div>
                <p className="text-sm uppercase tracking-[0.18em] text-zinc-500">Physical & legal-service address</p>
                <p className="mt-2 text-zinc-200">{OREMEA_OPERATOR.serviceAddress}</p>
              </div>
              <div>
                <p className="text-sm uppercase tracking-[0.18em] text-zinc-500">Contact</p>
                <p className="mt-2 text-zinc-200">{OREMEA_OPERATOR.email}</p>
                <p className="text-zinc-200">{OREMEA_OPERATOR.telephone}</p>
              </div>
            </div>
          </div>

          <div className="rounded-2xl border border-[#b79a63]/15 bg-[#b79a63]/[0.03] p-6">
            <p className="text-sm uppercase tracking-[0.18em] text-[#b79a63]">Platform Positioning</p>
            <div className="mt-8 space-y-6 text-base leading-8 text-zinc-400">
              <p>Oremea provides structured reflective products and WORKS, a South African business-discovery, production-routing and provider-introduction service.</p>
              <p>The platform is designed around self-led participation, clear evidence boundaries and intentional communication.</p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
