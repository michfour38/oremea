import { createHash, timingSafeEqual } from "node:crypto";

import { prisma } from "@/lib/prisma";

function ownerFingerprintMatches(userId: string) {
  const expected = process.env.OREMEA_OWNER_CLERK_USER_SHA256?.trim().toLowerCase();
  if (!expected || !/^[a-f0-9]{64}$/.test(expected)) return false;

  const actual = createHash("sha256").update(userId, "utf8").digest("hex");
  return timingSafeEqual(Buffer.from(actual, "hex"), Buffer.from(expected, "hex"));
}

export async function isOremeaAdmin(userId: string) {
  if (ownerFingerprintMatches(userId)) return true;

  const profile = await prisma.profiles.findUnique({
    where: { id: userId },
    select: { is_admin: true },
  });

  return profile?.is_admin === true;
}
