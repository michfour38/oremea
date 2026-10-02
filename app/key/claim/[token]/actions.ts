"use server";

import { auth, clerkClient } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";

import { claimGoldenKeyInvite } from "@/lib/auth/golden-key-invites";

export async function claimGoldenKeyAction(formData: FormData) {
  const { userId } = await auth();
  if (!userId) throw new Error("Sign in before claiming this Golden Key.");

  const token = String(formData.get("token") ?? "");
  const client = await clerkClient();
  const user = await client.users.getUser(userId);
  const verifiedEmails = user.emailAddresses
    .filter((email) => email.verification?.status === "verified")
    .map((email) => email.emailAddress);

  await claimGoldenKeyInvite({ token, userId, verifiedEmails });
  redirect("/key?claimed=1");
}
