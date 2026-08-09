import { COMPASS_PRICING } from "./compass-pricing";

const DAY_MS = 24 * 60 * 60 * 1000;

export function calculateCompassExpiry(
  grantedAt: Date,
  currentExpiry: Date | null = null,
) {
  const startsAt =
    currentExpiry && currentExpiry.getTime() > grantedAt.getTime()
      ? currentExpiry
      : grantedAt;

  return new Date(
    startsAt.getTime() + COMPASS_PRICING.accessDays * DAY_MS,
  );
}

export function isCompassAccessActive(
  expiresAt: Date | null,
  now = new Date(),
) {
  return Boolean(expiresAt && expiresAt.getTime() > now.getTime());
}

export function getCompassDaysRemaining(
  expiresAt: Date | null,
  now = new Date(),
) {
  if (!isCompassAccessActive(expiresAt, now)) return 0;
  return Math.ceil((expiresAt!.getTime() - now.getTime()) / DAY_MS);
}

export function readCompassPaymentReferences(value: string | null) {
  const trimmed = value?.trim();
  if (!trimmed) return [];

  try {
    const parsed: unknown = JSON.parse(trimmed);
    if (Array.isArray(parsed)) {
      return parsed.filter(
        (reference): reference is string =>
          typeof reference === "string" && reference.length > 0,
      );
    }
  } catch {
    // Older entitlement rows stored one reference as plain text.
  }

  return [trimmed];
}

export function appendCompassPaymentReference(
  value: string | null,
  paymentId: string,
) {
  return JSON.stringify(
    Array.from(new Set([...readCompassPaymentReferences(value), paymentId])),
  );
}
