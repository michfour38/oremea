"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { requireAdminAction } from "@/lib/auth/require-admin";
import {
  provisionResonanceWhopCatalog,
  ResonanceProvisioningError,
} from "@/src/lib/whop/resonance-catalog";

export async function provisionResonanceCommerce() {
  await requireAdminAction();

  try {
    await provisionResonanceWhopCatalog();
  } catch (error) {
    if (error instanceof ResonanceProvisioningError) {
      const params = new URLSearchParams({
        status: "error",
        stage: error.stage,
        code: error.code,
      });
      if (error.providerStatus) {
        params.set("providerStatus", String(error.providerStatus));
      }
      redirect(`/admin/resonance-commerce?${params.toString()}`);
    }
    redirect("/admin/resonance-commerce?status=error&stage=unknown&code=validation");
  }

  revalidatePath("/admin/resonance-commerce");
  redirect("/admin/resonance-commerce?status=ready");
}
