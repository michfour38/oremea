import {
  Prisma,
  WorksClaimStatus,
  WorksCredentialType,
  WorksVerificationMethod,
} from "@prisma/client";

import { prisma } from "@/lib/prisma";

type CreateCredentialClaimInput = {
  providerId: string;
  field: string;
  credentialType: WorksCredentialType;
  credentialName: string;
  authorityId?: string | null;
  holderName?: string | null;
  credentialNumber?: string | null;
  designation?: string | null;
  professionalField?: string | null;
  scope?: string | null;
  issuedAt?: Date | null;
  expiresAt?: Date | null;
  staleAfter?: Date | null;
  status?: WorksClaimStatus;
  verificationMethod?: WorksVerificationMethod;
  verifiedAt?: Date | null;
};

export async function createCredentialClaim(input: CreateCredentialClaimInput) {
  return prisma.$transaction(async (tx) => {
    const currentClaim = await tx.works_claims.findFirst({
      where: {
        provider_id: input.providerId,
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

    const claimValue: Prisma.InputJsonObject = {
      credentialType: input.credentialType,
      credentialName: input.credentialName,
      ...(input.credentialNumber
        ? { credentialNumber: input.credentialNumber }
        : {}),
      ...(input.designation ? { designation: input.designation } : {}),
      ...(input.professionalField
        ? { professionalField: input.professionalField }
        : {}),
      ...(input.scope ? { scope: input.scope } : {}),
    };

    return tx.works_claims.create({
      data: {
        provider_id: input.providerId,
        claim_type: "CREDENTIAL",
        field: input.field,
        value: claimValue,
        display_value: input.credentialName,
        scope: input.scope,
        status: input.status ?? WorksClaimStatus.UNKNOWN,
        verification_method:
          input.verificationMethod ?? WorksVerificationMethod.NONE,
        verified_at: input.verifiedAt,
        valid_from: input.issuedAt,
        expires_at: input.expiresAt,
        stale_after: input.staleAfter,
        supersedes_claim_id: currentClaim?.id,
        is_current: true,
        credential_detail: {
          create: {
            credential_type: input.credentialType,
            authority_id: input.authorityId,
            holder_name: input.holderName,
            credential_name: input.credentialName,
            credential_number: input.credentialNumber,
            designation: input.designation,
            field: input.professionalField,
            scope: input.scope,
            issued_at: input.issuedAt,
            expires_at: input.expiresAt,
          },
        },
      },
      include: {
        credential_detail: {
          include: { authority: true },
        },
      },
    });
  });
}
