"use server";

import { clerkClient } from "@clerk/nextjs/server";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { restoreAccount, suspendAccount } from "@/lib/auth/account-access";
import { createGoldenKeyInvite } from "@/lib/auth/golden-key-invites";
import { requireAdminAction } from "@/lib/auth/require-admin";

export type GoldenKeyInviteActionState =
  | { status: "idle" }
  | {
      status: "success";
      email: string;
      link: string;
      expiresAt: string;
    }
  | { status: "error"; message: string };

async function userIdForEmail(rawEmail: FormDataEntryValue | null) {
  const email = String(rawEmail ?? "").trim().toLowerCase();

  if (!email || !email.includes("@")) {
    throw new Error("Enter a valid email address.");
  }

  const client = await clerkClient();
  const { data } = await client.users.getUserList({
    emailAddress: [email],
    limit: 2,
  });

  if (data.length !== 1) {
    throw new Error(
      data.length === 0
        ? `No Oremea account was found for ${email}.`
        : `More than one account matched ${email}.`,
    );
  }

  return { userId: data[0].id, email };
}

export async function createEternalKeyInviteAction(
  _previousState: GoldenKeyInviteActionState,
  formData: FormData,
): Promise<GoldenKeyInviteActionState> {
  const { userId: actorId } = await requireAdminAction();

  try {
    const invite = await createGoldenKeyInvite({
      email: String(formData.get("email") ?? ""),
      actorId,
    });

    revalidatePath("/admin/account-access");

    return {
      status: "success",
      email: invite.email,
      link: invite.link,
      expiresAt: invite.expiresAt.toISOString(),
    };
  } catch (error) {
    return {
      status: "error",
      message:
        error instanceof Error
          ? error.message
          : "Could not create the Golden Key link.",
    };
  }
}

export async function suspendAccountAction(formData: FormData) {
  const { userId: actorId } = await requireAdminAction();
  const target = await userIdForEmail(formData.get("email"));
  const reason = String(formData.get("reason") ?? "").trim() || "Admin security suspension";

  if (target.userId === actorId) {
    throw new Error("An admin cannot suspend their own active session from this control.");
  }

  await suspendAccount({
    userId: target.userId,
    actorId,
    source: "admin",
    reason,
  });

  revalidatePath("/admin/account-access");
  redirect(`/admin/account-access?done=suspended&email=${encodeURIComponent(target.email)}`);
}

export async function restoreAccountAction(formData: FormData) {
  const { userId: actorId } = await requireAdminAction();
  const target = await userIdForEmail(formData.get("email"));
  const reason = String(formData.get("reason") ?? "").trim() || "Admin restored account access";

  await restoreAccount({
    userId: target.userId,
    actorId,
    reason,
  });

  revalidatePath("/admin/account-access");
  redirect(`/admin/account-access?done=restored&email=${encodeURIComponent(target.email)}`);
}
