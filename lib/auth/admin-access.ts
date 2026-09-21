import { createHash, timingSafeEqual } from "node:crypto";

import { prisma } from "@/lib/prisma";

const OWNER_FINGERPRINT_FALLBACK =
  "a6ede7b422f4718bffdefae8ad7aba4e1141198c66a585e28a4ed9881d5c5ab5";

function ownerFingerprintMatches(userId: string) {
  const expected = (
    process.env.OREMEA_OWNER_CLERK_USER_SHA256?.trim().toLowerCase() ||
    OWNER_FINGERPRINT_FALLBACK
  );
  if (!/^[a-f0-9]{64}$/.test(expected)) return false;

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
