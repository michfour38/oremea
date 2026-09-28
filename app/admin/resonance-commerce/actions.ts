"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { requireAdminAction } from "@/lib/auth/require-admin";
import { provisionCreatorStarterWhopCatalog } from "@/src/lib/whop/creator-starter-catalog";
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
    // Provision the ordinary Resonance visit catalog first. The creator starter
    // then reuses only the verified company/webhook while keeping its product
    // and plan completely separate from normal Resonance backend commerce.
    await provisionResonanceWhopCatalog();
    await provisionCreatorStarterWhopCatalog();
  } catch (error) {
    if (error instanceof ResonanceProvisioningError) {
      // Return redacted details only to the admin who invoked the action.
      // Never put provider messages in URLs, logs, cookies, or public pages.
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
