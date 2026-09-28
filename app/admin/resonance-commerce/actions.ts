"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { requireAdminAction } from "@/lib/auth/require-admin";
import {
  provisionResonanceWhopCatalog,
  ResonanceProvisioningError,
} from "@/src/lib/whop/resonance-catalog";
import type { WhopFailureDetails } from "@/src/lib/whop/whop-api";

export type ProvisioningFailure = {
  stage: string;
  code: string;
  providerStatus?: number;
  providerDetails?: WhopFailureDetails;
};

export async function provisionResonanceCommerce(
  _previous: ProvisioningFailure | null,
  _formData: FormData,
): Promise<ProvisioningFailure | null> {
  await requireAdminAction();

  try {
    // Launch authority: one normal Resonance catalog for direct, affiliate and
    // approved-creator traffic. Creator compensation is configured in Whop at
    // 30% standard / 40% specifically approved; no special first-sale product
    // is provisioned here.
    await provisionResonanceWhopCatalog();
  } catch (error) {
    if (error instanceof ResonanceProvisioningError) {
      return {
        stage: error.stage,
        code: error.code,
        providerStatus: error.providerStatus,
        providerDetails: error.providerDetails,
      };
    }
    return { stage: "unknown", code: "validation" };
  }

  revalidatePath("/admin/resonance-commerce");
  revalidatePath("/admin/affiliates");
  redirect("/admin/resonance-commerce?status=ready");
}
