import "server-only";

import { prisma } from "@/lib/prisma";
import {
  partnerMembershipAccessEnabled,
  type PartnerGateProduct,
} from "./partner-membership-contract";
import {
  getPublishedPartnerExperience,
  type PartnerExperience,
} from "./partner-experiences";

/**
 * Branding is selected from an actual, unexpired, verified partner membership.
 * Request query strings and a marketing landing page never grant an identity.
 */
export async function getActivePartnerBrand(
  userId: string,
  product: PartnerGateProduct,
  now = new Date(),
): Promise<{ slug: string; brand: PartnerExperience["brand"] } | null> {
  if (!partnerMembershipAccessEnabled() || !userId.trim()) return null;

  const memberships = await prisma.oremea_partner_memberships.findMany({
    where: {
      user_id: userId,
      status: "active",
      product_keys: { has: product },
      period_end: { gt: now },
    },
    orderBy: [{ period_end: "desc" }, { created_at: "desc" }],
    take: 10,
    select: { partner_slug: true },
  });

  // A member may hold more than one package; only a unique valid partner
  // establishes a theme. Mixed partnerships stay on neutral OREMEA styling.
  const validPartners = new Set(
    memberships
      .map(membership => membership.partner_slug)
      .filter(slug => Boolean(getPublishedPartnerExperience(slug))),
  );
  if (validPartners.size !== 1) return null;
  const slug = [...validPartners][0];
  const experience = getPublishedPartnerExperience(slug);
  return experience ? { slug, brand: experience.brand } : null;
}
