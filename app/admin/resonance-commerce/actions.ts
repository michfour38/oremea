"use server";

import { requireAdminAction } from "@/lib/auth/require-admin";

export type ProvisioningFailure = {
  stage: string;
  code: string;
  providerStatus?: number;
};

export async function provisionResonanceCommerce(
  _previous: ProvisioningFailure | null,
  _formData: FormData,
): Promise<ProvisioningFailure> {
  await requireAdminAction();
  // Fail closed: no external commerce writes from this endpoint until
  // a read-only preflight and owner-approved execution flow are built.
  return { stage: "safety", code: "provisioning_locked" };
}
