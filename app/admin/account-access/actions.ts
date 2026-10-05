"use server";

import { clerkClient } from "@clerk/nextjs/server";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { restoreAccount, suspendAccount } from "@/lib/auth/account-access";
import { getAccountDeletionPreflight } from "@/lib/auth/account-deletion";
import { getAccountDeletionExtraBlockers } from "@/lib/auth/account-deletion-extra-guards";
import { isOremeaAdmin } from "@/lib/auth/admin-access";
import { createCreatorSilverKeyInvite } from "@/lib/auth/creator-silver-key-invites";
import { createGoldenKeyInvite } from "@/lib/auth/golden-key-invites";
import { requireAdminAction } from "@/lib/auth/require-admin";
import { hasOremeaOwnerAccess } from "@/src/lib/oremea/owner-recovery";

export type GoldenKeyInviteActionState =
  | { status: "idle" }
  | {
      status: "success";
      email: string;
      link: string;
      expiresAt: string;
    }
  | { status: "error"; message: string };

export type CreatorSilverKeyInviteActionState = GoldenKeyInviteActionState;

export type AccountDeletionReviewState =
  | { status: "idle" }
  | {
      status: "review";
      email: string;
      userId: string;
      canDelete: boolean;
      blockers: string[];
      confirmationText: string;
      summary: {
        profile: boolean;
        recognitionThreads: number;
        compassSessions: number;
        compassGoals: number;
        currentRecords: number;
        resonanceRuns: number;
        resonanceOrders: number;
        entitlements: number;
        goldenKey: boolean;
        entryLead: boolean;
        feedbackMessages: number;
      };
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

export async function reviewAccountDeletionAction(
  _previousState: AccountDeletionReviewState,
  formData: FormData,
): Promise<AccountDeletionReviewState> {
  const { userId: actorId } = await requireAdminAction();

  try {
    const email = String(formData.get("email") ?? "").trim().toLowerCase();
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

    const user = data[0];
    if (user.id === actorId) {
      throw new Error("The active admin account cannot delete itself.");
    }

    if ((await isOremeaAdmin(user.id)) || (await hasOremeaOwnerAccess(user.id))) {
      throw new Error("Owner/admin identities cannot be deleted from this control.");
    }

    const verifiedEmails = user.emailAddresses
      .filter((item) => item.verification?.status === "verified")
      .map((item) => item.emailAddress.trim().toLowerCase());

    if (verifiedEmails.length !== 1 || verifiedEmails[0] !== email) {
      throw new Error(
        "Delete account currently requires exactly one verified Clerk email. Resolve additional verified emails before deleting this identity.",
      );
    }

    const [preflight, extraBlockers] = await Promise.all([
      getAccountDeletionPreflight({ userId: user.id, email }),
      getAccountDeletionExtraBlockers({ userId: user.id, email }),
    ]);
    const blockers = [
      ...preflight.blockers.map((item) => item.message),
      ...extraBlockers,
    ];

    return {
      status: "review",
      email,
      userId: user.id,
      canDelete: preflight.canDelete && extraBlockers.length === 0,
      blockers,
      confirmationText: `DELETE ${email}`,
      summary: preflight.summary,
    };
  } catch (error) {
    return {
      status: "error",
      message:
        error instanceof Error
          ? error.message
          : "The account could not be reviewed for deletion.",
    };
  }
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

    revalidatePath("/admin");

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

export async function createCreatorSilverKeyInviteAction(
  _previousState: CreatorSilverKeyInviteActionState,
  formData: FormData,
): Promise<CreatorSilverKeyInviteActionState> {
  const { userId: actorId } = await requireAdminAction();

  try {
    const invite = await createCreatorSilverKeyInvite({
      email: String(formData.get("email") ?? ""),
      actorId,
    });

    revalidatePath("/admin");

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
          : "Could not create the Creator Silver Key link.",
    };
  }
}

export async function suspendAccountAction(formData: FormData) {
  const { userId: actorId } = await requireAdminAction();
  const target = await userIdForEmail(formData.get("email"));
  const reason =
    String(formData.get("reason") ?? "").trim() || "Admin security suspension";

  if (target.userId === actorId) {
    throw new Error(
      "An admin cannot suspend their own active session from this control.",
    );
  }

  await suspendAccount({
    userId: target.userId,
    actorId,
    source: "admin",
    reason,
  });

  revalidatePath("/admin");
  redirect(`/admin?done=suspended&email=${encodeURIComponent(target.email)}`);
}

export async function restoreAccountAction(formData: FormData) {
  const { userId: actorId } = await requireAdminAction();
  const target = await userIdForEmail(formData.get("email"));
  const reason =
    String(formData.get("reason") ?? "").trim() ||
    "Admin restored account access";

  await restoreAccount({
    userId: target.userId,
    actorId,
    reason,
  });

  revalidatePath("/admin");
  redirect(`/admin?done=restored&email=${encodeURIComponent(target.email)}`);
}
