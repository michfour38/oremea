import { prisma } from "@/lib/prisma";

// Compatibility surface for historical callers.
// Live Resonance Mirror generation is run-scoped and lives in
// src/lib/resonance/resonance-run-weekly-mirror.ts.

export interface MirrorResponseDTO {
  id: string;
  userId: string;
  weekNumber: number;
  dayNumber: number;
  output: string;
  tier: "lite" | "full";
  createdAt: string;
}

export async function runMirrorSynthesis(
  _userId: string,
  _weekNumber: number,
  _dayNumber: number,
  _tier: "lite" | "full" = "full",
): Promise<MirrorResponseDTO | null> {
  throw new Error(
    "Legacy daily Mirror synthesis is retired. Resonance generates one run-scoped cumulative Mirror after Day 7.",
  );
}

export async function getMirrorHistory(userId: string): Promise<MirrorResponseDTO[]> {
  const rows = await prisma.mirror_responses.findMany({
    where: { user_id: userId },
    orderBy: { created_at: "desc" },
    select: {
      id: true,
      user_id: true,
      week_number: true,
      day_number: true,
      output: true,
      tier: true,
      created_at: true,
    },
  });

  return rows.map((row) => ({
    id: row.id,
    userId: row.user_id,
    weekNumber: row.week_number,
    dayNumber: row.day_number,
    output: row.output,
    tier: row.tier as "lite" | "full",
    createdAt: row.created_at.toISOString(),
  }));
}
