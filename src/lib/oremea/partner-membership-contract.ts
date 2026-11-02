import {
  OREMEA_PARTNER_EXPERIENCES,
  resolvePublishedPartnerExperience,
  type PartnerProduct,
} from "./partner-experiences";

/**
 * OREMEA products whose existing access guards understand partner membership.
 * SUSTAIN is intentionally not in this type, and Resonance visit credits must
 * not be bypassed by generic partner subscription access.
 */
export type PartnerGateProduct = Extract<PartnerProduct, "recognition" | "compass">;

export type MatchedPartnerOffer = Readonly<{
  partnerSlug: string;
  offerKey: string;
  whopProductId: string;
  whopPlanId: string;
  productKeys: readonly PartnerGateProduct[];
}>;

export const partnerMembershipAccessEnabled = () =>
  process.env.OREMEA_PARTNER_ACCESS_ENABLED === "true";

/** No match for draft/unverified plans or reused ambiguous plan identifiers. */
export function matchPublishedPartnerWhopPlan(
  whopProductId: string,
  whopPlanId: string,
): MatchedPartnerOffer | null {
  if (!whopProductId.trim() || !whopPlanId.trim()) return null;
  const matches: MatchedPartnerOffer[] = [];
  for (const experience of Object.values(OREMEA_PARTNER_EXPERIENCES)) {
    const published = resolvePublishedPartnerExperience(experience);
    if (!published) continue;
    for (const offer of published.offers) {
      if (
        offer.purchaseMode !== "subscription" ||
        offer.checkout.whopProductId !== whopProductId ||
        offer.checkout.whopPlanId !== whopPlanId
      ) continue;
      const productKeys = offer.includedProducts.filter(
        (product): product is PartnerGateProduct =>
          product === "recognition" || product === "compass",
      );
      if (!productKeys.length) continue;
      matches.push({
        partnerSlug: published.slug,
        offerKey: offer.key,
        whopProductId,
        whopPlanId,
        productKeys: [...new Set(productKeys)],
      });
    }
  }
  return matches.length === 1 ? matches[0] : null;
}

/**
 * Deactivation wins if Whop sends conflicting events at the same timestamp.
 * A stale event never overwrites a newer membership state.
 */
export function shouldApplyPartnerMembershipEvent(
  existing: { last_event_at: Date; status: string } | null,
  incoming: { eventAt: Date; active: boolean },
) {
  if (Number.isNaN(incoming.eventAt.getTime())) return false;
  if (!existing) return incoming.active;
  const oldTime = existing.last_event_at.getTime();
  const newTime = incoming.eventAt.getTime();
  if (newTime < oldTime) return false;
  if (newTime > oldTime) return true;
  return !incoming.active && existing.status === "active";
}
