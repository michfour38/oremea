"use server";

import { revalidatePath } from "next/cache";

import { prisma } from "@/lib/prisma";
import { requireAdminAction } from "@/lib/auth/require-admin";

const ALLOWED_STATUSES = new Set([
  "new",
  "in_progress",
  "handled",
  "archived",
]);

export async function updateFeedbackMessage(formData: FormData) {
  const { userId } = await requireAdminAction();
  const id = String(formData.get("id") || "");
  const status = String(formData.get("status") || "");
  const adminNote = String(formData.get("adminNote") || "").trim().slice(0, 5000);

  if (!id || !ALLOWED_STATUSES.has(status)) {
    throw new Error("Invalid feedback update.");
  }

  const handled = status === "handled" || status === "archived";

  await prisma.oremea_feedback_messages.update({
    where: { id },
    data: {
      status,
      admin_note: adminNote || null,
      handled_by: handled ? userId : null,
      handled_at: handled ? new Date() : null,
    },
  });

  revalidatePath("/admin");
  revalidatePath("/admin/feedback");
}
