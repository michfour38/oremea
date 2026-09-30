import { createHash, randomBytes } from "node:crypto";

const GUEST_OWNER_PREFIX = "guest_checkout:";
const GUEST_CLAIM_PATTERN = /^[a-f0-9]{64}$/;

export function createGuestVisitClaim() {
  return randomBytes(32).toString("hex");
}

export function guestOwnerFromClaim(claim: string | null | undefined) {
  if (!claim || !GUEST_CLAIM_PATTERN.test(claim)) return null;
  const digest = createHash("sha256").update(claim).digest("hex");
  return `${GUEST_OWNER_PREFIX}${digest}`;
}

export function isGuestVisitOwner(userId: string) {
  return userId.startsWith(GUEST_OWNER_PREFIX);
}

export function pendingGuestEmail(orderId: string) {
  return `pending+${orderId}@guest.oremea.invalid`;
}

export function guestClaimQuery(claim: string | null | undefined, room?: number) {
  const params = new URLSearchParams();
  if (claim && GUEST_CLAIM_PATTERN.test(claim)) params.set("claim", claim);
  if (room && Number.isInteger(room) && room >= 1 && room <= 10) params.set("room", String(room));
  const query = params.toString();
  return query ? `&${query}` : "";
}

export function guestClaimPath(orderId: string, claim: string, room?: number) {
  const params = new URLSearchParams({ order: orderId, claim });
  if (room && Number.isInteger(room) && room >= 1 && room <= 10) params.set("room", String(room));
  return `/resonance/claim?${params.toString()}`;
}
