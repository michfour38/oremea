import {
  Prisma,
  WorksClaimStatus,
  WorksVerificationMethod,
} from "@prisma/client";

import { prisma } from "@/lib/prisma";

type CreateClaimVersionInput = {
  providerId: string;
  offeringId?: string | null;
  claimType: string;
  field: string;
  value: Prisma.InputJsonValue;
  displayValue?: string | null;
  unit?: string | null;
  scope?: string | null;
  status?: WorksClaimStatus;
  verificationMethod?: WorksVerificationMethod;
  verifiedAt?: Date | null;
  validFrom?: Date | null;
  expiresAt?: Date | null;
  staleAfter?: Date | null;
};

export async function createClaimVersion(input: CreateClaimVersionInput) {
  return prisma.$transaction(async (tx) => {
    if (input.offeringId) {
      const offering = await tx.works_offerings.findUnique({
        where: { id: input.offeringId },
        select: {
          provider_market: {
            select: { provider_id: true },
          },
        },
      });

      if (!offering) {
        throw new Error(`WORKS offering ${input.offeringId} was not found.`);
      }

      if (offering.provider_market.provider_id !== input.providerId) {
        throw new Error("WORKS claim provider does not own the supplied offering.");
      }
    }

    const currentClaim = await tx.works_claims.findFirst({
      where: {
        provider_id: input.providerId,
        offering_id: input.offeringId ?? null,
        field: input.field,
        is_current: true,
      },
      orderBy: { created_at: "desc" },
      select: { id: true },
    });

    if (currentClaim) {
      await tx.works_claims.update({
        where: { id: currentClaim.id },
        data: { is_current: false },
      });
    }

    return tx.works_claims.create({
      data: {
        provider_id: input.providerId,
        offering_id: input.offeringId ?? null,
        claim_type: input.claimType,
        field: input.field,
        value: input.value,
        display_value: input.displayValue,
        unit: input.unit,
        scope: input.scope,
        status: input.status ?? WorksClaimStatus.UNKNOWN,
        verification_method:
          input.verificationMethod ?? WorksVerificationMethod.NONE,
        verified_at: input.verifiedAt,
        valid_from: input.validFrom,
        expires_at: input.expiresAt,
        stale_after: input.staleAfter,
        supersedes_claim_id: currentClaim?.id,
        is_current: true,
      },
    });
  });
}
