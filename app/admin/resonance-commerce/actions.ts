"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { requireAdminAction } from "@/lib/auth/require-admin";
import { provisionResonanceWhopCatalog } from "@/src/lib/whop/resonance-catalog";

export async function provisionResonanceCommerce() {
  await requireAdminAction();

  try {
    await provisionResonanceWhopCatalog();
  } catch {
    redirect("/admin/resonance-commerce?status=error");
  }

  revalidatePath("/admin/resonance-commerce");
  redirect("/admin/resonance-commerce?status=ready");
}
