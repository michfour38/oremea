import { prisma } from "@/lib/prisma";

export type WorksCredentialAuthoritySummary = {
  id: string;
  key: string;
  name: string;
  shortName: string | null;
  authorityType: string;
  website: string | null;
  verificationUrl: string | null;
  verificationMethod: string;
  requiresHolderConsent: boolean;
};

export async function listCredentialAuthoritiesForMarket(
  marketSlug: string
): Promise<WorksCredentialAuthoritySummary[]> {
  const market = await prisma.works_markets.findUnique({
    where: { slug: marketSlug.toLowerCase() },
    select: { id: true, active: true },
  });

  if (!market?.active) return [];

  const links = await prisma.works_credential_authority_markets.findMany({
    where: {
      market_id: market.id,
      active: true,
      authority: { active: true },
    },
    orderBy: {
      authority: { name: "asc" },
    },
    select: {
      authority: {
        select: {
          id: true,
          key: true,
          name: true,
          short_name: true,
          authority_type: true,
          website: true,
          verification_url: true,
          verification_method: true,
          requires_holder_consent: true,
        },
      },
    },
  });

  return links.map(({ authority }) => ({
    id: authority.id,
    key: authority.key,
    name: authority.name,
    shortName: authority.short_name,
    authorityType: authority.authority_type,
    website: authority.website,
    verificationUrl: authority.verification_url,
    verificationMethod: authority.verification_method,
    requiresHolderConsent: authority.requires_holder_consent,
  }));
}
