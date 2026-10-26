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

  try {
    await claimGoldenKeyInvite({ token, userId, verifiedEmails });
  } catch {
    // A link can expire or be replaced between page load and submission.
    // Keep the invited identity private and show an actionable page instead.
    redirect(`/key/claim/${encodeURIComponent(token)}?error=claim`);
  }
  redirect("/key?claimed=1");
}
