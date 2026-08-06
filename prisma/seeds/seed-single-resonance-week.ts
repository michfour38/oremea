import { PrismaClient } from "@prisma/client";

import { seedResonanceWeek } from "./resonance-seed-lib";

export async function seedSingleResonanceWeek(weekNumber: number) {
  const prisma = new PrismaClient();
  try {
    await seedResonanceWeek(prisma, weekNumber);
  } finally {
    await prisma.$disconnect();
  }
}
