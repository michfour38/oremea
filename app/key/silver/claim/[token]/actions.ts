"use server";

import { auth, clerkClient } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";

import { claimCreatorSilverKeyInvite } from "@/lib/auth/creator-silver-key-invites";

export async function claimCreatorSilverKeyAction(formData: FormData) {
  const { userId } = await auth();
  if (!userId) throw new Error("Sign in before claiming this Creator Silver Key.");

  const token = String(formData.get("token") ?? "");
  const client = await clerkClient();
  const user = await client.users.getUser(userId);
  const verifiedEmails = user.emailAddresses
    .filter((email) => email.verification?.status === "verified")
    .map((email) => email.emailAddress);

  await claimCreatorSilverKeyInvite({ token, userId, verifiedEmails });
  redirect("/key/silver?claimed=1");
}
