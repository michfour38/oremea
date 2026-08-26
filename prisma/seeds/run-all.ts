import { PrismaClient } from "@prisma/client";

import { seedAllResonance } from "./resonance-seed-lib";
import { verifyResonanceSeed } from "../scripts/resonance-verify-lib";

const prisma = new PrismaClient();

async function main() {
  await seedAllResonance(prisma);
  await verifyResonanceSeed(prisma);

  console.log("Verified Resonance content seeded.");
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
