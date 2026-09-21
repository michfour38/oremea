import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { isOremeaAdmin } from "@/lib/auth/admin-access";

export async function requireAdminPage(): Promise<{ userId: string }> {
  const { userId: clerkId } = await auth();

  if (!clerkId) {
    redirect("/sign-in");
  }

  if (!(await isOremeaAdmin(clerkId))) {
    redirect("/");
  }

  return { userId: clerkId };
}

export async function requireAdminAction(): Promise<{ userId: string }> {
  const { userId: clerkId } = await auth();

  if (!clerkId) {
    throw new Error("Unauthorized");
  }

  if (!(await isOremeaAdmin(clerkId))) {
    throw new Error("Forbidden");
  }

  return { userId: clerkId };
}