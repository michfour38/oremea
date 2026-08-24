import { WorksProviderPlan } from "@prisma/client";

type CommercialPlanWindow = {
  plan: WorksProviderPlan;
  plan_ends_at: Date | string | null;
};

type PaidThroughInput = {
  lastPaymentAt?: Date | string | null;
  startedAt?: Date | string | null;
  now?: Date;
};

function toValidDate(value: Date | string | null | undefined) {
  if (!value) return null;
  const date = value instanceof Date ? new Date(value.getTime()) : new Date(value);
  return Number.isFinite(date.getTime()) ? date : null;
}

export function addOneCalendarMonthUtc(value: Date) {
  const year = value.getUTCFullYear();
  const month = value.getUTCMonth();
  const day = value.getUTCDate();
  const targetLastDay = new Date(Date.UTC(year, month + 2, 0)).getUTCDate();

  return new Date(
    Date.UTC(
      year,
      month + 1,
      Math.min(day, targetLastDay),
      value.getUTCHours(),
      value.getUTCMinutes(),
      value.getUTCSeconds(),
      value.getUTCMilliseconds(),
    ),
  );
}

export function worksPaidThroughEnd({
  lastPaymentAt,
  startedAt,
  now = new Date(),
}: PaidThroughInput) {
  // A completed monthly payment funds one billing period. A PENDING checkout
  // does not create paid access, so created_at is deliberately not a fallback.
  const paidReference = toValidDate(lastPaymentAt) ?? toValidDate(startedAt);
  if (!paidReference) return now;

  const paidThrough = addOneCalendarMonthUtc(paidReference);
  return paidThrough > now ? paidThrough : now;
}

export function effectiveWorksProviderPlan(
  profile: CommercialPlanWindow | null | undefined,
  now = new Date(),
) {
  if (!profile || profile.plan === WorksProviderPlan.FREE) {
    return WorksProviderPlan.FREE;
  }

  if (!profile.plan_ends_at) return profile.plan;

  const end = toValidDate(profile.plan_ends_at);
  if (!end || end <= now) return WorksProviderPlan.FREE;
  return profile.plan;
}
