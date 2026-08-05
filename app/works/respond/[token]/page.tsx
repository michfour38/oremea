import { createHash } from "crypto";
import { notFound } from "next/navigation";

import { ProviderResponseForm } from "@/components/works/outreach/provider-response-form";
import { WorksPageHeader } from "@/components/works/works-brand";
import { prisma } from "@/lib/prisma";

function hashToken(token: string) {
  return createHash("sha256").update(token).digest("hex");
}

export const dynamic = "force-dynamic";

export default async function WorksProviderResponsePage({
  params,
}: {
  params: { token: string };
}) {
  const outreach = await prisma.works_provider_outreach.findUnique({
    where: { response_token_hash: hashToken(params.token) },
    include: {
      provider: { select: { name: true } },
      procurement_request: { select: { name: true } },
    },
  });

  if (!outreach) notFound();

  const snapshot = outreach.brief_snapshot as Record<string, unknown>;
  const relevantSteps = Array.isArray(snapshot.relevantSteps)
    ? snapshot.relevantSteps.filter((item): item is string => typeof item === "string")
    : outreach.relevant_steps;
  const product = typeof snapshot.product === "string" ? snapshot.product : "Production brief";
  const category = typeof snapshot.category === "string" ? snapshot.category : null;

  return (
    <main className="min-h-screen bg-[#f3eee4] px-5 py-10 text-[#1f1c17] md:px-8">
      <div className="mx-auto max-w-3xl">
        <WorksPageHeader context="Provider response" />

        <section className="py-10">
          <p className="text-sm text-black/45">Production enquiry for {outreach.provider.name}</p>
          <h1 className="mt-2 font-serif text-4xl leading-tight md:text-5xl">{product}</h1>
          {category ? <p className="mt-3 text-sm text-black/50">{category}</p> : null}

          <div className="mt-8 rounded-3xl border border-black/10 bg-white/70 p-6">
            <p className="text-xs uppercase tracking-[0.16em] text-black/40">Your part of the route</p>
            <div className="mt-4 flex flex-wrap gap-2">
              {relevantSteps.map((step) => (
                <span key={step} className="rounded-full border border-black/10 bg-white px-4 py-2 text-sm">{step}</span>
              ))}
            </div>
            <p className="mt-5 text-sm leading-6 text-black/55">
              This enquiry was sent by WORKS on behalf of {outreach.procurement_request.name}. Your response applies to this production brief only.
            </p>
          </div>

          {outreach.responded_at ? (
            <div className="mt-8 rounded-3xl border border-black/10 bg-white p-6 text-sm leading-6">
              A response has already been recorded for this brief. Submitting again will update the same response.
            </div>
          ) : null}

          <ProviderResponseForm token={params.token} />
        </section>
      </div>
    </main>
  );
}
