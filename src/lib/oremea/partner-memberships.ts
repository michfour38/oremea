import { prisma } from "@/lib/prisma";
import {
  matchPublishedPartnerWhopPlan,
  partnerMembershipAccessEnabled,
  shouldApplyPartnerMembershipEvent,
  type PartnerGateProduct,
} from "./partner-membership-contract";

export async function hasActivePartnerProductAccess(
  userId: string,
  product: PartnerGateProduct,
  now = new Date(),
): Promise<{ active: boolean; expiresAt: Date | null }> {
  if (!partnerMembershipAccessEnabled() || !userId.trim()) {
    return { active: false, expiresAt: null };
  }
  const membership = await prisma.oremea_partner_memberships.findFirst({
    where: {
      user_id: userId,
      status: "active",
      revoked_at: undefined,
      product_keys: { has: product },
      period_end: { gt: now },
    },
    orderBy: { period_end: "desc" },
    select: { period_end: true },
  });
  return { active: Boolean(membership), expiresAt: membership?.period_end ?? null };
}

export async function findPartnerMembershipForDeactivation(
  membershipId: string,
  whopProductId: string,
  whopPlanId: string,
) {
  if (!partnerMembershipAccessEnabled()) return null;
  const record = await prisma.oremea_partner_memberships.findUnique({
    where: { whop_membership_id: membershipId },
    select: { whop_product_id: true, whop_plan_id: true },
  });
  return record &&
    record.whop_product_id === whopProductId &&
    record.whop_plan_id === whopPlanId
    ? record
    : null;
}

export async function setPartnerMembershipAccess({
  userId, membershipId, whopProductId, whopPlanId, active, eventAt, renewalPeriodEnd,
}: {
  userId: string;
  membershipId: string;
  whopProductId: string;
  whopPlanId: string;
  active: boolean;
  eventAt: Date;
  renewalPeriodEnd: Date | null;
}) {
  if (!partnerMembershipAccessEnabled()) return null;
  if (!userId.trim() || !membershipId.trim() ||
    !whopProductId.trim() || !whopPlanId.trim() ||
    Number.isNaN(eventAt.getTime())) throw new Error("Invalid partner membership event");
  // The provider must include an actual paid-period boundary. Never grant
  // indefinite access because an upstream renewal date is absent.
  if (active && (!renewalPeriodEnd ||
    Number.isNaN(renewalPeriodEnd.getTime()) ||
    renewalPeriodEnd.getTime() <= eventAt.getTime())) {
    throw new Error("Partner membership period requires reconciliation");
  }

  const matched = active ? matchPublishedPartnerWhopPlan(whopProductId, whopPlanId) : null;
  if (active && !matched) return null;

  return prisma.$transaction(async tx => {
    await tx.$queryRaw`SELECT pg_advisory_xact_lock(hashtext(${`partner-member:${membershipId}`}))::text`;
    const existing = await tx.oremea_partner_memberships.findUnique({
      where: { whop_membership_id: membershipId },
    });
    if (existing && (existing.user_id !== userId ||
      existing.whop_product_id !== whopProductId ||
      existing.whop_plan_id !== whopPlanId)) {
      throw new Error("Partner membership identity mismatch");
    }
    if (!shouldApplyPartnerMembershipEvent(existing, { eventAt, active })) return existing;
    if (!active) {
      if (!existing) return null;
      return tx.oremea_partner_memberships.update({
        where: { whop_membership_id: membershipId },
        data: { status: "inactive", last_event_at: eventAt },
      });
    }
    if (!matched) return existing;
    return tx.oremea_partner_memberships.upsert({
      where: { whop_membership_id: membershipId },
      create: {
        whop_membership_id: membershipId,
        whop_product_id: whopProductId,
        whop_plan_id: whopPlanId,
        user_id: userId,
        partner_slug: matched.partnerSlug,
        offer_key: matched.offerKey,
        product_keys: [...matched.productKeys],
        status: "active",
        last_event_at: eventAt,
        period_end: renewalPeriodEnd,
      },
      update: {
        partner_slug: matched.partnerSlug,
        offer_key: matched.offerKey,
        product_keys: [...matched.productKeys],
        status: "active",
        last_event_at: eventAt,
        period_end: renewalPeriodEnd,
      },
    });
  });
}
