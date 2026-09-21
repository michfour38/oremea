import { prisma } from "@/lib/prisma";

export async function isOremeaAdmin(userId: string) {
  const ownerId = process.env.OREMEA_OWNER_CLERK_USER_ID?.trim();
  if (ownerId && userId === ownerId) return true;

  const profile = await prisma.profiles.findUnique({
    where: { id: userId },
    select: { is_admin: true },
  });

  return profile?.is_admin === true;
}
