import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { isOremeaAdmin } from "@/lib/auth/admin-access";

export async function requireAdminPage(): Promise<{ clerkUserId: string }> {
  const { userId } = await auth();

  if (!userId) {
    redirect("/sign-in");
  }

  if (!(await isOremeaAdmin(userId))) {
    redirect("/");
  }

  return { clerkUserId: userId };
}

export async function requireAdminAction(): Promise<{ clerkUserId: string }> {
  const { userId } = await auth();

  if (!userId) {
    throw new Error("Unauthorized");
  }

  if (!(await isOremeaAdmin(userId))) {
    throw new Error("Forbidden");
  }

  return { clerkUserId: userId };
}