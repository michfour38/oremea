import type { Prisma } from "@prisma/client";

/** Shared by legacy purchases and visit redemptions: one active run per account. */
export async function lockResonanceAccount(tx: Prisma.TransactionClient, userId: string) {
  // Casting avoids Prisma's unsupported PostgreSQL void result type.
  await tx.$queryRaw`SELECT pg_advisory_xact_lock(hashtextextended(${`resonance:${userId}`}, 0))::text`;
}
