"use server";

import { clerkClient } from "@clerk/nextjs/server";
import { revalidatePath } from "next/cache";

import { requireAdminAction } from "@/lib/auth/require-admin";
import { prisma } from "@/lib/prisma";
import { isKnownPartner } from "@/src/lib/oremea/partner-appearance-contract";

function parseGrantInput(form: FormData) {
  const slug = String(form.get("partnerSlug") ?? "");
  const userId = String(form.get("userId") ?? "").trim();
  if (!isKnownPartner(slug) || !/^user_[a-zA-Z0-9]{12,70}$/.test(userId)) {
    throw new Error("A valid partner and existing Clerk user ID are required.");
  }
  return { slug, userId };
}

export async function grantPartnerAppearanceEditor(form: FormData) {
  const { userId: grantedBy } = await requireAdminAction();
  const { slug, userId } = parseGrantInput(form);
  const client = await clerkClient();
  await client.users.getUser(userId); // Never grant a nonexistent identity.
  await prisma.oremea_partner_appearance_editors.upsert({
    where: { partner_slug_user_id: { partner_slug: slug, user_id: userId } },
    create: { partner_slug: slug, user_id: userId, granted_by: grantedBy },
    update: { revoked_at: null, granted_by: grantedBy },
  });
  revalidatePath("/admin/partner-appearance/editors");
}

export async function revokePartnerAppearanceEditor(form: FormData) {
  await requireAdminAction();
  const { slug, userId } = parseGrantInput(form);
  await prisma.oremea_partner_appearance_editors.updateMany({
    where: { partner_slug: slug, user_id: userId, revoked_at: null },
    data: { revoked_at: new Date() },
  });
  revalidatePath("/admin/partner-appearance/editors");
}
