import { createHash } from "crypto";
import { notFound } from "next/navigation";

import { ProviderResponseView } from "@/components/works/outreach/provider-response-view";
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
  const questions = Array.isArray(snapshot.questions)
    ? snapshot.questions.filter((item): item is string => typeof item === "string" && Boolean(item.trim()))
    : [];
  const product = typeof snapshot.product === "string" ? snapshot.product : "Production brief";
  const category = typeof snapshot.category === "string" ? snapshot.category : null;

  return (
    <ProviderResponseView
      providerName={outreach.provider.name}
      requesterName={outreach.procurement_request.name}
      product={product}
      category={category}
      relevantSteps={relevantSteps}
      questions={questions}
      token={params.token}
      responded={Boolean(outreach.responded_at)}
    />
  );
}
