import { PrismaClient } from "@prisma/client";

import { seedResonanceWeek } from "./resonance-seed-lib";

const prisma = new PrismaClient();
const weekNumber = Number(process.argv[2]);

async function main() {
  if (!Number.isInteger(weekNumber) || weekNumber < 1 || weekNumber > 10) {
    throw new Error("Provide a Resonance week number from 1 through 10.");
  }

  await seedResonanceWeek(prisma, weekNumber);
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
