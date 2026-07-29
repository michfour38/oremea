import { WorksClaimStatus } from "@prisma/client";

type ClaimStatusInput = {
  status: WorksClaimStatus;
  expiresAt?: Date | null;
  staleAfter?: Date | null;
};

export function getEffectiveClaimStatus(
  claim: ClaimStatusInput,
  now: Date = new Date()
): WorksClaimStatus {
  if (claim.status === WorksClaimStatus.CONFLICTING) {
    return WorksClaimStatus.CONFLICTING;
  }

  if (claim.expiresAt && claim.expiresAt <= now) {
    return WorksClaimStatus.EXPIRED;
  }

  if (claim.staleAfter && claim.staleAfter <= now) {
    return WorksClaimStatus.STALE;
  }

  return claim.status;
}
