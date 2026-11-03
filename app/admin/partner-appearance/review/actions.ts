"use server";

import { revalidatePath } from "next/cache";
import { requireAdminAction } from "@/lib/auth/require-admin";
import {
  approveSavedPartnerAppearance,
  withdrawApprovedPartnerAppearance,
} from "@/src/lib/oremea/partner-appearance-release-server";
import { isKnownPartner } from "@/src/lib/oremea/partner-appearance-contract";

function actionFields(form: FormData) {
  const slug = String(form.get("slug") ?? "");
  const expectedDraftRevision = Number(form.get("draftRevision"));
  const expectedApprovalVersion = Number(form.get("approvalVersion"));
  if (!isKnownPartner(slug) || !Number.isInteger(expectedDraftRevision) ||
    !Number.isInteger(expectedApprovalVersion)) throw new Error("Invalid review request");
  return { slug, expectedDraftRevision, expectedApprovalVersion };
}

export async function approvePartnerAppearance(form: FormData) {
  const { userId } = await requireAdminAction();
  const fields = actionFields(form);
  await approveSavedPartnerAppearance({
    slug: fields.slug, adminId: userId,
    expectedDraftRevision: fields.expectedDraftRevision,
    expectedApprovalVersion: fields.expectedApprovalVersion,
  });
  revalidatePath(`/admin/partner-appearance/review/${fields.slug}`);
  revalidatePath(`/partner/${fields.slug}`);
}

export async function withdrawPartnerAppearance(form: FormData) {
  const { userId } = await requireAdminAction();
  const fields = actionFields(form);
  await withdrawApprovedPartnerAppearance({
    slug: fields.slug, adminId: userId,
    expectedApprovalVersion: fields.expectedApprovalVersion,
  });
  revalidatePath(`/admin/partner-appearance/review/${fields.slug}`);
  revalidatePath(`/partner/${fields.slug}`);
}
